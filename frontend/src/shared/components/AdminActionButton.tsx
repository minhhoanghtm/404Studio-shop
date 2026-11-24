import React from 'react';
import { Link } from 'react-router-dom';
import {
  Edit3,
  Trash2,
  Eye,
  History,
  LogOut,
  Lock,
  Unlock,
  Loader2,
  LucideIcon,
} from 'lucide-react';

export type ActionButtonVariant =
  | 'edit'
  | 'delete'
  | 'view'
  | 'history'
  | 'terminate'
  | 'lock'
  | 'unlock'
  | 'custom';

export type ActionButtonSize = 'sm' | 'md' | 'lg';

export interface AdminActionButtonProps {
  /** Variant of the action button determining icon, color scheme and semantic role */
  variant?: ActionButtonVariant;
  /** Custom icon component or React element (required if variant='custom') */
  icon?: LucideIcon | React.ReactNode;
  /** Accessible title and tooltip */
  title: string;
  /** Optional accessible aria-label (defaults to title) */
  ariaLabel?: string;
  /** Optional click handler (when rendered as button) */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** If provided, renders as react-router-dom Link (unless disabled) */
  to?: string;
  /** Target attribute for link (e.g. '_blank') */
  target?: string;
  /** Rel attribute for link */
  rel?: string;
  /** Whether the action is currently performing an async request */
  loading?: boolean;
  /** Whether the action button is disabled */
  disabled?: boolean;
  /** Size variant: 'sm' (icon 14px, p-1), 'md' (icon 16px, p-1.5), 'lg' (icon 18px, p-2) */
  size?: ActionButtonSize;
  /** Whether to show a permanent subtle border around the button */
  bordered?: boolean;
  /** Optional text label to display next to the icon */
  label?: React.ReactNode;
  /** Additional custom Tailwind CSS classes */
  className?: string;
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset';
}

const variantConfig: Record<
  ActionButtonVariant,
  {
    defaultIcon: LucideIcon;
    colorClasses: string;
    loadingColor: string;
  }
> = {
  edit: {
    defaultIcon: Edit3,
    colorClasses:
      'text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10',
    loadingColor: 'text-[var(--accent)]',
  },
  delete: {
    defaultIcon: Trash2,
    colorClasses:
      'text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10',
    loadingColor: 'text-rose-500',
  },
  view: {
    defaultIcon: Eye,
    colorClasses:
      'text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--bg-alt)]',
    loadingColor: 'text-[var(--text)]',
  },
  history: {
    defaultIcon: History,
    colorClasses:
      'text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10',
    loadingColor: 'text-[var(--accent)]',
  },
  terminate: {
    defaultIcon: LogOut,
    colorClasses:
      'text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10',
    loadingColor: 'text-rose-500',
  },
  lock: {
    defaultIcon: Lock,
    colorClasses:
      'text-[var(--text-muted)] hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10',
    loadingColor: 'text-amber-500',
  },
  unlock: {
    defaultIcon: Unlock,
    colorClasses:
      'text-[var(--text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10',
    loadingColor: 'text-emerald-500',
  },
  custom: {
    defaultIcon: Edit3,
    colorClasses:
      'text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--bg-alt)]',
    loadingColor: 'text-[var(--accent)]',
  },
};

const sizeClasses: Record<ActionButtonSize, { container: string; icon: string }> = {
  sm: {
    container: 'p-1 text-xs gap-1',
    icon: 'w-3.5 h-3.5',
  },
  md: {
    container: 'p-1.5 text-xs gap-1.5',
    icon: 'w-4 h-4',
  },
  lg: {
    container: 'p-2 text-sm gap-2',
    icon: 'w-4.5 h-4.5',
  },
};

/**
 * AdminActionButton
 *
 * Unified, accessible action button component for Admin tables, cards, and lists.
 * Standardizes visual styling, hover highlights, loading states, and keyboard navigation across all admin subpages.
 */
export const AdminActionButton: React.FC<AdminActionButtonProps> = ({
  variant = 'custom',
  icon,
  title,
  ariaLabel,
  onClick,
  to,
  target,
  rel,
  loading = false,
  disabled = false,
  size = 'md',
  bordered = true,
  label,
  className = '',
  type = 'button',
}) => {
  const config = variantConfig[variant] || variantConfig.custom;
  const currentSize = sizeClasses[size] || sizeClasses.md;
  const isDisabled = disabled || loading;
  const accessibleLabel = ariaLabel || title;

  // Render Icon logic
  const renderIcon = () => {
    if (loading) {
      return (
        <Loader2
          className={`${currentSize.icon} animate-spin ${config.loadingColor}`}
          aria-hidden="true"
        />
      );
    }

    if (icon) {
      if (typeof icon === 'function' || (typeof icon === 'object' && 'render' in (icon as any))) {
        const IconComponent = icon as LucideIcon;
        return <IconComponent className={currentSize.icon} aria-hidden="true" />;
      }
      return <span className="inline-flex shrink-0">{icon}</span>;
    }

    const DefaultIcon = config.defaultIcon;
    return <DefaultIcon className={currentSize.icon} aria-hidden="true" />;
  };

  const baseClasses = `inline-flex items-center justify-center rounded-sm transition-all duration-150 shrink-0 cursor-pointer select-none active:scale-95 ${
    bordered
      ? 'border border-[var(--border)] bg-[var(--surface)]'
      : 'border border-transparent bg-transparent'
  } ${currentSize.container} ${config.colorClasses} ${
    isDisabled ? 'opacity-40 pointer-events-none cursor-not-allowed' : ''
  } ${className}`;

  // If `to` is provided and not disabled, render as React Router Link
  if (to && !isDisabled) {
    return (
      <Link
        to={to}
        target={target}
        rel={rel}
        className={baseClasses}
        title={title}
        aria-label={accessibleLabel}
      >
        {renderIcon()}
        {label && <span className="font-mono text-xs">{label}</span>}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={baseClasses}
      title={title}
      aria-label={accessibleLabel}
    >
      {renderIcon()}
      {label && <span className="font-mono text-xs">{label}</span>}
    </button>
  );
};

/**
 * Convenience shortcuts for common admin table actions
 */

export const EditActionButton: React.FC<Omit<AdminActionButtonProps, 'variant'>> = (props) => (
  <AdminActionButton variant="edit" {...props} />
);

export const DeleteActionButton: React.FC<Omit<AdminActionButtonProps, 'variant'>> = (props) => (
  <AdminActionButton variant="delete" {...props} />
);

export const ViewActionButton: React.FC<Omit<AdminActionButtonProps, 'variant'>> = (props) => (
  <AdminActionButton variant="view" {...props} />
);

export const HistoryActionButton: React.FC<Omit<AdminActionButtonProps, 'variant'>> = (props) => (
  <AdminActionButton variant="history" {...props} />
);

export const LockActionButton: React.FC<Omit<AdminActionButtonProps, 'variant'>> = (props) => (
  <AdminActionButton variant="lock" {...props} />
);

export const UnlockActionButton: React.FC<Omit<AdminActionButtonProps, 'variant'>> = (props) => (
  <AdminActionButton variant="unlock" {...props} />
);

/**
 * AdminActionGroup: Flex container for table action column cells
 */
export const AdminActionGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`inline-flex items-center justify-end gap-1.5 ${className}`}>
    {children}
  </div>
);
