import { Product, ProductVariant, Category } from '../types';

const COLOR_HEX_MAP: Record<string, string> = {
  'đen': '#141416',
  'đen tuyền': '#101012',
  'đen noir': '#121215',
  'trắng': '#F5F5F7',
  'trắng ngà': '#F0EFE9',
  'nâu': '#795548',
  'nâu lạc đà': '#A2703F',
  'xanh': '#1E3A8A',
  'xanh navy': '#0A192F',
  'xanh indigo': '#1E293B',
  'xám': '#64748B',
  'be': '#D2B48C',
  'đỏ': '#881337',
};

const getColorHex = (name: string): string => {
  const lower = name.toLowerCase().trim();
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (lower.includes(key)) return hex;
  }
  return '#1e1e24';
};

export function adaptBackendProduct(raw: any): Product {
  const id = String(raw._id || raw.id || '');
  const name = String(raw.name || 'Sản phẩm Atelier Vérité');
  const slug = String(raw.slug || id);
  const price = Number(raw.price || raw.new_price || 0);
  const originalPrice = raw.old_price || raw.oldPrice ? Number(raw.old_price || raw.oldPrice) : undefined;

  const displayImages: string[] = Array.isArray(raw.displayProduct) && raw.displayProduct.length > 0
    ? raw.displayProduct
    : raw.image
    ? [raw.image]
    : [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
      ];

  // Group backend variants by color
  const variantsByColor = new Map<string, {
    id: string;
    colorName: string;
    colorHex: string;
    images: string[];
    sizes: Array<{ size: string; inStock: boolean; stockCount: number; variantId?: string }>;
  }>();

  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    for (const v of raw.variants) {
      const color = String(v.color || v.colorName || 'Mặc định');
      const sizeName = String(v.size || 'F');
      const stock = typeof v.available_stock === 'number' ? v.available_stock : (typeof v.stock === 'number' ? v.stock : 10);
      const inStock = stock > 0;
      const variantId = String(v._id || v.id || '');
      const imageUrl = v.image_url || v.imageUrl;

      if (!variantsByColor.has(color)) {
        variantsByColor.set(color, {
          id: variantId || `var_${id}_${variantsByColor.size}`,
          colorName: color,
          colorHex: getColorHex(color),
          images: imageUrl ? [imageUrl, ...displayImages] : displayImages,
          sizes: [],
        });
      }

      const group = variantsByColor.get(color)!;
      group.sizes.push({
        size: sizeName,
        inStock,
        stockCount: stock,
        variantId,
      });
      if (imageUrl && !group.images.includes(imageUrl)) {
        group.images.unshift(imageUrl);
      }
    }
  }

  let variants: ProductVariant[] = [];
  if (variantsByColor.size > 0) {
    variants = Array.from(variantsByColor.values()).map((g) => ({
      id: g.id,
      colorName: g.colorName,
      colorHex: g.colorHex,
      images: g.images,
      sizes: g.sizes,
    }));
  } else {
    // Default fallback variant if product has no variants in DB
    const stock = typeof raw.stock === 'number' ? raw.stock : 15;
    variants = [
      {
        id: `var_${id}_def`,
        colorName: 'Đen Noir',
        colorHex: '#121215',
        images: displayImages,
        sizes: [
          { size: 'S', inStock: stock > 0, stockCount: Math.ceil(stock / 3) },
          { size: 'M', inStock: stock > 0, stockCount: Math.ceil(stock / 3) },
          { size: 'L', inStock: stock > 0, stockCount: Math.ceil(stock / 3) },
        ],
      },
    ];
  }

  // Determine category
  let category: Category = 'women';
  const rawCat = (typeof raw.category === 'string' ? raw.category : raw.category?.slug || raw.category_id?.name || raw.category_id || '').toLowerCase();
  if (rawCat.includes('nam') || rawCat.includes('men')) category = 'men';
  else if (rawCat.includes('phụ kiện') || rawCat.includes('accessories') || rawCat.includes('túi')) category = 'accessories';
  else if (rawCat.includes('couture') || rawCat.includes('may đo')) category = 'couture';

  return {
    id,
    slug,
    name,
    subtitle: raw.description ? String(raw.description).slice(0, 100) : 'Bộ sưu tập Haute Couture Atelier Vérité',
    price,
    originalPrice,
    category,
    subCategory: raw.subCategory || 'Thời trang thiết kế',
    badge: raw.is_featured ? 'Tuyển chọn' : undefined,
    description: raw.description || 'Chế tác thủ công từ các chất liệu cao cấp tuyển chọn theo tiêu chuẩn nghệ thuật Paris.',
    details: [
      'Phom dáng kiến trúc may đo chuẩn mực',
      'Chất liệu cao cấp thoáng mát, tôn dáng',
      'Hoàn thiện tỉ mỉ từng đường kim mũi chỉ',
      'Định danh y phục thương quyền Atelier',
    ],
    composition: '100% Chất liệu cao cấp chuẩn Atelier',
    origin: 'Chế tác tại Atelier Vérité',
    careInstructions: [
      'Giặt tay nhẹ nhàng hoặc giặt khô chuyên nghiệp',
      'Là hơi nước ở nhiệt độ thích hợp',
      'Bảo quản nơi khô thoáng, tránh ánh nắng trực tiếp',
    ],
    variants,
    galleryImages: displayImages,
    featuredImage: displayImages[0],
    rating: Number(raw.rating || 4.8),
    reviewCount: Number(raw.sold || 45),
    isNewArrival: Boolean(raw.is_new || raw.is_featured),
    isTrending: Boolean(raw.sold && raw.sold > 100),
    isFeatured: Boolean(raw.is_featured),
    inStock: variants.some((v) => v.sizes.some((s) => s.inStock)),
  };
}
