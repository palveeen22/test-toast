import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { Toast } from '../types/types';

const DEFAULT_DURATION = 3000;

interface ToastItemProps {
  toast: Toast & { resetKey: number };
  onRemove: (id: string) => void;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [prevResetKey, setPrevResetKey] = useState(toast.resetKey);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef(toast.duration || DEFAULT_DURATION);
  const startTimeRef = useRef(0);
  const isPausedRef = useRef(false);

  const duration = toast.duration || DEFAULT_DURATION;

  // Reset exit animation during render when resetKey changes
  if (prevResetKey !== toast.resetKey) {
    setPrevResetKey(toast.resetKey);
    setIsExiting(false);
  }

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startDismiss = useCallback(() => {
    setIsExiting(true);
    dismissTimerRef.current = setTimeout(() => onRemove(toast.id), 300);
  }, [onRemove, toast.id]);

  const startTimer = useCallback(() => {
    clearTimer();
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(startDismiss, remainingRef.current);
  }, [clearTimer, startDismiss]);

  // Start/reset timer on mount and when resetKey changes
  useEffect(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    remainingRef.current = duration;
    isPausedRef.current = false;
    startTimer();

    return () => {
      clearTimer();
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [toast.resetKey, duration, startTimer, clearTimer]);

  const handleMouseEnter = useCallback(() => {
    if (isPausedRef.current) return;
    isPausedRef.current = true;
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(remainingRef.current - elapsed, 0);
    clearTimer();
  }, [clearTimer]);

  const handleMouseLeave = useCallback(() => {
    if (!isPausedRef.current) return;
    isPausedRef.current = false;
    startTimer();
  }, [startTimer]);

  const handleClose = useCallback(() => {
    clearTimer();
    startDismiss();
  }, [clearTimer, startDismiss]);

  return (
    <div
      className={`toast toast-${toast.type}${isExiting ? ' toast-exit' : ' toast-enter'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span>{toast.message}</span>
      <button onClick={handleClose}>✕</button>
    </div>
  );
};
