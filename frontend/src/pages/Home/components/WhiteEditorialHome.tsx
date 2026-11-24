import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, LoaderCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bannersApi, productsApi } from '../../../shared/api';
import { useCartStore } from '../../../shared/stores/useCartStore';
import { Product, ProductVariant } from '../../../shared/types';
import { formatCurrency } from '../../../shared/utils/formatters';
import { StatsBar } from './StatsBar';
import { FullBleedBanner } from './FullBleedBanner';
import { LookCard } from './LookCard';
import { Newsletter } from './Newsletter';
import { LOOKBOOK_DATA } from '../data/editorialData';
import './WhiteEditorialHome.css';

type LiveProduct = Product;
const HERO_FALLBACKS = [
  { image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2200&q=90', caption: 'LOOK 01 / TAILORING IN MOTION' },
  { image: 'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?auto=format&fit=crop&w=2200&q=90', caption: 'LOOK 02 / SOFT STRUCTURE' },
  { image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=2200&q=90', caption: 'LOOK 03 / AFTER DARK' },
];
const PRODUCT_IMAGE_FIXES: Record<string, string> = { 'quan-short-kaki-nam': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85' };

const arrayFromResponse = (response: any): any[] => { const data = response?.data ?? response; return Array.isArray(data) ? data : data?.products || data?.items || data?.banners || []; };
const firstImage = (record: any): string => record?.image || record?.image_url || record?.desktopImage || record?.coverImage || record?.thumbnail || '';
const adaptLiveProduct = (raw: any): LiveProduct => {
  const id = String(raw.id || raw._id || '');
  const fromApi = Array.isArray(raw.displayProduct) ? raw.displayProduct.filter(Boolean) : Array.isArray(raw.images) ? raw.images.filter(Boolean) : raw.image ? [raw.image] : [];
  const images = PRODUCT_IMAGE_FIXES[raw.slug] ? [PRODUCT_IMAGE_FIXES[raw.slug], ...fromApi] : fromApi;
  const variants: ProductVariant[] = (Array.isArray(raw.variants) ? raw.variants : []).map((variant: any, index: number) => ({ id: String(variant.id || variant._id || `${id}-${index}`), colorName: String(variant.colorName || variant.color || 'Phiên bản tiêu chuẩn'), colorHex: String(variant.colorHex || '#d4af37'), sizes: (Array.isArray(variant.sizes) ? variant.sizes : []).map((size: any) => ({ size: String(size.size || size), inStock: size.inStock !== false })), images: Array.isArray(variant.images) ? variant.images : images }));
  return { id, slug: String(raw.slug || id), name: String(raw.name || 'Thiết kế mới'), subtitle: String(raw.subtitle || raw.short_description || raw.category?.name || 'Bộ sưu tập'), price: Number(raw.price || raw.new_price || 0), category: 'couture', subCategory: String(raw.category?.name || raw.category || 'Bộ sưu tập'), description: String(raw.description || ''), details: [], composition: String(raw.composition || 'Thông tin chất liệu tại cửa hàng'), origin: 'Atelier Vérité', careInstructions: [], variants, featuredImage: images[0] || '', galleryImages: images, inStock: raw.stock !== 0, rating: Number(raw.rating || 0), reviewCount: Number(raw.reviewCount || 0) };
};

const SectionHeader: React.FC<{ number: string; label: string; meta: string }> = ({ number, label, meta }) => <div className="we-section-rule"><span className="we-number-chip">{number}</span><span>{label}</span><i /><span>{meta}</span></div>;
const ProductImage: React.FC<{ product: LiveProduct; eager?: boolean }> = ({ product, eager }) => { const [failed, setFailed] = useState(false); return <>{product.featuredImage && !failed ? <img src={product.featuredImage} alt={product.name} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} /> : <span className="we-image-fallback"><b>ATELIER VÉRITÉ</b><i /></span>}</>; };

export const useSectionInView = (threshold = 0.2) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
};

export const WhiteEditorialHome: React.FC = () => {
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [heroImage, setHeroImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0); const [paused, setPaused] = useState(false); const touch = useRef<number | null>(null);
  const { addItem } = useCartStore();
  const [statsRef, statsInView] = useSectionInView(0.2);
  const [looksRef, looksInView] = useSectionInView(0.15);
  useEffect(() => { let active = true; Promise.allSettled([productsApi.getProducts({ limit: 6, sort: 'newest' }), bannersApi.getActiveBanners()]).then(([productResult, bannerResult]) => { if (!active) return; if (productResult.status === 'fulfilled') setProducts(arrayFromResponse(productResult.value).map(adaptLiveProduct).filter((product) => product.id)); else setLoadError('Không thể tải sản phẩm từ máy chủ.'); if (bannerResult.status === 'fulfilled') setHeroImage(firstImage(arrayFromResponse(bannerResult.value)[0])); setLoading(false); }); return () => { active = false; }; }, []);
  const slides = useMemo(() => [{ image: heroImage || HERO_FALLBACKS[0].image, caption: HERO_FALLBACKS[0].caption }, ...HERO_FALLBACKS.slice(1)], [heroImage]);
  useEffect(() => { if (paused) return; const timer = window.setInterval(() => setSlide((current) => (current + 1) % slides.length), 6000); return () => clearInterval(timer); }, [paused, slides.length]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'ArrowRight') setSlide((current) => (current + 1) % slides.length); if (event.key === 'ArrowLeft') setSlide((current) => (current + slides.length - 1) % slides.length); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [slides.length]);
  const addFirstAvailable = (product: LiveProduct) => { const variant = product.variants[0]; const size = variant?.sizes?.find((item) => item.inStock)?.size || product.sizes?.[0] || 'ONE SIZE'; addItem({ productId: product.id, productSlug: product.slug, name: product.name, price: product.price, quantity: 1, selectedColor: variant?.colorName || 'Phiên bản tiêu chuẩn', selectedColorHex: variant?.colorHex || '#d4af37', selectedSize: size, image: product.featuredImage }); };
  return <div className="white-editorial">
    <section className="we-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={(event) => { touch.current = event.touches[0].clientX; }} onTouchEnd={(event) => { if (touch.current === null) return; const delta = event.changedTouches[0].clientX - touch.current; if (Math.abs(delta) > 35) setSlide((current) => (current + (delta < 0 ? 1 : slides.length - 1)) % slides.length); touch.current = null; }}>
      {slides.map((item, index) => <img key={item.image} className={`we-hero-slide ${slide === index ? 'is-active' : ''}`} src={item.image} alt="Người mẫu trong lookbook Atelier Vérité" />)}<div className="we-hero-overlay" />
      <div className="we-slider-progress">{slides.map((_, index) => <button key={index} onClick={() => setSlide(index)} aria-label={`Chuyển tới slide ${index + 1}`} className={`${index < slide ? 'is-complete' : ''} ${index === slide ? 'is-current' : ''}`}><i key={`${slide}-${index}`} /></button>)}</div>
      <div className="we-hero-content"><p className="we-kicker">SPRING / SUMMER 2026</p><h1>THE QUIET<br />STATEMENT.</h1><div className="we-actions"><Link to="/collections" className="we-button we-button-cream">KHÁM PHÁ BỘ SƯU TẬP</Link><Link to="/products" className="we-button we-button-light">XEM TẤT CẢ</Link></div></div>
      <p className="we-hero-caption">0{slide + 1}/0{slides.length} &nbsp;+&nbsp; {slides[slide].caption}</p>
    </section>
    <section className="we-collection" id="collection"><SectionHeader number="01" label="NEW ARRIVALS" meta={`${products.length || 6} ITEMS`} /><div className="we-heading-row"><h2>THE EDIT</h2><Link to="/products" className="we-text-link">XEM CỬA HÀNG <ArrowRight size={15} /></Link></div>{loading && <div className="we-loading"><LoaderCircle size={22} /> ĐANG KẾT NỐI CATALOG</div>}{loadError && <div className="we-empty">{loadError}</div>}{!loading && !loadError && products.length === 0 && <div className="we-empty">Catalog hiện chưa có sản phẩm hiển thị.</div>}<div className="we-product-grid">{products.map((product, index) => <article className="we-product" key={product.id}><Link to={`/products/${product.slug}`} className="we-product-image" aria-label={`Xem ${product.name}`}><ProductImage product={product} eager={index < 3} /><span className="we-index">FW26</span></Link><div className="we-product-info"><div><p>{product.subCategory}</p><h3>{product.name}</h3></div><strong>{formatCurrency(product.price)}</strong></div><div className="we-product-foot"><span>{product.composition}</span><button type="button" onClick={() => addFirstAvailable(product)} aria-label={`Thêm ${product.name} vào túi`}><Plus size={15} /> THÊM NHANH</button></div></article>)}</div></section>
    <section className="we-stats" id="material-test" ref={statsRef}>
      <div className={`we-fade-up we-stagger-1 ${statsInView ? 'is-in-view' : ''}`}>
        <SectionHeader number="02" label="MATERIAL TEST" meta="ATELIER NOTES" />
      </div>
      <div className={`we-stats-intro we-fade-up we-stagger-2 ${statsInView ? 'is-in-view' : ''}`}>
        <h2>MADE TO BE<br />LIVED IN.</h2>
        <p>Chất liệu được thử thách trong đời sống thực tế trước khi đưa vào bộ sưu tập. Từng thớ sợi được dệt dày dặn, xử lý chống bai giãn để mỗi nếp gấp giữ nguyên phom dáng kiến trúc qua thời gian.</p>
      </div>
      <div className={`we-fade-up we-stagger-3 ${statsInView ? 'is-in-view' : ''}`}>
        <StatsBar />
      </div>
    </section>
    <FullBleedBanner />
    <section className="we-looks" id="lookbook" ref={looksRef}>
      <div className={`we-fade-up we-stagger-1 ${looksInView ? 'is-in-view' : ''}`}>
        <SectionHeader number="04" label="LOOKBOOK" meta="03 LOOKS" />
      </div>
      <div className={`we-heading-row we-fade-up we-stagger-2 ${looksInView ? 'is-in-view' : ''}`}>
        <h2>IN MOTION</h2>
        <Link to="/lookbooks" className="we-button we-button-outline">
          TẤT CẢ LOOKS <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className={`we-look-grid we-fade-up we-stagger-3 ${looksInView ? 'is-in-view' : ''}`}>
        {LOOKBOOK_DATA.map((look) => (
          <LookCard key={look.id} look={look} />
        ))}
      </div>
    </section>
    <Newsletter />
  </div>;
};
