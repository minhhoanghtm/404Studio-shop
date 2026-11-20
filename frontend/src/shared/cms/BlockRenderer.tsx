/**
 * ATELIER VÉRITÉ — Public Dynamic Block Renderer
 * Renders structured JSON blocks safely with zero arbitrary script execution.
 * Matches luxury Atelier Vérité Haute Couture aesthetic.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ChevronDown,
  Quote as QuoteIcon,
  CheckCircle2,
  Calendar,
  Tag,
  Shield,
  Sliders,
  FileText,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  CopyPlus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { BlockItem, ViewportMode } from './types';
import { sanitizeUrl, sanitizeRichText, sanitizeEmbedUrl } from './sanitizer';
import { useConsentStore } from '@/shared/consent';

interface BlockRendererProps {
  blocks?: BlockItem[];
  viewportMode?: ViewportMode;
  isEditorMode?: boolean;
  activeBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
  onDeleteBlock?: (blockId: string) => void;
  onMoveBlock?: (blockId: string, direction: 'up' | 'down') => void;
  onDuplicateBlock?: (blockId: string) => void;
  className?: string;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  blocks = [],
  viewportMode = 'desktop',
  isEditorMode = false,
  activeBlockId = null,
  onSelectBlock,
  onDeleteBlock,
  onMoveBlock,
  onDuplicateBlock,
  className = '',
}) => {
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [activeTabIndices, setActiveTabIndices] = useState<Record<string, number>>({});
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);
  const openPreferences = useConsentStore((state) => state.openPreferences);

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setTab = (blockId: string, idx: number) => {
    setActiveTabIndices((prev) => ({ ...prev, [blockId]: idx }));
  };

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVoucher(code);
    setTimeout(() => setCopiedVoucher(null), 2500);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {blocks.map((block, idx) => {
        // Responsive visibility checks
        if (!isEditorMode) {
          if (viewportMode === 'mobile' && block.responsive?.hideOnMobile) return null;
          if (viewportMode === 'tablet' && block.responsive?.hideOnTablet) return null;
          if (viewportMode === 'desktop' && block.responsive?.hideOnDesktop) return null;
        }

        const isSelected = isEditorMode && activeBlockId === block.id;
        const styles = block.styles || {};
        const content = block.content || {};

        return (
          <div
            key={block.id || idx}
            data-block-id={block.id}
            data-block-type={block.type}
            onClick={(e) => {
              if (isEditorMode && onSelectBlock) {
                e.stopPropagation();
                onSelectBlock(block.id);
              }
            }}
            className={`relative transition-all ${
              isEditorMode
                ? `cursor-pointer rounded-lg border-2 p-2 ${
                    isSelected
                      ? 'border-[#d4af37] ring-4 ring-[#d4af37]/20 bg-white/[0.02]'
                      : 'border-transparent hover:border-white/20'
                  }`
                : ''
            }`}
          >
            {/* Editor Action Controls Overlay */}
            {isEditorMode && isSelected && (
              <div className="absolute -top-4 right-3 z-30 flex items-center gap-1 bg-[#1a1a24] border border-[#d4af37] text-white rounded-md px-2 py-0.5 shadow-xl text-xs">
                <span className="font-mono text-[#d4af37] text-[10px] uppercase font-bold mr-1">
                  {block.label || block.type}
                </span>
                {idx > 0 && onMoveBlock && (
                  <button
                    type="button"
                    title="Di chuyển lên"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveBlock(block.id, 'up');
                    }}
                    className="p-1 hover:text-[#d4af37] hover:bg-white/10 rounded"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {idx < blocks.length - 1 && onMoveBlock && (
                  <button
                    type="button"
                    title="Di chuyển xuống"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveBlock(block.id, 'down');
                    }}
                    className="p-1 hover:text-[#d4af37] hover:bg-white/10 rounded"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDuplicateBlock && (
                  <button
                    type="button"
                    title="Nhân bản khối"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateBlock(block.id);
                    }}
                    className="p-1 hover:text-[#d4af37] hover:bg-white/10 rounded"
                  >
                    <CopyPlus className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDeleteBlock && (
                  <button
                    type="button"
                    title="Xóa khối"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBlock(block.id);
                    }}
                    className="p-1 hover:text-red-400 hover:bg-red-500/20 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Render Specific Block Type */}
            {(() => {
              switch (block.type) {
                // ================= CONTENT =================
                case 'heading': {
                  const Level = (content.level || 'h2') as 'h1' | 'h2' | 'h3' | 'h4';
                  const sizeClasses = {
                    h1: 'text-3xl sm:text-5xl',
                    h2: 'text-2xl sm:text-4xl',
                    h3: 'text-xl sm:text-2xl',
                    h4: 'text-lg sm:text-xl',
                  };
                  return (
                    <div
                      style={{
                        textAlign: styles.textAlign || 'left',
                        color: styles.textColor,
                        marginTop: styles.marginTop,
                        marginBottom: styles.marginBottom,
                      }}
                      className="space-y-2"
                    >
                      {content.tagline && (
                        <p className="text-xs uppercase font-mono tracking-widest text-[#d4af37]">
                          {content.tagline}
                        </p>
                      )}
                      <Level
                        className={`${sizeClasses[Level]} ${
                          styles.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                        } font-medium tracking-wide uppercase`}
                      >
                        {content.text || 'Tiêu Đề Nội Dung'}
                      </Level>
                    </div>
                  );
                }

                case 'paragraph': {
                  return (
                    <p
                      style={{
                        textAlign: styles.textAlign || 'left',
                        color: styles.textColor || 'rgba(255, 255, 255, 0.75)',
                        marginTop: styles.marginTop,
                        marginBottom: styles.marginBottom,
                      }}
                      className={`text-sm sm:text-base leading-relaxed ${
                        styles.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                      }`}
                    >
                      {content.text || ''}
                    </p>
                  );
                }

                case 'rich_text': {
                  const sanitizedHtml = sanitizeRichText(content.html || '');
                  return (
                    <div
                      style={{
                        textAlign: styles.textAlign || 'left',
                        color: styles.textColor || 'rgba(255, 255, 255, 0.8)',
                        marginTop: styles.marginTop,
                        marginBottom: styles.marginBottom,
                      }}
                      className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-3"
                      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                    />
                  );
                }

                case 'quote': {
                  return (
                    <blockquote
                      style={{
                        textAlign: styles.textAlign || 'center',
                        color: styles.textColor || '#d4af37',
                        paddingTop: styles.paddingTop,
                        paddingBottom: styles.paddingBottom,
                        marginTop: styles.marginTop,
                        marginBottom: styles.marginBottom,
                      }}
                      className="relative border-y border-[#d4af37]/30 py-6 px-4 sm:px-8 space-y-3"
                    >
                      <QuoteIcon className="w-8 h-8 text-[#d4af37]/30 mx-auto" />
                      <p className="font-serif text-lg sm:text-2xl italic leading-relaxed text-white/90">
                        "{content.quote || 'Trích dẫn nghệ thuật'}"
                      </p>
                      {content.author && (
                        <cite className="block text-xs uppercase tracking-widest text-[#d4af37]/80 not-italic font-sans">
                          — {content.author}
                        </cite>
                      )}
                    </blockquote>
                  );
                }

                case 'list': {
                  const items = Array.isArray(content.items) ? content.items : [];
                  const isOrdered = Boolean(content.ordered);
                  return isOrdered ? (
                    <ol
                      style={{ color: styles.textColor || 'rgba(255, 255, 255, 0.75)' }}
                      className="list-decimal pl-6 space-y-2 text-sm sm:text-base"
                    >
                      {items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ol>
                  ) : (
                    <ul
                      style={{ color: styles.textColor || 'rgba(255, 255, 255, 0.75)' }}
                      className="space-y-2.5 text-sm sm:text-base"
                    >
                      {items.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }

                case 'table': {
                  const headers = Array.isArray(content.headers) ? content.headers : [];
                  const rows = Array.isArray(content.rows) ? content.rows : [];
                  return (
                    <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02]">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 border-b border-white/10 text-xs font-mono uppercase text-[#d4af37]">
                          <tr>
                            {headers.map((h: string, i: number) => (
                              <th key={i} className="px-4 py-3 font-medium">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                          {rows.map((row: string[], rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                              {row.map((cell: string, cIdx: number) => (
                                <td key={cIdx} className="px-4 py-3">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                case 'accordion': {
                  const items = Array.isArray(content.items) ? content.items : [];
                  return (
                    <div className="space-y-2">
                      {items.map((item: any, i: number) => {
                        const key = `${block.id}_${i}`;
                        const isOpen = Boolean(openAccordions[key]);
                        return (
                          <div
                            key={i}
                            className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden transition-all"
                          >
                            <button
                              type="button"
                              onClick={() => toggleAccordion(key)}
                              className="w-full flex items-center justify-between p-4 text-left font-medium text-sm sm:text-base text-white hover:text-[#d4af37] transition-colors"
                            >
                              <span>{item.title}</span>
                              <ChevronDown
                                className={`w-4 h-4 text-[#d4af37] transition-transform duration-200 ${
                                  isOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-4 text-sm text-white/70 leading-relaxed border-t border-white/5 pt-3">
                                {item.content}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                case 'divider': {
                  return (
                    <div className="relative py-4 flex items-center justify-center">
                      <div className="w-full border-t border-white/10" />
                      {content.showEmblem && (
                        <div className="absolute px-3 bg-[#0b0b0e] text-[#d4af37] text-xs font-serif font-bold uppercase tracking-widest">
                          Atelier Vérité
                        </div>
                      )}
                    </div>
                  );
                }

                // ================= MEDIA =================
                case 'image': {
                  const safeUrl = sanitizeUrl(content.url);
                  return (
                    <figure className="space-y-2">
                      <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
                        <img
                          src={safeUrl || 'https://via.placeholder.com/800x450'}
                          alt={content.alt || 'Atelier Image'}
                          className="w-full h-auto object-cover max-h-[600px]"
                          loading="lazy"
                        />
                      </div>
                      {content.caption && (
                        <figcaption className="text-center text-xs text-white/50 italic font-light">
                          {content.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                }

                case 'gallery': {
                  const images = Array.isArray(content.images) ? content.images : [];
                  const cols = content.columns || 3;
                  const colClasses = cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3';
                  return (
                    <div className={`grid ${colClasses} gap-4`}>
                      {images.map((img: any, i: number) => (
                        <div
                          key={i}
                          className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/40 aspect-[3/4]"
                        >
                          <img
                            src={sanitizeUrl(img.url)}
                            alt={img.caption || `Gallery Image ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          {img.caption && (
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-xs text-white/90">
                              {img.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }

                case 'video': {
                  const safeEmbed = sanitizeEmbedUrl(content.videoUrl);
                  return safeEmbed ? (
                    <div className="overflow-hidden rounded-lg border border-white/10 aspect-video bg-black/60">
                      <iframe
                        src={safeEmbed}
                        title={content.title || 'Atelier Video'}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="p-8 rounded-lg border border-white/10 text-center text-white/40 text-sm bg-black/30">
                      [Video URL không hợp lệ hoặc không thuộc danh sách nền tảng cho phép]
                    </div>
                  );
                }

                case 'banner': {
                  const safeImg = sanitizeUrl(content.imageUrl);
                  const safeBtnLink = sanitizeUrl(content.buttonLink);
                  return (
                    <div
                      className="relative overflow-hidden rounded-xl border border-white/10 bg-black/80 p-8 sm:p-16 text-center space-y-4"
                      style={{
                        backgroundImage: safeImg ? `url(${safeImg})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
                      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                        <h2 className="font-serif text-3xl sm:text-5xl uppercase text-white font-medium tracking-wider">
                          {content.title || 'Tiêu Đề Banner'}
                        </h2>
                        {content.subtitle && (
                          <p className="text-sm sm:text-base text-white/80 font-light">
                            {content.subtitle}
                          </p>
                        )}
                        {content.buttonText && (
                          <div className="pt-2">
                            <Link
                              to={safeBtnLink || '#'}
                              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#d4af37] text-black font-semibold text-xs uppercase tracking-widest hover:bg-[#e5c158] transition-colors shadow-lg"
                            >
                              <span>{content.buttonText}</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                case 'image_text': {
                  const isLeft = content.imagePosition === 'left';
                  const safeImg = sanitizeUrl(content.imageUrl);
                  const safeBtn = sanitizeUrl(content.buttonLink);
                  return (
                    <div
                      className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${
                        isLeft ? '' : 'md:grid-flow-dense'
                      }`}
                    >
                      <div className={isLeft ? '' : 'md:col-start-2'}>
                        <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40 aspect-[4/3]">
                          <img
                            src={safeImg || 'https://via.placeholder.com/600x450'}
                            alt={content.title || 'Image Text'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                      <div className={`space-y-4 ${isLeft ? '' : 'md:col-start-1'}`}>
                        <h3 className="font-serif text-2xl sm:text-3xl uppercase text-white font-medium">
                          {content.title || 'Tiêu Đề Nội Dung'}
                        </h3>
                        <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                          {content.content || ''}
                        </p>
                        {content.buttonText && (
                          <div className="pt-2">
                            <Link
                              to={safeBtn || '#'}
                              className="inline-flex items-center gap-2 text-xs uppercase font-mono tracking-widest text-[#d4af37] hover:underline underline-offset-4"
                            >
                              <span>{content.buttonText}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // ================= LAYOUT =================
                case 'two_columns': {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-sm text-white/80 leading-relaxed">
                        {content.leftContent || 'Nội dung cột trái'}
                      </div>
                      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-sm text-white/80 leading-relaxed">
                        {content.rightContent || 'Nội dung cột phải'}
                      </div>
                    </div>
                  );
                }

                case 'three_columns': {
                  const columns = Array.isArray(content.columns) ? content.columns : [];
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {columns.map((col: any, i: number) => (
                        <div
                          key={i}
                          className="p-6 rounded-lg bg-white/[0.02] border border-white/10 space-y-3"
                        >
                          <h4 className="font-serif text-lg text-white font-medium uppercase tracking-wide">
                            {col.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                            {col.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                }

                case 'spacer': {
                  return <div style={{ height: `${content.height || 32}px` }} />;
                }

                // ================= COMMERCE =================
                case 'product_grid': {
                  return (
                    <div className="space-y-4">
                      {content.title && (
                        <h3 className="font-serif text-xl sm:text-2xl uppercase text-white font-medium text-center">
                          {content.title}
                        </h3>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-2 group"
                          >
                            <div className="aspect-[3/4] bg-white/5 rounded overflow-hidden">
                              <img
                                src={`https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop`}
                                alt={`Product ${i}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="text-xs font-serif uppercase text-white/90 truncate">
                              Tác Phẩm Haute Couture #{i}
                            </div>
                            <div className="text-xs font-mono text-[#d4af37]">
                              18,500,000 ₫
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                case 'featured_product': {
                  return (
                    <div className="rounded-xl border border-[#d4af37]/30 bg-white/[0.02] p-6 flex flex-col md:flex-row gap-6 items-center">
                      <div className="w-full md:w-1/3 aspect-[3/4] rounded-lg overflow-hidden border border-white/10">
                        <img
                          src={sanitizeUrl(content.imageUrl)}
                          alt={content.productTitle || 'Featured Product'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="w-full md:w-2/3 space-y-4">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-[#d4af37] bg-[#d4af37]/10 px-2.5 py-1 rounded border border-[#d4af37]/30">
                          Sản Phẩm Tâm Điểm
                        </span>
                        <h3 className="font-serif text-2xl sm:text-3xl text-white font-medium">
                          {content.productTitle || 'Áo Khoác Dạ Dáng Dài Khâu Tay'}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xl text-[#d4af37] font-semibold">
                            {Number(content.price || 18500000).toLocaleString('vi-VN')} ₫
                          </span>
                          {content.originalPrice && (
                            <span className="font-mono text-sm text-white/40 line-through">
                              {Number(content.originalPrice).toLocaleString('vi-VN')} ₫
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">
                          Sản phẩm được chế tác hoàn toàn thủ công từ len cashmere thượng hạng. Giới hạn 20 chiếc trên toàn quốc.
                        </p>
                        <div className="pt-2">
                          <Link
                            to={sanitizeUrl(content.productLink) || '/products'}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-[#d4af37] text-black text-xs uppercase font-semibold tracking-wider hover:bg-[#e5c158] transition-colors"
                          >
                            <span>Xem Chi Tiết Tác Phẩm</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }

                case 'voucher_cta': {
                  const code = content.code || 'ATELIER15';
                  const isCopied = copiedVoucher === code;
                  return (
                    <div className="rounded-xl border border-[#d4af37]/40 bg-gradient-to-r from-[#d4af37]/10 via-black to-[#d4af37]/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center sm:text-left">
                        <h4 className="font-serif text-lg text-white font-medium">
                          {content.discount || 'Ưu Đãi Đặc Biệt'}
                        </h4>
                        <p className="text-xs text-white/60">
                          {content.expiry || 'Áp dụng cho mọi đơn hàng tại Atelier'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-4 py-2 bg-black border border-[#d4af37]/60 rounded font-mono text-sm tracking-wider text-[#d4af37] font-bold">
                          {code}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyVoucherCode(code)}
                          className="px-3 py-2 rounded bg-[#d4af37] text-black text-xs font-semibold uppercase flex items-center gap-1.5 hover:bg-[#e5c158] transition-colors"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Đã Sao Chép' : 'Sao Chép'}</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                // ================= INTERACTIVE =================
                case 'cta_button': {
                  const safeLink = sanitizeUrl(content.link);
                  return (
                    <div style={{ textAlign: styles.textAlign || 'center' }}>
                      <Link
                        to={safeLink || '#'}
                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded bg-[#d4af37] text-black font-semibold text-xs uppercase tracking-widest hover:bg-[#e5c158] transition-all shadow-lg hover:shadow-[#d4af37]/20"
                      >
                        <span>{content.label || 'Khám Phá Ngay'}</span>
                      </Link>
                    </div>
                  );
                }

                case 'tabs': {
                  const tabs = Array.isArray(content.tabs) ? content.tabs : [];
                  const activeIdx = activeTabIndices[block.id] || 0;
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
                        {tabs.map((tab: any, i: number) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setTab(block.id, i)}
                            className={`px-4 py-2 text-xs uppercase tracking-wider font-medium rounded transition-colors whitespace-nowrap ${
                              activeIdx === i
                                ? 'bg-[#d4af37] text-black font-semibold'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-sm text-white/80 leading-relaxed">
                        {tabs[activeIdx]?.content || ''}
                      </div>
                    </div>
                  );
                }

                case 'timeline': {
                  const events = Array.isArray(content.events) ? content.events : [];
                  return (
                    <div className="relative border-l-2 border-[#d4af37]/30 pl-6 ml-3 space-y-6">
                      {events.map((ev: any, i: number) => (
                        <div key={i} className="relative space-y-1">
                          <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#d4af37] border-4 border-black" />
                          <span className="font-mono text-xs text-[#d4af37] font-semibold">
                            {ev.year}
                          </span>
                          <h4 className="font-serif text-base text-white font-medium uppercase">
                            {ev.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                            {ev.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                }

                case 'countdown': {
                  return (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center space-y-3">
                      <h4 className="font-serif text-sm uppercase tracking-widest text-[#d4af37]">
                        {content.title || 'Đếm Ngược Sự Kiện'}
                      </h4>
                      <div className="flex items-center justify-center gap-4 font-mono text-2xl sm:text-4xl text-white font-bold">
                        <div className="p-3 bg-black/60 rounded border border-white/10 min-w-[64px]">
                          14<span className="block text-[10px] text-white/40 uppercase font-sans font-normal mt-1">Ngày</span>
                        </div>
                        <div className="p-3 bg-black/60 rounded border border-white/10 min-w-[64px]">
                          08<span className="block text-[10px] text-white/40 uppercase font-sans font-normal mt-1">Giờ</span>
                        </div>
                        <div className="p-3 bg-black/60 rounded border border-white/10 min-w-[64px]">
                          45<span className="block text-[10px] text-white/40 uppercase font-sans font-normal mt-1">Phút</span>
                        </div>
                        <div className="p-3 bg-black/60 rounded border border-white/10 min-w-[64px]">
                          20<span className="block text-[10px] text-white/40 uppercase font-sans font-normal mt-1">Giây</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // ================= LEGAL & COMPLIANCE =================
                case 'table_of_contents': {
                  const items = Array.isArray(content.items) ? content.items : [];
                  return (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
                      <h4 className="font-serif text-base text-white font-medium uppercase flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#d4af37]" />
                        <span>{content.title || 'Mục Lục Điều Khoản'}</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs sm:text-sm">
                        {items.map((it: any, i: number) => (
                          <li key={i}>
                            <a
                              href={it.anchor || '#'}
                              className="text-[#d4af37] hover:underline underline-offset-4"
                            >
                              {it.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                case 'policy_section': {
                  return (
                    <article className="space-y-2 border-b border-white/5 pb-6">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] font-mono text-xs font-semibold">
                          {content.articleNumber || 'Điều'}
                        </span>
                        <h3 className="font-serif text-lg sm:text-xl text-white font-medium">
                          {content.title}
                        </h3>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed pl-1 font-light">
                        {content.content}
                      </p>
                    </article>
                  );
                }

                case 'cookie_table': {
                  const categories = Array.isArray(content.categories) ? content.categories : [];
                  return (
                    <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02]">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 border-b border-white/10 text-xs font-mono uppercase text-[#d4af37]">
                          <tr>
                            <th className="px-4 py-3">Nhóm Cookie</th>
                            <th className="px-4 py-3">Mục Đích Sử Dụng</th>
                            <th className="px-4 py-3">Thời Hạn Lưu Trữ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                          {categories.map((cat: any, i: number) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3 font-medium text-white">{cat.name}</td>
                              <td className="px-4 py-3 text-white/70">{cat.purpose}</td>
                              <td className="px-4 py-3 font-mono text-xs text-[#d4af37]">{cat.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                case 'consent_trigger': {
                  return (
                    <div className="text-center py-2">
                      <button
                        type="button"
                        onClick={openPreferences}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-[#d4af37]/50 bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20 transition-colors text-xs uppercase tracking-wider font-medium"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{content.buttonText || 'Tùy Chỉnh Lựa Chọn Cookie Của Bạn'}</span>
                      </button>
                    </div>
                  );
                }

                case 'privacy_request_trigger': {
                  const safeLink = sanitizeUrl(content.link || '/data-privacy-request');
                  return (
                    <div className="text-center py-2">
                      <Link
                        to={safeLink}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-white/20 bg-white/5 text-white hover:border-[#d4af37] hover:text-[#d4af37] transition-colors text-xs uppercase tracking-wider font-medium"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>{content.buttonText || 'Gửi Yêu Cầu Về Dữ Liệu Cá Nhân (DSAR)'}</span>
                      </Link>
                    </div>
                  );
                }

                case 'returns_steps': {
                  const steps = Array.isArray(content.steps) ? content.steps : [];
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {steps.map((st: any, i: number) => (
                        <div
                          key={i}
                          className="p-5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2 relative"
                        >
                          <span className="font-mono text-xl font-bold text-[#d4af37]">
                            {st.step}
                          </span>
                          <h4 className="font-serif text-base text-white font-medium uppercase">
                            {st.title}
                          </h4>
                          <p className="text-xs text-white/70 leading-relaxed">
                            {st.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                }

                case 'effective_date': {
                  return (
                    <div className="flex items-center gap-2 text-xs font-mono text-white/50">
                      <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{content.dateText || 'Hiệu lực: 16/11/2026'}</span>
                    </div>
                  );
                }

                case 'policy_version': {
                  return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-mono">
                      <Tag className="w-3 h-3" />
                      <span>{content.version || 'v2.4 (2026)'}</span>
                    </div>
                  );
                }

                default: {
                  return (
                    <div className="p-4 rounded border border-dashed border-white/20 text-xs text-white/40">
                      [Khối: {block.type}]
                    </div>
                  );
                }
              }
            })()}
          </div>
        );
      })}
    </div>
  );
};
