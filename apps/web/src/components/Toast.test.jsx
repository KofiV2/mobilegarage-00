import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './Toast';
import { act } from 'react';

// Test component that uses the toast hook
const TestComponent = () => {
  const { showToast, clearAllToasts } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Success message', 'success')}>
        Show Success
      </button>
      <button onClick={() => showToast('Error message', 'error')}>
        Show Error
      </button>
      <button onClick={() => showToast('Warning message', 'warning')}>
        Show Warning
      </button>
      <button onClick={() => showToast('Info message', 'info')}>
        Show Info
      </button>
      <button onClick={() => showToast('Auto-dismiss', 'info', 1000)}>
        Show Auto-dismiss
      </button>
      <button onClick={() => clearAllToasts()}>
        Clear All
      </button>
    </div>
  );
};

describe('Toast', () => {
  beforeEach(() => {
    // Use fake timers with shouldAdvanceTime to allow async operations to work
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('throws error when useToast is used outside ToastProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useToast must be used within a ToastProvider'
    );

    consoleSpy.mockRestore();
  });

  it('shows success toast when showToast is called', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const successButton = screen.getByText('Show Success');
    await user.click(successButton);

    expect(await screen.findByText('Success message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-success');
  });

  it('shows error toast with correct styling', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const errorButton = screen.getByText('Show Error');
    await user.click(errorButton);

    expect(await screen.findByText('Error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-error');
  });

  it('shows warning toast', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const warningButton = screen.getByText('Show Warning');
    await user.click(warningButton);

    expect(await screen.findByText('Warning message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-warning');
  });

  it('shows info toast', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const infoButton = screen.getByText('Show Info');
    await user.click(infoButton);

    expect(await screen.findByText('Info message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-info');
  });

  it('removes toast when close button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const successButton = screen.getByText('Show Success');
    await user.click(successButton);

    expect(await screen.findByText('Success message')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close notification');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  it('auto-dismisses toast after specified duration', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const autoDismissButton = screen.getByText('Show Auto-dismiss');
    await user.click(autoDismissButton);

    expect(await screen.findByText('Auto-dismiss')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Auto-dismiss')).not.toBeInTheDocument();
    });
  });

  it('clears all toasts when clearAllToasts is called', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show multiple toasts
    await user.click(screen.getByText('Show Success'));
    await user.click(screen.getByText('Show Error'));
    await user.click(screen.getByText('Show Info'));

    expect(await screen.findByText('Success message')).toBeInTheDocument();
    expect(await screen.findByText('Error message')).toBeInTheDocument();
    expect(await screen.findByText('Info message')).toBeInTheDocument();

    // Clear all
    await user.click(screen.getByText('Clear All'));

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    });
  });

  it('limits number of toasts to maxToasts', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ToastProvider maxToasts={3}>
        <TestComponent />
      </ToastProvider>
    );

    // Show 4 toasts
    await user.click(screen.getByText('Show Success'));
    await user.click(screen.getByText('Show Error'));
    await user.click(screen.getByText('Show Warning'));
    await user.click(screen.getByText('Show Info'));

    // Only 3 should be visible (oldest removed)
    const toasts = screen.getAllByRole('alert');
    expect(toasts).toHaveLength(3);
  });

  it('has correct ARIA attributes for accessibility', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Error'));

    const toast = await screen.findByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
    expect(toast).toHaveAttribute('aria-label', 'Error notification');
  });
});
