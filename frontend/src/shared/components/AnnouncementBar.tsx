import React, { useState, useEffect } from 'react';
import { Sparkles, Globe, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { vi } from '../locales/vi/common';

const ANNOUNCEMENTS = [
  {
    text: vi.announcement.runwayNotice,
    linkText: vi.announcement.discover,
    linkUrl: "/collections/noir-absolu",
    icon: Sparkles,
  },
  {
    text: vi.announcement.welcomeDiscount,
    linkText: vi.announcement.applyCode,
    linkUrl: "/products",
    icon: Sparkles,
  },
  {
    text: vi.announcement.salonNotice,
    linkText: vi.announcement.concierge,
    linkUrl: "/contact",
    icon: Globe,
  },
];

export const AnnouncementBar: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  const current = ANNOUNCEMENTS[currentIndex];
  const Icon = current.icon;

  return (
    <aside aria-label="Thông báo cửa hàng" className="relative w-full overflow-hidden bg-ivory-100 text-noir-900 dark:bg-noir-950 dark:text-white/90 border-b border-black/5 dark:border-white/5 py-2 px-3 sm:px-4 text-[11px] font-sans tracking-editorial uppercase z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-hidden">
        <div className="flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2.5 text-center truncate">
          <Icon className="w-3 h-3 text-champagne hidden sm:inline-block animate-pulse shrink-0" />
          <span className="truncate text-noir-800 dark:text-white/90 font-light">
            {current.text}
          </span>
          <Link
            to={current.linkUrl}
            className="text-champagne-dark dark:text-champagne hover:underline underline-offset-4 font-medium transition-colors shrink-0 ml-1"
          >
            {current.linkText}
          </Link>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="text-noir-400 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors p-1 -mr-2"
          aria-label="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
