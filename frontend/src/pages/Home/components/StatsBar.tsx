import React, { useEffect, useRef, useState } from 'react';
import { STATS_DATA, StatItem } from '../data/editorialData';

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

interface CountUpDisplayProps {
  item: StatItem;
  trigger: boolean;
  duration?: number;
}

const CountUpDisplay: React.FC<CountUpDisplayProps> = ({ item, trigger, duration = 1500 }) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    if (!trigger) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplayValue(item.value);
      return;
    }

    const start = performance.now();
    let animId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      const current = Math.floor(eased * item.value);

      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(item.value);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [trigger, item.value, duration]);

  const formatted = item.formatLeadingZero || item.value < 10
    ? String(displayValue).padStart(2, '0')
    : String(displayValue);

  return (
    <div className="we-stat-cell">
      <small className="we-stat-label">{item.label}</small>
      <div className="we-stat-value-wrap">
        <strong className="we-stat-number">{formatted}</strong>
        <span className="we-stat-unit">{item.unit}</span>
      </div>
    </div>
  );
};

export const StatsBar: React.FC<{ items?: StatItem[] }> = ({ items = STATS_DATA }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="we-stat-grid" ref={containerRef}>
      {items.map((stat, idx) => (
        <CountUpDisplay key={`${stat.label}-${idx}`} item={stat} trigger={isVisible} duration={1500} />
      ))}
    </div>
  );
};

export default StatsBar;
