import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'info'
  | 'purple';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  uppercase?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  neutral: {
    container:
      'bg-zinc-200/90 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700',
    dot: 'bg-zinc-500 dark:bg-zinc-400',
  },
  success: {
    container:
      'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  warning: {
    container:
      'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/30',
    dot: 'bg-amber-500',
  },
  danger: {
    container:
      'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30',
    dot: 'bg-rose-500',
  },
  accent: {
    container:
      'bg-[var(--accent)]/15 text-[#856404] dark:text-[var(--accent)] border-[var(--accent)]/35',
    dot: 'bg-[var(--accent)]',
  },
  info: {
    container:
      'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30',
    dot: 'bg-blue-500',
  },
  purple: {
    container:
      'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30',
    dot: 'bg-purple-500',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[9px] gap-1',
  md: 'px-2.5 py-0.5 text-[10px] gap-1.5',
  lg: 'px-3 py-1 text-xs gap-2',
};

/**
 * StatusBadge (Label Component)
 *
 * Unified, accessible badge/label component for status pills, counters, tags, and category labels.
 * Guarantees high-contrast readability across both Light Mode and Dark Mode.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  icon,
  uppercase = false,
  className = '',
  ...rest
}) => {
  const currentVariant = variantStyles[variant] || variantStyles.neutral;
  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`inline-flex items-center justify-center font-mono font-semibold rounded-full border transition-colors shrink-0 select-none shadow-xs ${currentVariant.container} ${currentSize} ${
        uppercase ? 'uppercase tracking-wider' : 'tracking-normal'
      } ${className}`}
      {...rest}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentVariant.dot} ${
            pulse ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};

// Convenient alias
export const Badge = StatusBadge;
