import React, { useRef, useEffect } from 'react';

export interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  disabled?: boolean;
  length?: number;
  hasError?: boolean;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  disabled = false,
  length = 6,
  hasError = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into an array of digits
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && !disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Take only the last digit entered
    const digit = rawVal.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    const newOtp = newDigits.join('').slice(0, length);
    onChange(newOtp);

    // Auto-focus next input if a digit was entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move to previous input and clear it
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);
    // Focus the box corresponding to the pasted length or the last box
    const focusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div
      role="group"
      aria-label="Nhập mã xác minh OTP 6 chữ số"
      className="flex items-center justify-center gap-2 sm:gap-3"
    >
      {Array.from({ length }).map((_, index) => {
        const isCurrentFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            value={digits[index]}
            data-testid={`otp-digit-${index}`}
            aria-label={`Mã OTP chữ số ${index + 1}`}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold rounded-xl border transition-all outline-none ${
              hasError
                ? 'border-rose-500/80 bg-rose-500/10 text-rose-200 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                : isCurrentFilled
                ? 'border-[#d4af37] bg-white/[0.04] text-white'
                : 'border-white/15 bg-white/[0.02] text-white/90 hover:border-white/30 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50'
            } ${disabled ? 'opacity-40 cursor-not-allowed bg-black/40' : ''}`}
          />
        );
      })}
    </div>
  );
};
