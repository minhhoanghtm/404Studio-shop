import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, Lock } from 'lucide-react';

export type SecurityNotificationType = 'info' | 'warning' | 'success' | 'error' | 'lockout';

export interface SecurityNotificationProps {
  type: SecurityNotificationType;
  title: string;
  message: string;
  className?: string;
  actionText?: string;
  onAction?: () => void;
}

export const SecurityNotification: React.FC<SecurityNotificationProps> = ({
  type,
  title,
  message,
  className = '',
  actionText,
  onAction,
}) => {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
          title: 'text-emerald-100',
        };
      case 'warning':
        return {
          container: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
          title: 'text-amber-100',
        };
      case 'error':
        return {
          container: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
          title: 'text-rose-100',
        };
      case 'lockout':
        return {
          container: 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-lg shadow-rose-950/20',
          icon: <Lock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />,
          title: 'text-rose-100',
        };
      case 'info':
      default:
        return {
          container: 'bg-[#d4af37]/10 border-[#d4af37]/30 text-white/90',
          icon: <Info className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />,
          title: 'text-[#d4af37]',
        };
    }
  };

  const current = getStyles();

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border flex items-start gap-3.5 text-xs leading-relaxed transition-all ${current.container} ${className}`}
    >
      {current.icon}
      <div className="flex-1 space-y-1 min-w-0">
        <h4 className={`font-serif uppercase tracking-wider font-semibold text-xs ${current.title}`}>
          {title}
        </h4>
        <p className="text-white/80 font-light">{message}</p>
        {actionText && onAction && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onAction}
              className="text-xs font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity text-white"
            >
              {actionText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
