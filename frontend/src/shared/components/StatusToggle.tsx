import React from 'react';

export interface StatusToggleProps {
  /** Current checked/active state */
  checked: boolean;
  /** Callback fired when state changes */
  onChange: (checked: boolean) => void;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Accent color variant when active */
  color?: 'accent' | 'danger' | 'success' | 'amber';
  /** Optional label text or element */
  label?: React.ReactNode;
  /** Optional description text underneath the label */
  description?: string;
  /** Optional badge or text shown on active state */
  activeLabel?: string;
  /** Optional badge or text shown on inactive state */
  inactiveLabel?: string;
  /** Accessible label if no visible label is provided */
  ariaLabel?: string;
  /** HTML ID for accessibility */
  id?: string;
  /** Additional container class */
  className?: string;
}

export const StatusToggle: React.FC<StatusToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  color = 'success',
  label,
  description,
  activeLabel,
  inactiveLabel,
  ariaLabel,
  id,
  className = '',
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  // High-contrast, theme-resilient color mappings:
  // - Inactive: Solid zinc-300 (light) / zinc-700 (dark) with clear border so it never blends with card backgrounds
  // - Active: Vibrant solid emerald-600 by default (matching UI standard across all admin modules), or danger/amber/accent when explicitly requested
  const inactiveTrackClass =
    'bg-zinc-300 dark:bg-zinc-700 border border-zinc-400 dark:border-zinc-600 shadow-inner';

  let activeTrackClass = 'bg-emerald-600 border border-emerald-600 shadow-xs';
  let ringClass = 'focus-visible:ring-emerald-500';

  if (color === 'danger') {
    activeTrackClass = 'bg-red-600 border border-red-600 shadow-xs';
    ringClass = 'focus-visible:ring-red-500';
  } else if (color === 'amber') {
    activeTrackClass = 'bg-amber-600 border border-amber-600 shadow-xs';
    ringClass = 'focus-visible:ring-amber-500';
  } else if (color === 'accent') {
    activeTrackClass = 'bg-[var(--accent)] border border-[var(--accent)] shadow-xs';
    ringClass = 'focus-visible:ring-[var(--accent)]';
  }

  const trackBg = checked ? activeTrackClass : inactiveTrackClass;

  // Size mappings (Default 'md' is 44x24px with 18px thumb & 3px padding, exactly matching standard toggle UI)
  let trackSizeClass = 'w-11 h-6';
  let thumbSizeClass = 'w-[18px] h-[18px]';
  let thumbTranslateClass = checked ? 'translate-x-[20px]' : 'translate-x-[2px]';

  if (size === 'sm') {
    trackSizeClass = 'w-9 h-5';
    thumbSizeClass = 'w-[14px] h-[14px]';
    thumbTranslateClass = checked ? 'translate-x-[16px]' : 'translate-x-[2px]';
  } else if (size === 'lg') {
    trackSizeClass = 'w-14 h-7';
    thumbSizeClass = 'w-[22px] h-[22px]';
    thumbTranslateClass = checked ? 'translate-x-[28px]' : 'translate-x-[2px]';
  }

  // Thumb: Solid crisp white with shadow & subtle border to ensure it pops out clearly on any track background
  const thumbClass = `pointer-events-none inline-block rounded-full bg-white shadow-md border border-black/10 dark:border-white/20 transform transition-transform duration-200 ease-in-out ${thumbSizeClass} ${thumbTranslateClass}`;

  const switchButton = (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel || (typeof label === 'string' ? label : 'Nút gạt trạng thái')}
      disabled={disabled}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 ${ringClass} focus-visible:ring-offset-2 hover:opacity-95 active:scale-95 ${trackSizeClass} ${trackBg} ${
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
      } ${!label && !description && !activeLabel && !inactiveLabel ? className : ''}`}
    >
      <span className={thumbClass} />
    </button>
  );

  // If only activeLabel or inactiveLabel is provided alongside the toggle (compact table cell mode)
  if (!label && !description && (activeLabel || inactiveLabel)) {
    const currentLabel = checked ? activeLabel : inactiveLabel;
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {switchButton}
        {currentLabel && (
          <span
            className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border whitespace-nowrap transition-colors duration-200 ${
              checked
                ? color === 'danger'
                  ? 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30 font-semibold'
                  : color === 'amber'
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-semibold'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            {currentLabel}
          </span>
        )}
      </div>
    );
  }

  // If no label or description is provided, render just the standalone switch button
  if (!label && !description) {
    return switchButton;
  }

  // If label/description is provided, render a structured status row
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2">
          {label && (
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {label}
            </span>
          )}
          {(activeLabel || inactiveLabel) && (
            <span
              className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border transition-colors duration-200 ${
                checked
                  ? color === 'danger'
                    ? 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30 font-semibold'
                    : color === 'amber'
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-semibold'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
              }`}
            >
              {checked ? (activeLabel || 'Đang Bật') : (inactiveLabel || 'Đang Tắt')}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed max-w-xl">
            {description}
          </p>
        )}
      </div>

      <div className="shrink-0">{switchButton}</div>
    </div>
  );
};

export default StatusToggle;
