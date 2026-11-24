export interface StatItem {
  value: number;
  unit: string;
  label: string;
  formatLeadingZero?: boolean;
}

export interface LookShopItem {
  name: string;
  price: number;
  link: string;
}

export interface LookItem {
  id: string;
  tag: string;
  title: string;
  collection: string;
  metrics: {
    items: string;
    season: string;
    occasion: string;
  };
  description: string;
  fabric: string;
  image: string;
  shopItems: LookShopItem[];
}

export const STATS_DATA: StatItem[] = [
  { value: 320, unit: 'gsm', label: 'TRỌNG LƯỢNG' },
  { value: 40, unit: 'lần', label: 'GIẶT THỬ' },
  { value: 12, unit: 'lần', label: 'CHỈNH FORM' },
  { value: 2, unit: 'ngày', label: 'GIAO HÀNG', formatLeadingZero: true },
];

export const MATERIAL_STUDY_BANNER = {
  number: '03',
  label: 'MATERIAL STUDY',
  headingLines: ['THE ART OF', 'THE QUIET', 'ESSENTIAL.'],
  description:
    'Vật liệu được chọn vì cách nó chạm vào da, chuyển động cùng cơ thể và đẹp hơn theo thời gian. Từng thớ vải mang trọn vẹn triết lý thiết kế tối giản có chủ đích.',
  ctaText: 'CÂU CHUYỆN CỦA CHÚNG TÔI →',
  ctaLink: '/about',
  image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=2400&q=90',
};

export const LOOKBOOK_DATA: LookItem[] = [
  {
    id: 'look-01',
    tag: 'LOOK 01',
    title: 'LE MANTEAU STRUCTURÉ',
    collection: 'ATELIER / SS26',
    metrics: {
      items: '03 MÓN',
      season: 'SS26 MÙA',
      occasion: 'DAY DỊP MẶC',
    },
    description: 'Tỷ lệ kiến trúc gọn ghẽ với đường cắt dứt khoát, tối ưu cho nhịp sống hiện đại.',
    fabric: 'Wool pha Cashmere Ý 380gsm · Lót lụa Habotai nguyên bản',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85',
    shopItems: [
      { name: 'Áo khoác drape dáng suông', price: 6800000, link: '/products' },
      { name: 'Quần xếp ly ống rộng', price: 3400000, link: '/products' },
      { name: 'Áo dệt kim cổ lọ silk-blend', price: 2600000, link: '/products' },
    ],
  },
  {
    id: 'look-02',
    tag: 'LOOK 02',
    title: "L'ENSEMBLE FLUIDE",
    collection: 'ATELIER / SS26',
    metrics: {
      items: '03 MÓN',
      season: 'SS26 MÙA',
      occasion: 'SOIRÉE DỊP MẶC',
    },
    description: 'Chuyển động uyển chuyển giữa kết cấu lụa dệt cát và len mỏng thượng hạng.',
    fabric: 'Lụa Crepe de Chine · Poplin cotton Ai Cập 120s',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85',
    shopItems: [
      { name: 'Blazer lụa dáng dài mềm', price: 5900000, link: '/products' },
      { name: 'Sơ mi cổ đứng Mandarin Silk', price: 3200000, link: '/products' },
      { name: 'Quần tây len dệt mỏng', price: 3800000, link: '/products' },
    ],
  },
  {
    id: 'look-03',
    tag: 'LOOK 03',
    title: 'LE COSTUME MODERNE',
    collection: 'ATELIER / SS26',
    metrics: {
      items: '02 MÓN',
      season: 'SS26 MÙA',
      occasion: 'RESORT DỊP MẶC',
    },
    description: 'Cấu trúc vai giải phóng tự do, duy trì sự chuẩn mực trong phong thái tối giản.',
    fabric: 'Linen Pháp dệt mật độ cao · Cotton hữu cơ chải kỹ',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
    shopItems: [
      { name: 'Áo khoác safari French Linen', price: 4200000, link: '/products' },
      { name: 'Quần ống suông French Linen', price: 3100000, link: '/products' },
    ],
  },
];
