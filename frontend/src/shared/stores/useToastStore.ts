import { create } from 'zustand';
import { ToastMessage } from '../types';

interface ToastState {
  toasts: ToastMessage[];
  addToast: {
    (toast: Omit<ToastMessage, 'id'>): void;
    (message: string, type?: 'success' | 'info' | 'error' | 'bag', title?: string): void;
  };
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (arg1: any, arg2: any = 'info', arg3?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    let newToast: ToastMessage;

    if (typeof arg1 === 'string') {
      const type = arg2 || 'info';
      const title =
        arg3 ||
        (type === 'error'
          ? 'Thông Báo'
          : type === 'success'
          ? 'Thành Công'
          : 'Thông Báo Atelier');
      newToast = {
        id,
        type,
        title,
        message: arg1,
      };
    } else {
      newToast = {
        ...arg1,
        id,
        message: arg1.message || arg1.title || '',
      };
    }

    set((state) => ({
      toasts: [...state.toasts.slice(-3), newToast],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4500);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
