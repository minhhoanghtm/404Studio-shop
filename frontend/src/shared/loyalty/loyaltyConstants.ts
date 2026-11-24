import { TierDefinition, TierFamily } from './types';

/**
 * Currency conversion rate: 10.000 VND eligible amount = 1 loyalty point
 */
export const VND_PER_POINT = 10000;

export const RULE_VERSION = 'v1.0';

/**
 * 12-Tier Membership Hierarchy (Ascending Order)
 */
export const MEMBERSHIP_TIERS: TierDefinition[] = [
  // --- ĐỒNG (BRONZE) ---
  {
    id: 'bronze_1',
    nameVi: 'Đồng I',
    nameEn: 'Bronze I',
    family: 'bronze',
    level: 1,
    minPoints: 0,
    badgeColor: 'text-amber-600 border-amber-600/40 bg-amber-600/10',
    gradient: 'from-[#3a2012] via-[#24140b] to-[#120a06]',
    benefits: [
      'Ghi danh thành viên thân thiết chính thức của Atelier Vérité',
      'Tích lũy 1 điểm cho mỗi 10.000 ₫ mua sắm hợp lệ',
      'Bản tin thời trang & Lookbook ấn bản kỹ thuật số độc quyền',
    ],
  },
  {
    id: 'bronze_2',
    nameVi: 'Đồng II',
    nameEn: 'Bronze II',
    family: 'bronze',
    level: 2,
    minPoints: 100,
    badgeColor: 'text-amber-500 border-amber-500/40 bg-amber-500/10',
    gradient: 'from-[#422515] via-[#2a170d] to-[#140b07]',
    benefits: [
      'Toàn bộ đặc quyền của hạng Đồng I',
      'Ưu đãi quà tặng kỷ niệm gia nhập Maison',
      'Hỗ trợ đóng gói quà tặng cao cấp tiêu chuẩn Haute Joaillerie',
    ],
  },
  {
    id: 'bronze_3',
    nameVi: 'Đồng III',
    nameEn: 'Bronze III',
    family: 'bronze',
    level: 3,
    minPoints: 250,
    badgeColor: 'text-amber-400 border-amber-400/40 bg-amber-400/10',
    gradient: 'from-[#4d2c19] via-[#321c10] to-[#180e08]',
    benefits: [
      'Toàn bộ đặc quyền của hạng Đồng II',
      'Ưu tiên đặt trước thiết kế trong các đợt phát hành theo mùa',
      'Tư vấn trực tiếp cùng chuyên viên qua đường dây nóng riêng',
    ],
  },

  // --- BẠC (SILVER) ---
  {
    id: 'silver_1',
    nameVi: 'Bạc I',
    nameEn: 'Silver I',
    family: 'silver',
    level: 1,
    minPoints: 500,
    badgeColor: 'text-slate-300 border-slate-300/40 bg-slate-300/10',
    gradient: 'from-[#2c323b] via-[#1c2026] to-[#0e1013]',
    benefits: [
      'Toàn bộ đặc quyền của nhóm hạng Đồng',
      'Tư vấn định hình phong cách cá nhân hóa cùng Stylist AI',
      'Miễn phí vận chuyển tiêu chuẩn cho mọi đơn hàng nội địa',
    ],
  },
  {
    id: 'silver_2',
    nameVi: 'Bạc II',
    nameEn: 'Silver II',
    family: 'silver',
    level: 2,
    minPoints: 900,
    badgeColor: 'text-slate-200 border-slate-200/40 bg-slate-200/10',
    gradient: 'from-[#353c47] via-[#232830] to-[#121418]',
    benefits: [
      'Toàn bộ đặc quyền của hạng Bạc I',
      'Chiết khấu 5% dịch vụ may đo chỉnh sửa theo số đo riêng',
      'Quà tặng sinh nhật thành viên được tuyển chọn đặc biệt từ xưởng',
    ],
  },
  {
    id: 'silver_3',
    nameVi: 'Bạc III',
    nameEn: 'Silver III',
    family: 'silver',
    level: 3,
    minPoints: 1400,
    badgeColor: 'text-white border-white/40 bg-white/10',
    gradient: 'from-[#3e4754] via-[#2a303a] to-[#15181c]',
    benefits: [
      'Toàn bộ đặc quyền của hạng Bạc II',
      'Ưu tiên nhận thông báo và đặt chỗ Runway Preview trước 48 giờ',
      'Hỗ trợ đổi trả hàng mở rộng lên đến 30 ngày',
    ],
  },

  // --- VÀNG (GOLD) ---
  {
    id: 'gold_1',
    nameVi: 'Vàng I',
    nameEn: 'Gold I',
    family: 'gold',
    level: 1,
    minPoints: 2000,
    badgeColor: 'text-amber-300 border-amber-300/40 bg-amber-300/10',
    gradient: 'from-[#3d3319] via-[#26200f] to-[#131008]',
    benefits: [
      'Toàn bộ đặc quyền của nhóm hạng Bạc',
      'Đặc quyền đặt lịch thử đồ tại Salon riêng Place Vendôme & Tokyo',
      'Vận chuyển hỏa tốc Găng Tay Trắng miễn phí toàn quốc',
    ],
  },
  {
    id: 'gold_2',
    nameVi: 'Vàng II',
    nameEn: 'Gold II',
    family: 'gold',
    level: 2,
    minPoints: 3000,
    badgeColor: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
    gradient: 'from-[#4a3e1e] via-[#2e2613] to-[#171309]',
    benefits: [
      'Toàn bộ đặc quyền của hạng Vàng I',
      'Ưu tiên tiếp cận Bộ sưu tập Giới hạn (Limited Capsule Archive)',
      'Lời mời tham dự tiệc cocktail riêng tại các tuần lễ thời trang',
    ],
  },
  {
    id: 'gold_3',
    nameVi: 'Vàng III',
    nameEn: 'Gold III',
    family: 'gold',
    level: 3,
    minPoints: 4500,
    badgeColor: 'text-[#d4af37] border-[#d4af37]/40 bg-[#d4af37]/15',
    gradient: 'from-[#574923] via-[#372e16] to-[#1b170b]',
    benefits: [
      'Toàn bộ đặc quyền của hạng Vàng II',
      'Chuyên viên cố vấn thời trang cao cấp (Personal Stylist Concierge) riêng',
      'Thẻ mời trải nghiệm phòng chờ VIP tại các sự kiện quốc tế',
    ],
  },

  // --- KIM CƯƠNG (DIAMOND) ---
  {
    id: 'diamond_1',
    nameVi: 'Kim Cương I',
    nameEn: 'Diamond I',
    family: 'diamond',
    level: 1,
    minPoints: 6500,
    badgeColor: 'text-cyan-300 border-cyan-300/40 bg-cyan-300/15',
    gradient: 'from-[#19363d] via-[#102226] to-[#081113]',
    benefits: [
      'Toàn bộ đặc quyền của nhóm hạng Vàng',
      'Khách mời danh dự Front-Row tại các show diễn chính thức của Maison',
      'Dịch vụ may đo Bespoke Haute Couture không giới hạn lần chỉnh sửa',
    ],
  },
  {
    id: 'diamond_2',
    nameVi: 'Kim Cương II',
    nameEn: 'Diamond II',
    family: 'diamond',
    level: 2,
    minPoints: 9000,
    badgeColor: 'text-cyan-200 border-cyan-200/50 bg-cyan-200/20 shadow-cyan-500/20',
    gradient: 'from-[#1f424b] via-[#142a30] to-[#0a1518]',
    benefits: [
      'Toàn bộ đặc quyền của hạng Kim Cương I',
      'Trải nghiệm may đo Bespoke tại tư gia hoặc khách sạn 5 sao theo yêu cầu',
      'Món quà tri ân thượng đỉnh hàng năm được chế tác riêng mang tên thành viên',
    ],
  },
  {
    id: 'diamond_3',
    nameVi: 'Kim Cương III',
    nameEn: 'Diamond III',
    family: 'diamond',
    level: 3,
    minPoints: 12000,
    badgeColor: 'text-white border-cyan-400 bg-gradient-to-r from-cyan-500/20 via-champagne/20 to-purple-500/20 shadow-lg shadow-cyan-500/30',
    gradient: 'from-[#284a54] via-[#182a35] to-[#0d161d]',
    benefits: [
      'Cấp hạng vinh dự tối thượng của Atelier Vérité',
      'Đặc quyền Thành Viên Thượng Đỉnh: Khắc tên vĩnh viễn trên Bảng Danh Dự Maison',
      'Được tiếp đón bởi Giám đốc Nghệ thuật tại Atelier Paris',
      'Dịch vụ Concierge Toàn Cầu 24/7 cho mọi nhu cầu phong cách và trải nghiệm',
    ],
  },
];

export const TIER_FAMILY_NAMES: Record<TierFamily, { vi: string; en: string }> = {
  bronze: { vi: 'Hạng Đồng', en: 'Bronze' },
  silver: { vi: 'Hạng Bạc', en: 'Silver' },
  gold: { vi: 'Hạng Vàng', en: 'Gold' },
  diamond: { vi: 'Hạng Kim Cương', en: 'Diamond' },
};
