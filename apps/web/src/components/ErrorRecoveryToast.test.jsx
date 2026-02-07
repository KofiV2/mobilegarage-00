import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ErrorRecoveryToast, { 
  ErrorRecoveryToastProvider, 
  useErrorRecoveryToast,
  InlineErrorRecovery,
  useErrorRecovery
} from './ErrorRecoveryToast';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

// Test component that uses the hook
const TestConsumer = ({ onMount }) => {
  const methods = useErrorRecoveryToast();

  React.useEffect(() => {
    if (onMount) onMount(methods);
  }, [onMount, methods]);

  return (
    <div>
      <button onClick={() => methods.showError(new Error('Test error'))}>
        Show Error
      </button>
      <button onClick={() => methods.showErrorWithRetry(new Error('Retryable error'), async () => {})}>
        Show Retry Error
      </button>
      <button onClick={methods.clearErrors}>
        Clear Errors
      </button>
    </div>
  );
};

describe('ErrorRecoveryToast', () => {
  describe('Standalone Component', () => {
    it('renders error message', () => {
      render(
        <ErrorRecoveryToast 
          error="Something went wrong"
          onDismiss={() => {}}
        />
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders nothing when no error', () => {
      const { container } = render(
        <ErrorRecoveryToast error={null} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(
        <ErrorRecoveryToast 
          error="Error" 
          onRetry={onRetry}
          onDismiss={() => {}}
        />
      );
      
      fireEvent.click(screen.getByText('common.tryAgain'));
      expect(onRetry).toHaveBeenCalled();
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(
        <ErrorRecoveryToast 
          error="Error" 
          onDismiss={onDismiss}
        />
      );
      
      fireEvent.click(screen.getByText('common.dismiss'));
      expect(onDismiss).toHaveBeenCalled();
    });

    it('auto-hides after delay when enabled', async () => {
      vi.useFakeTimers();
      const onDismiss = vi.fn();
      
      render(
        <ErrorRecoveryToast 
          error="Error" 
          onDismiss={onDismiss}
          autoHide={true}
          autoHideDelay={3000}
        />
      );
      
      expect(onDismiss).not.toHaveBeenCalled();
      
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      expect(onDismiss).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('InlineErrorRecovery', () => {
    it('renders error message', () => {
      render(
        <InlineErrorRecovery error="Inline error" />
      );
      
      expect(screen.getByText('Inline error')).toBeInTheDocument();
    });

    it('renders nothing when no error', () => {
      const { container } = render(
        <InlineErrorRecovery error={null} />
      );
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('useErrorRecovery hook', () => {
    const HookTester = ({ onMount }) => {
      const hookState = useErrorRecovery();
      
      React.useEffect(() => {
        if (onMount) onMount(hookState);
      }, [onMount, hookState]);

      return (
        <div>
          <span data-testid="error">{hookState.error?.message || 'none'}</span>
          <span data-testid="retrying">{hookState.isRetrying ? 'true' : 'false'}</span>
          <button onClick={() => hookState.setError(new Error('Test'))}>Set Error</button>
          <button onClick={hookState.clearError}>Clear</button>
        </div>
      );
    };

    it('initializes with no error', () => {
      render(<HookTester />);
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });

    it('can set error', () => {
      render(<HookTester />);
      fireEvent.click(screen.getByText('Set Error'));
      expect(screen.getByTestId('error')).toHaveTextContent('Test');
    });

    it('can clear error', () => {
      render(<HookTester />);
      fireEvent.click(screen.getByText('Set Error'));
      fireEvent.click(screen.getByText('Clear'));
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });
  });

  describe('Provider-based system', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('renders provider without crashing', () => {
      render(
        <ErrorRecoveryToastProvider>
          <TestConsumer />
        </ErrorRecoveryToastProvider>
      );

      expect(screen.getByText('Show Error')).toBeInTheDocument();
    });

    it('shows error toast when showError is called', async () => {
      render(
        <ErrorRecoveryToastProvider>
          <TestConsumer />
        </ErrorRecoveryToastProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Show Error'));
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('shows retry button when showErrorWithRetry is called', async () => {
      render(
        <ErrorRecoveryToastProvider>
          <TestConsumer />
        </ErrorRecoveryToastProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Show Retry Error'));
      });

      // Find the retry button inside the toast (has class error-recovery-retry-btn)
      expect(screen.getByRole('button', { name: /common\.retry/i })).toBeInTheDocument();
    });

    it('clears all errors when clearErrors is called', async () => {
      render(
        <ErrorRecoveryToastProvider>
          <TestConsumer />
        </ErrorRecoveryToastProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Show Error'));
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByText('Clear Errors'));
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('auto-dismisses error after duration', async () => {
      let hookMethods;

      render(
        <ErrorRecoveryToastProvider>
          <TestConsumer onMount={(methods) => { hookMethods = methods; }} />
        </ErrorRecoveryToastProvider>
      );

      await act(async () => {
        hookMethods.showError(new Error('Test'), { duration: 5000 });
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('limits maximum number of toasts', async () => {
      let hookMethods;

      render(
        <ErrorRecoveryToastProvider maxToasts={2}>
          <TestConsumer onMount={(methods) => { hookMethods = methods; }} />
        </ErrorRecoveryToastProvider>
      );

      await act(async () => {
        hookMethods.showError(new Error('Error 1'), { duration: 0 });
        hookMethods.showError(new Error('Error 2'), { duration: 0 });
        hookMethods.showError(new Error('Error 3'), { duration: 0 });
      });

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBe(2);
    });

    it('throws error when useErrorRecoveryToast is used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useErrorRecoveryToast must be used within an ErrorRecoveryToastProvider');

      consoleSpy.mockRestore();
    });
  });
});
