import { createContext } from 'react';
import type { Toast } from '../types/types';

export interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
