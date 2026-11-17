import React from 'react';
import { useConsentStore } from './useConsentStore';
import { ConsentCategories } from './types';
import { ShieldAlert } from 'lucide-react';

interface ConsentGateProps {
  category: keyof ConsentCategories;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ConsentGate: React.FC<ConsentGateProps> = ({ category, children, fallback }) => {
  const isAllowed = useConsentStore((state) => {
    if (category === 'necessary') return true;
    return Boolean(state.consentRecord?.categories[category]);
  });

  const openPreferences = useConsentStore((state) => state.openPreferences);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  const categoryLabels: Record<keyof ConsentCategories, string> = {
    necessary: 'Thiết yếu',
    analytics: 'Phân tích & Đo lường',
    personalization: 'Cá nhân hóa',
    marketing: 'Tiếp thị & Quảng cáo',
  };

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] text-center space-y-2 text-xs text-white/60">
      <div className="flex items-center justify-center gap-1.5 text-white/80 font-medium">
        <ShieldAlert className="w-4 h-4 text-[#d4af37]" />
        <span>Tính năng yêu cầu quyền: {categoryLabels[category]}</span>
      </div>
      <p className="max-w-md mx-auto text-[11px] text-white/50">
        Để kích hoạt tính năng này, quý khách vui lòng cấp quyền cho nhóm cookie tương ứng trong bảng điều khiển quyền riêng tư.
      </p>
      <button
        type="button"
        onClick={openPreferences}
        className="px-3 py-1.5 rounded-lg border border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors uppercase tracking-wider text-[10px] font-medium"
      >
        Mở bảng tùy chọn Cookie
      </button>
    </div>
  );
};
