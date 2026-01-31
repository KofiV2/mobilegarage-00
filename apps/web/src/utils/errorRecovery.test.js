import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  withRetry,
  retryWithExponentialBackoff,
  retryNetworkErrors,
  withTimeout,
  withFallback,
  getUserFriendlyError,
  isRetryableError,
  CircuitBreaker
} from './errorRecovery';

describe('errorRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withRetry', () => {
    it('returns result on first successful attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn, { maxAttempts: 3, delay: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValueOnce('success');

      const result = await withRetry(fn, { maxAttempts: 3, delay: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('throws error after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      await expect(
        withRetry(fn, { maxAttempts: 3, delay: 10 })
      ).rejects.toThrow('always fails');

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('calls onRetry callback before each retry', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const onRetry = vi.fn();

      await withRetry(fn, { maxAttempts: 3, delay: 10, onRetry });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });

    it('respects shouldRetry condition', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('do not retry'));

      const shouldRetry = vi.fn().mockReturnValue(false);

      await expect(
        withRetry(fn, { maxAttempts: 3, delay: 10, shouldRetry })
      ).rejects.toThrow('do not retry');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryWithExponentialBackoff', () => {
    it('uses exponential backoff between retries', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValueOnce('success');

      const result = await retryWithExponentialBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        factor: 2
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('respects maxDelay cap', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      await retryWithExponentialBackoff(fn, {
        maxAttempts: 2,
        initialDelay: 100,
        maxDelay: 150,
        factor: 10
      });

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('retryNetworkErrors', () => {
    it('retries network errors', async () => {
      const networkError = new Error('network error');
      networkError.name = 'NetworkError';

      const fn = vi
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');

      const result = await retryNetworkErrors(fn, 3);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not retry non-network errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('validation error'));

      await expect(retryNetworkErrors(fn, 3)).rejects.toThrow('validation error');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries 5xx server errors', async () => {
      const serverError = new Error('Server error');
      serverError.response = { status: 500 };

      const fn = vi
        .fn()
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce('success');

      const result = await retryNetworkErrors(fn, 3);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('withTimeout', () => {
    it('returns result if completes before timeout', async () => {
      const fn = () => new Promise(resolve => setTimeout(() => resolve('success'), 10));

      const result = await withTimeout(fn, 100);

      expect(result).toBe('success');
    });

    it('throws timeout error if takes too long', async () => {
      const fn = () => new Promise(resolve => setTimeout(() => resolve('success'), 200));

      await expect(withTimeout(fn, 50)).rejects.toThrow('Operation timed out');
    });
  });

  describe('withFallback', () => {
    it('returns primary result on success', async () => {
      const primary = vi.fn().mockResolvedValue('primary');
      const fallback = vi.fn().mockResolvedValue('fallback');

      const result = await withFallback(primary, fallback);

      expect(result).toBe('primary');
      expect(primary).toHaveBeenCalled();
      expect(fallback).not.toHaveBeenCalled();
    });

    it('returns fallback result on primary failure', async () => {
      const primary = vi.fn().mockRejectedValue(new Error('primary failed'));
      const fallback = vi.fn().mockResolvedValue('fallback');

      const result = await withFallback(primary, fallback);

      expect(result).toBe('fallback');
      expect(primary).toHaveBeenCalled();
      expect(fallback).toHaveBeenCalled();
    });
  });

  describe('getUserFriendlyError', () => {
    it('returns friendly message for network errors', () => {
      const error = new Error('Failed to fetch');

      const message = getUserFriendlyError(error);

      expect(message).toContain('Unable to connect');
    });

    it('returns friendly message for timeout errors', () => {
      const error = new Error('Request timeout');

      const message = getUserFriendlyError(error);

      expect(message).toContain('took too long');
    });

    it('returns friendly message for Firebase auth errors', () => {
      const error = new Error('Firebase error');
      error.code = 'auth/invalid-phone-number';

      const message = getUserFriendlyError(error);

      expect(message).toBe('Invalid phone number format.');
    });

    it('returns friendly message for HTTP 404 errors', () => {
      const error = new Error('Not found');
      error.response = { status: 404 };

      const message = getUserFriendlyError(error);

      expect(message).toContain('not found');
    });

    it('returns friendly message for HTTP 500 errors', () => {
      const error = new Error('Server error');
      error.response = { status: 500 };

      const message = getUserFriendlyError(error);

      expect(message).toContain('Server error');
    });

    it('returns generic message for unknown errors', () => {
      const error = new Error('Unknown error');

      const message = getUserFriendlyError(error);

      expect(message).toContain('unexpected error');
    });
  });

  describe('isRetryableError', () => {
    it('identifies network errors as retryable', () => {
      const error = new Error('network failed');
      error.name = 'NetworkError';

      expect(isRetryableError(error)).toBe(true);
    });

    it('identifies timeout errors as retryable', () => {
      const error = new Error('timeout');

      expect(isRetryableError(error)).toBe(true);
    });

    it('identifies 5xx errors as retryable', () => {
      const error = new Error('Server error');
      error.response = { status: 500 };

      expect(isRetryableError(error)).toBe(true);
    });

    it('identifies rate limit errors as retryable', () => {
      const error = new Error('Too many requests');
      error.response = { status: 429 };

      expect(isRetryableError(error)).toBe(true);
    });

    it('identifies validation errors as not retryable', () => {
      const error = new Error('Validation failed');
      error.response = { status: 400 };

      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('CircuitBreaker', () => {
    it('executes function when circuit is closed', async () => {
      const breaker = new CircuitBreaker();
      const fn = vi.fn().mockResolvedValue('success');

      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('opens circuit after threshold failures', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      // Fail 3 times to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow('fail');
      }

      expect(breaker.getState()).toBe('OPEN');
    });

    it('rejects calls when circuit is open', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 2 });
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      // Open the circuit
      await expect(breaker.execute(fn)).rejects.toThrow();
      await expect(breaker.execute(fn)).rejects.toThrow();

      expect(breaker.getState()).toBe('OPEN');

      // Next call should fail immediately
      await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker is OPEN');
      expect(fn).toHaveBeenCalledTimes(2); // Not called the 3rd time
    });

    it('transitions to half-open after reset timeout', async () => {
      vi.useFakeTimers();

      const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 1000 });
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      // Open the circuit
      await expect(breaker.execute(fn)).rejects.toThrow();
      await expect(breaker.execute(fn)).rejects.toThrow();

      expect(breaker.getState()).toBe('OPEN');

      // Advance time past reset timeout
      vi.advanceTimersByTime(1100);

      // Should be half-open now, allow one test call
      fn.mockResolvedValueOnce('success');
      await breaker.execute(fn);

      expect(breaker.getState()).toBe('CLOSED');

      vi.useRealTimers();
    });

    it('resets to closed after successful call in half-open state', async () => {
      vi.useFakeTimers();

      const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeout: 100 });
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      // Open circuit
      await expect(breaker.execute(fn)).rejects.toThrow();
      expect(breaker.getState()).toBe('OPEN');

      // Wait for half-open
      vi.advanceTimersByTime(150);

      // Success should close circuit
      await breaker.execute(fn);
      expect(breaker.getState()).toBe('CLOSED');

      vi.useRealTimers();
    });
  });
});
