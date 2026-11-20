import React from 'react';
import { useToastStore } from '../stores/useToastStore';
import { CheckCircle2, AlertCircle, Info, ShoppingBag, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isBag = toast.type === 'bag';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border)] text-[var(--text)] shadow-2xl transition-all duration-300 animate-fade-in hover:border-[var(--accent)]/40"
          >
            {/* Miniature product image or icon */}
            {toast.productImage ? (
              <img
                src={toast.productImage}
                alt=""
                className="w-10 h-12 object-cover rounded bg-[var(--bg-alt)] border border-[var(--border)] flex-shrink-0"
              />
            ) : (
              <div className="p-2 rounded-full bg-[var(--bg-alt)] flex-shrink-0 text-[var(--accent)]">
                {isBag && <ShoppingBag className="w-4 h-4 text-[var(--accent)]" />}
                {isError && <AlertCircle className="w-4 h-4 text-red-500" />}
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-[var(--text-muted)]" />}
              </div>
            )}

            <div className="flex-1 min-w-0 pr-2">
              <h5 className="font-serif text-sm font-medium text-[var(--text)] tracking-wide">
                {toast.title}
              </h5>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug line-clamp-2 font-sans">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 -mr-1 -mt-1 transition-colors"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
