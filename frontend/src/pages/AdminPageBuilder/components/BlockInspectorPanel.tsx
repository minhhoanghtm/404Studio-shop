/**
 * Block Inspector Panel
 * Allows editing Content, Typography, Styling, Colors (with WCAG contrast verification), and Responsive settings.
 */

import React, { useState } from 'react';
import {
  Sliders,
  Type,
  Palette,
  Eye,
  Settings,
  Upload,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { BlockItem, BlockStyles, BlockResponsive, PageDocument } from '@/shared/cms/types';
import { ContrastIndicator } from './ContrastChecker';
import { uploadApi } from '@/shared/api';

interface BlockInspectorPanelProps {
  selectedBlock: BlockItem | null;
  pageMeta: Partial<PageDocument>;
  onUpdateBlock: (blockId: string, updates: Partial<BlockItem>) => void;
  onUpdatePageMeta: (updates: Partial<PageDocument>) => void;
}

export const BlockInspectorPanel: React.FC<BlockInspectorPanelProps> = ({
  selectedBlock,
  pageMeta,
  onUpdateBlock,
  onUpdatePageMeta,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'styles' | 'responsive'>('content');
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: string) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBlock) return;

    setIsUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      if (res?.data?.url) {
        onUpdateBlock(selectedBlock.id, {
          content: {
            ...selectedBlock.content,
            [targetField]: res.data.url,
          },
        });
      }
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedBlock) {
    // Show Page Settings Inspector
    return (
      <div className="h-full flex flex-col bg-[#0e0e14] border-l border-white/10 select-none overflow-y-auto">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-xs font-semibold uppercase text-white tracking-wider">
            Cấu Hình Trang & SEO
          </h3>
        </div>

        <div className="p-4 space-y-4 text-xs">
          <div>
            <label className="block text-white/60 mb-1">Tiêu Đề Trang (Title)</label>
            <input
              type="text"
              value={pageMeta.title || ''}
              onChange={(e) => onUpdatePageMeta({ title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white/60 mb-1">Đường Dẫn Tĩnh (Slug)</label>
            <input
              type="text"
              value={pageMeta.slug || ''}
              onChange={(e) => onUpdatePageMeta({ slug: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white font-mono focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white/60 mb-1">Loại Trang (Page Type)</label>
            <select
              value={pageMeta.type || 'landing'}
              onChange={(e) => onUpdatePageMeta({ type: e.target.value as any })}
              className="w-full bg-[#181822] border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
            >
              <option value="about">Giới Thiệu (About Us)</option>
              <option value="policy">Chính Sách Pháp Lý (Policy)</option>
              <option value="lookbook">Bộ Sưu Tập (Lookbook)</option>
              <option value="landing">Chiến Dịch (Landing Page)</option>
              <option value="faq">Hỏi Đáp (FAQ)</option>
              <option value="guide">Cẩm Nang May Đo (Guide)</option>
            </select>
          </div>

          <div>
            <label className="block text-white/60 mb-1">Trạng Thái (Status)</label>
            <select
              value={pageMeta.status || 'draft'}
              onChange={(e) => onUpdatePageMeta({ status: e.target.value as any })}
              className="w-full bg-[#181822] border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
            >
              <option value="draft">Bản Nháp (Draft)</option>
              <option value="published">Đã Xuất Bản (Published)</option>
              <option value="archived">Lưu Trữ (Archived)</option>
            </select>
          </div>

          <div className="pt-2 border-t border-white/10">
            <label className="block text-white/60 mb-1">Tiêu Đề SEO (Meta Title)</label>
            <input
              type="text"
              value={pageMeta.seoTitle || ''}
              onChange={(e) => onUpdatePageMeta({ seoTitle: e.target.value })}
              placeholder="VD: Atelier Vérité — BST Thu Đông 2026"
              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white/60 mb-1">Mô Tả SEO (Meta Description)</label>
            <textarea
              rows={3}
              value={pageMeta.seoDescription || ''}
              onChange={(e) => onUpdatePageMeta({ seoDescription: e.target.value })}
              placeholder="Mô tả nội dung trang cho công cụ tìm kiếm..."
              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-white/60 mb-1">Từ Khóa SEO (Meta Keywords)</label>
            <input
              type="text"
              value={pageMeta.seoKeywords || ''}
              onChange={(e) => onUpdatePageMeta({ seoKeywords: e.target.value })}
              placeholder="haute couture, may do, thoi trang cao cap"
              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
            />
          </div>
        </div>
      </div>
    );
  }

  const { content, styles = {}, responsive = {} } = selectedBlock;

  const updateContent = (key: string, value: any) => {
    onUpdateBlock(selectedBlock.id, {
      content: { ...content, [key]: value },
    });
  };

  const updateStyles = (updates: Partial<BlockStyles>) => {
    onUpdateBlock(selectedBlock.id, {
      styles: { ...styles, ...updates },
    });
  };

  const updateResponsive = (updates: Partial<BlockResponsive>) => {
    onUpdateBlock(selectedBlock.id, {
      responsive: { ...responsive, ...updates },
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#0e0e14] border-l border-white/10 select-none overflow-y-auto">
      {/* Header with Block Identity */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-semibold uppercase text-white truncate max-w-[140px]">
            {selectedBlock.label || selectedBlock.type}
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#d4af37] uppercase px-1.5 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/30">
          {selectedBlock.category}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-white/[0.02]">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-2 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'content'
              ? 'border-b-2 border-[#d4af37] text-[#d4af37] font-semibold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Nội Dung</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('styles')}
          className={`flex-1 py-2 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'styles'
              ? 'border-b-2 border-[#d4af37] text-[#d4af37] font-semibold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Kiểu Dáng</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('responsive')}
          className={`flex-1 py-2 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'responsive'
              ? 'border-b-2 border-[#d4af37] text-[#d4af37] font-semibold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Hiển Thị</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-4 space-y-4 text-xs flex-1 overflow-y-auto">
        {activeTab === 'content' && (
          <div className="space-y-3">
            {/* Dynamic Content Form Based on Block Type */}
            {selectedBlock.type === 'heading' && (
              <>
                <div>
                  <label className="block text-white/60 mb-1">Nhãn Phụ (Tagline)</label>
                  <input
                    type="text"
                    value={content.tagline || ''}
                    onChange={(e) => updateContent('tagline', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Văn Bản Tiêu Đề</label>
                  <input
                    type="text"
                    value={content.text || ''}
                    onChange={(e) => updateContent('text', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Cấp Độ Tiêu Đề (H1 - H4)</label>
                  <select
                    value={content.level || 'h2'}
                    onChange={(e) => updateContent('level', e.target.value)}
                    className="w-full bg-[#181822] border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="h1">H1 — Tiêu Đề Chính</option>
                    <option value="h2">H2 — Tiêu Đề Phân Mục</option>
                    <option value="h3">H3 — Tiêu Đề Nhóm</option>
                    <option value="h4">H4 — Tiêu Đề Nhỏ</option>
                  </select>
                </div>
              </>
            )}

            {selectedBlock.type === 'paragraph' && (
              <div>
                <label className="block text-white/60 mb-1">Nội Dung Đoạn Văn</label>
                <textarea
                  rows={5}
                  value={content.text || ''}
                  onChange={(e) => updateContent('text', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none resize-none leading-relaxed"
                />
              </div>
            )}

            {selectedBlock.type === 'rich_text' && (
              <div>
                <label className="block text-white/60 mb-1">HTML Định Dạng Tự Do</label>
                <textarea
                  rows={6}
                  value={content.html || ''}
                  onChange={(e) => updateContent('html', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded p-2 text-white font-mono text-[11px] focus:border-[#d4af37] focus:outline-none resize-none"
                />
              </div>
            )}

            {selectedBlock.type === 'quote' && (
              <>
                <div>
                  <label className="block text-white/60 mb-1">Câu Trích Dẫn</label>
                  <textarea
                    rows={3}
                    value={content.quote || ''}
                    onChange={(e) => updateContent('quote', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Tác Giả / Người Phát Ngôn</label>
                  <input
                    type="text"
                    value={content.author || ''}
                    onChange={(e) => updateContent('author', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </>
            )}

            {(selectedBlock.type === 'image' || selectedBlock.type === 'banner') && (
              <>
                <div>
                  <label className="block text-white/60 mb-1">Đường Dẫn Ảnh (Image URL)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={content.url || content.imageUrl || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (selectedBlock.type === 'banner') updateContent('imageUrl', val);
                        else updateContent('url', val);
                      }}
                      className="flex-1 bg-white/5 border border-white/10 rounded p-2 text-white text-xs focus:border-[#d4af37] focus:outline-none font-mono"
                    />
                    <label className="p-2 rounded bg-[#d4af37] text-black cursor-pointer hover:bg-[#e5c158] flex items-center justify-center">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(
                            e,
                            selectedBlock.type === 'banner' ? 'imageUrl' : 'url'
                          )
                        }
                      />
                    </label>
                  </div>
                  {isUploading && (
                    <span className="text-[10px] text-[#d4af37] mt-1 block">
                      Đang tải ảnh lên máy chủ...
                    </span>
                  )}
                </div>

                {selectedBlock.type === 'image' && (
                  <>
                    <div>
                      <label className="block text-white/60 mb-1">Văn Bản Thay Thế (Alt)</label>
                      <input
                        type="text"
                        value={content.alt || ''}
                        onChange={(e) => updateContent('alt', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 mb-1">Chú Thích Dưới Ảnh</label>
                      <input
                        type="text"
                        value={content.caption || ''}
                        onChange={(e) => updateContent('caption', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {selectedBlock.type === 'banner' && (
                  <>
                    <div>
                      <label className="block text-white/60 mb-1">Tiêu Đề Banner</label>
                      <input
                        type="text"
                        value={content.title || ''}
                        onChange={(e) => updateContent('title', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 mb-1">Mô Tả Phụ (Subtitle)</label>
                      <input
                        type="text"
                        value={content.subtitle || ''}
                        onChange={(e) => updateContent('subtitle', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-white/60 mb-1">Nút Bấm</label>
                        <input
                          type="text"
                          value={content.buttonText || ''}
                          onChange={(e) => updateContent('buttonText', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 mb-1">Liên Kết</label>
                        <input
                          type="text"
                          value={content.buttonLink || ''}
                          onChange={(e) => updateContent('buttonLink', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {selectedBlock.type === 'cta_button' && (
              <>
                <div>
                  <label className="block text-white/60 mb-1">Nhãn Nút (Button Label)</label>
                  <input
                    type="text"
                    value={content.label || ''}
                    onChange={(e) => updateContent('label', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Đường Dẫn Đích (Link URL)</label>
                  <input
                    type="text"
                    value={content.link || ''}
                    onChange={(e) => updateContent('link', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </>
            )}

            {selectedBlock.type === 'policy_section' && (
              <>
                <div>
                  <label className="block text-white/60 mb-1">Số Điều / Khoản</label>
                  <input
                    type="text"
                    value={content.articleNumber || ''}
                    onChange={(e) => updateContent('articleNumber', e.target.value)}
                    placeholder="VD: Điều 1, Mục 2.1"
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Tiêu Đề Điều Khoản</label>
                  <input
                    type="text"
                    value={content.title || ''}
                    onChange={(e) => updateContent('title', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Nội Dung Pháp Lý</label>
                  <textarea
                    rows={6}
                    value={content.content || ''}
                    onChange={(e) => updateContent('content', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </>
            )}

            {selectedBlock.type === 'effective_date' && (
              <div>
                <label className="block text-white/60 mb-1">Ngày Có Hiệu Lực</label>
                <input
                  type="text"
                  value={content.dateText || ''}
                  onChange={(e) => updateContent('dateText', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            )}

            {selectedBlock.type === 'policy_version' && (
              <div>
                <label className="block text-white/60 mb-1">Phiên Bản Văn Bản</label>
                <input
                  type="text"
                  value={content.version || ''}
                  onChange={(e) => updateContent('version', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:border-[#d4af37] focus:outline-none font-mono"
                />
              </div>
            )}

            {/* Fallback for other blocks */}
            {!['heading', 'paragraph', 'rich_text', 'quote', 'image', 'banner', 'cta_button', 'policy_section', 'effective_date', 'policy_version'].includes(selectedBlock.type) && (
              <div className="p-3 rounded bg-white/5 text-[11px] text-white/60">
                Chỉnh sửa trực tiếp dữ liệu cấu trúc cho khối: <strong>{selectedBlock.type}</strong>
              </div>
            )}
          </div>
        )}

        {activeTab === 'styles' && (
          <div className="space-y-4">
            {/* Typography */}
            <div className="space-y-2">
              <label className="block text-white/60 font-semibold uppercase text-[10px] tracking-wider">
                Kiểu Chữ (Typography)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-white/40 text-[10px] mb-1">Font Family</label>
                  <select
                    value={styles.fontFamily || 'sans'}
                    onChange={(e) => updateStyles({ fontFamily: e.target.value as any })}
                    className="w-full bg-[#181822] border border-white/10 rounded p-1.5 text-white focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="sans">Sans-serif (Hiện Đại)</option>
                    <option value="serif">Serif (Cổ Điển Hoàng Gia)</option>
                    <option value="mono">Monospace (Mã Lệnh)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/40 text-[10px] mb-1">Căn Lề</label>
                  <select
                    value={styles.textAlign || 'left'}
                    onChange={(e) => updateStyles({ textAlign: e.target.value as any })}
                    className="w-full bg-[#181822] border border-white/10 rounded p-1.5 text-white focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="left">Trái (Left)</option>
                    <option value="center">Giữa (Center)</option>
                    <option value="right">Phải (Right)</option>
                    <option value="justify">Đều 2 bên</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Colors with Contrast Verification */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="block text-white/60 font-semibold uppercase text-[10px] tracking-wider">
                Màu Sắc & Độ Tương Phản (Colors & Contrast)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-white/40 text-[10px] mb-1">Màu Chữ (Text)</label>
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded p-1">
                    <input
                      type="color"
                      value={styles.textColor || '#ffffff'}
                      onChange={(e) => updateStyles({ textColor: e.target.value })}
                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={styles.textColor || '#ffffff'}
                      onChange={(e) => updateStyles({ textColor: e.target.value })}
                      className="w-full bg-transparent text-[11px] text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/40 text-[10px] mb-1">Màu Nền (BG)</label>
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded p-1">
                    <input
                      type="color"
                      value={styles.backgroundColor || '#0b0b0e'}
                      onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={styles.backgroundColor || '#0b0b0e'}
                      onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                      className="w-full bg-transparent text-[11px] text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time WCAG AA Contrast Evaluation */}
              <ContrastIndicator
                textColor={styles.textColor || '#ffffff'}
                bgColor={styles.backgroundColor || '#0b0b0e'}
              />
            </div>

            {/* Spacing */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="block text-white/60 font-semibold uppercase text-[10px] tracking-wider">
                Khoảng Cách & Đệm (Spacing)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-white/40 text-[10px] mb-1">Cách Trên (Margin Top)</label>
                  <input
                    type="number"
                    value={styles.marginTop || 0}
                    onChange={(e) => updateStyles({ marginTop: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded p-1.5 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/40 text-[10px] mb-1">Cách Dưới (Margin Bottom)</label>
                  <input
                    type="number"
                    value={styles.marginBottom || 16}
                    onChange={(e) => updateStyles({ marginBottom: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded p-1.5 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'responsive' && (
          <div className="space-y-3">
            <div className="text-white/60 text-xs mb-2">
              Ẩn hoặc hiển thị khối này tùy theo kích thước màn hình người xem:
            </div>
            <label className="flex items-center gap-2.5 p-2.5 rounded bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
              <input
                type="checkbox"
                checked={Boolean(responsive.hideOnMobile)}
                onChange={(e) => updateResponsive({ hideOnMobile: e.target.checked })}
                className="rounded border-white/20 text-[#d4af37] focus:ring-0"
              />
              <div>
                <div className="text-xs font-medium text-white">Ẩn trên Điện Thoại (Mobile)</div>
                <div className="text-[10px] text-white/40">Màn hình dưới 640px</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
              <input
                type="checkbox"
                checked={Boolean(responsive.hideOnTablet)}
                onChange={(e) => updateResponsive({ hideOnTablet: e.target.checked })}
                className="rounded border-white/20 text-[#d4af37] focus:ring-0"
              />
              <div>
                <div className="text-xs font-medium text-white">Ẩn trên Máy Tính Bảng (Tablet)</div>
                <div className="text-[10px] text-white/40">Màn hình từ 640px đến 1024px</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
              <input
                type="checkbox"
                checked={Boolean(responsive.hideOnDesktop)}
                onChange={(e) => updateResponsive({ hideOnDesktop: e.target.checked })}
                className="rounded border-white/20 text-[#d4af37] focus:ring-0"
              />
              <div>
                <div className="text-xs font-medium text-white">Ẩn trên Máy Tính (Desktop)</div>
                <div className="text-[10px] text-white/40">Màn hình trên 1024px</div>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
