import React, { useState, useEffect } from 'react';
import { Sparkles, Globe, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const ANNOUNCEMENTS = [
  {
    text: "RUNWAY FW26 NOW AVAILABLE — COMPLIMENTARY WHITE-GLOVE WORLDWIDE DELIVERY",
    linkText: "DISCOVER",
    linkUrl: "/collections/noir-absolu",
    icon: Sparkles,
  },
  {
    text: "ATELIER WELCOME PRIVILÈGE — USE COURTESY CODE 'VANGUARD15' AT CHECKOUT",
    linkText: "APPLY CODE",
    linkUrl: "/shop",
    icon: Sparkles,
  },
  {
    text: "PRIVATE APPOINTMENTS OPEN AT PLACE VENDÔME & GINZA SALONS",
    linkText: "CONCIERGE",
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
    <aside aria-label="Store announcement" className="relative w-full bg-noir-950 text-white/90 border-b border-white/5 py-2 px-4 text-[11px] font-sans tracking-editorial uppercase z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 flex items-center justify-center gap-2.5 text-center">
          <Icon className="w-3 h-3 text-champagne hidden sm:inline-block animate-pulse" />
          <span className="truncate max-w-[80vw] sm:max-w-none text-white/90 font-light">
            {current.text}
          </span>
          <Link
            to={current.linkUrl}
            className="text-champagne hover:text-champagne-light underline underline-offset-4 font-medium transition-colors ml-1"
          >
            {current.linkText}
          </Link>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="text-white/40 hover:text-white transition-colors p-1 -mr-2"
          aria-label="Dismiss Announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
