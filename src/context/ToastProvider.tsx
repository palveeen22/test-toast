import React, { useCallback, useState, type ReactNode } from 'react';
import type { Toast } from '../types/types';
import { ToastContext } from './ToastContext';
import { ToastItem } from '../components/ToastItem';

let toastCounter = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<(Toast & { resetKey: number })[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    setToasts(prev => {
      // same message + type => reset timer of existing toast
      const existing = prev.find(t => t.message === toast.message && t.type === toast.type);
      if (existing) {
        return prev.map(t =>
          t.id === existing.id ? { ...t, resetKey: t.resetKey + 1 } : t
        );
      }

      return [...prev, { ...toast, id: String(++toastCounter), resetKey: 0 }];
    });
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-list">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
