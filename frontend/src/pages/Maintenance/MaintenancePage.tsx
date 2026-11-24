import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Clock, RefreshCw, Lock, Mail, Phone } from 'lucide-react';
import { useWebsiteSettingsStore } from '../../shared/stores/useWebsiteSettingsStore';

export const MaintenancePage: React.FC = () => {
  const {
    maintenanceMessage,
    maintenanceUntil,
    siteName,
    hotline,
    email,
    fetchSettings,
  } = useWebsiteSettingsStore();

  const [isChecking, setIsChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Countdown timer calculation if maintenanceUntil is set
  useEffect(() => {
    if (!maintenanceUntil) {
      setTimeLeft('');
      return;
    }

    const calculateTime = () => {
      const target = new Date(maintenanceUntil).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Sắp hoàn tất trong giây lát');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours} giờ ${minutes} phút`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes} phút ${seconds} giây`);
      } else {
        setTimeLeft(`${seconds} giây`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [maintenanceUntil]);

  // Periodic auto-check every 20 seconds to see if maintenance mode has been turned off
  useEffect(() => {
    const pollInterval = setInterval(() => {
      void fetchSettings();
    }, 20000);

    return () => clearInterval(pollInterval);
  }, [fetchSettings]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await fetchSettings();
    } finally {
      setTimeout(() => setIsChecking(false), 600);
    }
  };

  const formattedUntil = maintenanceUntil
    ? new Date(maintenanceUntil).toLocaleString('vi-VN', {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-between p-6 sm:p-12 relative overflow-hidden transition-colors duration-300">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Brand Header */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg tracking-widest text-[var(--accent)] font-semibold uppercase">
            {siteName || 'Atelier Vérité'}
          </span>
          <span className="hidden sm:inline text-[10px] uppercase font-mono tracking-ultra text-[var(--text-muted)] border-l border-[var(--border)] pl-3">
            Haute Couture & Tailoring
          </span>
        </div>

        <button
          onClick={handleManualCheck}
          disabled={isChecking}
          className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors px-3 py-1.5 rounded border border-[var(--border)] hover:border-[var(--accent)]"
          title="Kiểm tra lại trạng thái hệ thống"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-[var(--accent)]' : ''}`} />
          <span className="hidden sm:inline">Kiểm tra lại</span>
        </button>
      </header>

      {/* Main Content Card */}
      <main className="w-full max-w-xl my-auto text-center space-y-6 z-10 py-10">
        {/* Animated Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center relative shadow-xl">
          <div className="absolute inset-0 rounded-full border border-[var(--accent)]/30 animate-ping opacity-40" />
          <ShieldAlert className="w-9 h-9 text-[var(--accent)]" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-[11px] font-mono tracking-wider uppercase">
          <Lock className="w-3 h-3" />
          <span>Hệ Thống Đang Nâng Cấp Kỹ Thuật</span>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight text-[var(--text)] font-normal leading-snug">
            Không Gian Tạm Đóng Cửa Để Bảo Trì
          </h1>
          <p className="text-sm text-[var(--text-muted)] font-serif italic max-w-md mx-auto">
            Maison Atelier Vérité đang tiến hành nâng cấp hệ thống máy chủ để mang đến trải nghiệm thượng lưu trọn vẹn nhất cho quý khách.
          </p>
        </div>

        {/* Announcement Message Box */}
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-sm text-left shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] block mb-2 font-medium">
            Thông Báo Từ Ban Điều Hành
          </span>
          <p className="text-xs sm:text-sm leading-relaxed text-[var(--text)] font-sans">
            {maintenanceMessage}
          </p>
        </div>

        {/* Estimated Reopening Time */}
        {formattedUntil && (
          <div className="p-4 bg-[var(--bg-card-muted)] border border-[var(--border)] rounded-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Clock className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>Dự kiến mở lại cửa hàng:</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-medium text-[var(--accent)] block text-xs">
                {formattedUntil}
              </span>
              {timeLeft && (
                <span className="text-[10px] font-mono text-[var(--text-muted)] block">
                  (Còn khoảng: {timeLeft})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Concierge & Support Details */}
        {(hotline || email) && (
          <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)] font-mono">
            {hotline && (
              <a
                href={`tel:${hotline.replace(/\s+/g, '')}`}
                className="flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Concierge: {hotline}</span>
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>{email}</span>
              </a>
            )}
          </div>
        )}
      </main>

      {/* Bottom Footer & Admin Login Entrypoint */}
      <footer className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[var(--text-muted)] border-t border-[var(--border)] pt-6 z-10">
        <span>© {new Date().getFullYear()} {siteName || 'Atelier Vérité'}. Bảo lưu mọi quyền.</span>

        <div className="flex items-center gap-2">
          <span>Dành cho Quản trị viên:</span>
          <Link
            to="/login"
            className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>Đăng nhập hệ thống</span>
            <span>→</span>
          </Link>
        </div>
      </footer>
    </div>
  );
};
