import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { ToastProvider } from '../context/ToastProvider';
import { useToast } from '../context/useToast';

// some test for toast ))
const TestTrigger = ({
  message = 'Test message',
  type = 'success' as const,
  duration = 3000,
}) => {
  const { addToast } = useToast();
  return (
    <button onClick={() => addToast({ message, type, duration })}>
      Add Toast
    </button>
  );
};

describe('Toast Notification System', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('displays a toast when addToast is called', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Toast'));
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('auto-dismisses toast after duration', () => {
    render(
      <ToastProvider>
        <TestTrigger duration={3000} />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Toast'));
    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Past duration (3s) + exit animation (300ms)
    act(() => vi.advanceTimersByTime(3300));

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('pauses timer on mouse enter — toast persists past duration', () => {
    render(
      <ToastProvider>
        <TestTrigger duration={3000} />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Toast'));
    const toastEl = screen.getByText('Test message').closest('.toast')!;

    // Wait 2 seconds
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Hover over toast
    fireEvent.mouseEnter(toastEl);

    // Wait 3 more seconds (well past the original 3s duration)
    act(() => vi.advanceTimersByTime(3000));

    // Toast should still be visible because timer is paused
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('resumes timer from paused position on mouse leave', () => {
    render(
      <ToastProvider>
        <TestTrigger duration={3000} />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Toast'));
    const toastEl = screen.getByText('Test message').closest('.toast')!;

    // Wait 2 seconds (1 second remaining)
    act(() => vi.advanceTimersByTime(2000));

    // Pause
    fireEvent.mouseEnter(toastEl);
    act(() => vi.advanceTimersByTime(5000)); // <==== wait while paused

    // Resume — 1 second should remain
    fireEvent.mouseLeave(toastEl);

    // After 500ms — should still be visible
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText('Test message')).toBeInTheDocument();

    // After remaining 500ms + animation 300ms — should be gone
    act(() => vi.advanceTimersByTime(800));
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('deduplicates toasts with same message and type', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Toast'));
    fireEvent.click(screen.getByText('Add Toast'));

    // Should only have one toast, not two
    const toasts = screen.getAllByText('Test message');
    expect(toasts).toHaveLength(1);
  });

  it('resets timer on deduplication so toast lives longer', () => {
    render(
      <ToastProvider>
        <TestTrigger duration={3000} />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Toast'));

    // Wait 2 seconds
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Trigger same toast again — resets timer to full 3s
    fireEvent.click(screen.getByText('Add Toast'));

    // Wait 2 more seconds (4s total since first, 2s since reset)
    act(() => vi.advanceTimersByTime(2000));

    // Should still be visible (only 2s of 3s since reset)
    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Wait remaining 1s + animation
    act(() => vi.advanceTimersByTime(1300));
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('allows different toasts with different messages', () => {
    const MultiTrigger = () => {
      const { addToast } = useToast();
      return (
        <>
          <button onClick={() => addToast({ message: 'First', type: 'success' })}>
            Add First
          </button>
          <button onClick={() => addToast({ message: 'Second', type: 'success' })}>
            Add Second
          </button>
        </>
      );
    };

    render(
      <ToastProvider>
        <MultiTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add First'));
    fireEvent.click(screen.getByText('Add Second'));

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('removes toast when close button is clicked', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Toast'));
    const toastEl = screen.getByText('Test message').closest('.toast')!;
    const closeBtn = toastEl.querySelector('button')!;

    fireEvent.click(closeBtn);

    // Wait for exit animation
    act(() => vi.advanceTimersByTime(300));

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });
});
