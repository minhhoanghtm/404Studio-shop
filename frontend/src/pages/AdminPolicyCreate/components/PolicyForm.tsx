import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Eye,
  Edit3,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  FileText,
  Globe,
  Settings,
} from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { PolicyDocument, PolicySection } from '@/shared/api';
import { sanitizeHtml } from '@/shared/utils/sanitizeHtml';
import { POLICY_CATEGORIES } from '../../AdminPolicies/types';

interface PolicyFormProps {
  initialData?: PolicyDocument | null;
  onSubmit: (formData: any) => Promise<void>;
  isLoading?: boolean;
  isEdit?: boolean;
}

export const PolicyForm: React.FC<PolicyFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  isEdit = false,
}) => {
  const navigate = useNavigate();

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryKey, setCategoryKey] = useState('privacy');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [content, setContent] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  // Active view tab: editor vs preview
  const [viewTab, setViewTab] = useState<'editor' | 'preview'>('editor');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; slug?: string; content?: string }>({});

  // Auto slug generation helper
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setSlug(initialData.slug || '');
      setExcerpt(initialData.excerpt || '');
      setStatus(initialData.status || 'draft');
      setDisplayOrder(initialData.displayOrder || 0);
      setSeoTitle(initialData.seoTitle || '');
      setSeoDescription(initialData.seoDescription || '');
      setSeoKeywords(initialData.seoKeywords || '');

      // Extract content from sections
      if (initialData.sections && initialData.sections.length > 0) {
        const storySection = initialData.sections.find((s) => s.type === 'story');
        if (storySection?.data?.content) {
          setContent(storySection.data.content);
        } else {
          // Combine any available content
          const combined = initialData.sections
            .map((s) => s.data?.content || s.data?.description || '')
            .filter(Boolean)
            .join('\n\n');
          setContent(combined);
        }
      }
    }
  }, [initialData]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setHasUnsavedChanges(true);
    if (!isEdit && (!slug || slug === generateSlug(title))) {
      setSlug(generateSlug(val));
    }
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    setHasUnsavedChanges(true);
  };

  const validate = (): boolean => {
    const errors: { title?: string; slug?: string; content?: string } = {};
    if (!title.trim()) errors.title = 'Tiêu đề chính sách không được để trống';
    if (!slug.trim()) errors.slug = 'Đường dẫn tĩnh (slug) không được để trống';
    if (!content.trim()) errors.content = 'Nội dung chính sách không được để trống';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Sanitize content against stored XSS
    const sanitizedContent = sanitizeHtml(content);

    const sections: PolicySection[] = [
      {
        type: 'hero',
        order: 0,
        isActive: true,
        data: {
          title: title.toUpperCase(),
          subtitle: excerpt || 'Chính Sách & Quy Chuẩn Hoạt Động Doanh Nghiệp Atelier Vérité',
          description: excerpt,
        },
      },
      {
        type: 'story',
        order: 1,
        isActive: true,
        data: {
          heading: title,
          content: sanitizedContent,
        },
      },
      {
        type: 'cta',
        order: 2,
        isActive: true,
        data: {
          title: 'CẦN TƯ VẤN THÊM VỀ CHÍNH SÁCH?',
          description: 'Đội ngũ DPO & Ban Pháp Chế Atelier Vérité luôn sẵn sàng giải đáp thắc mắc.',
          buttonText: 'LIÊN HỆ PHÁP CHẾ',
          buttonLink: 'mailto:dpo@atelierverite.com',
        },
      },
    ];

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      type: 'policy',
      excerpt: excerpt.trim(),
      status,
      displayOrder: Number(displayOrder),
      seoTitle: seoTitle.trim() || title.trim(),
      seoDescription: seoDescription.trim() || excerpt.trim(),
      seoKeywords: seoKeywords.trim(),
      publishedAt: status === 'published' ? new Date().toISOString() : null,
      sections,
    };

    await onSubmit(payload);
    setHasUnsavedChanges(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Header Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-noir-900/60 p-4 border border-white/10 rounded-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/policies')}
            className="p-2 border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:text-[var(--accent)] rounded-lg transition-all shadow-xs hover:shadow-sm cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-display text-lg text-white">
              {isEdit ? `Chỉnh Sửa Chính Sách: ${initialData?.title || ''}` : 'Soạn Thảo Chính Sách Doanh Nghiệp'}
            </h2>
            <p className="text-xs text-platinum-dark">
              {hasUnsavedChanges ? (
                <span className="text-amber-400 font-medium">● Có thay đổi chưa lưu</span>
              ) : (
                <span className="text-emerald-400">Đã đồng bộ với máy chủ</span>
              )}
            </p>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Editor / Preview Tab Switcher */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewTab('editor')}
              className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                viewTab === 'editor'
                  ? 'admin-tab-active'
                  : 'admin-tab-inactive'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Soạn Thảo</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('preview')}
              className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                viewTab === 'preview'
                  ? 'admin-tab-active'
                  : 'admin-tab-inactive'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem Trước</span>
            </button>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 bg-[var(--accent)] hover:brightness-105 text-[var(--accent-contrast)] border border-[var(--accent)] font-bold text-xs font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Đang Lưu...' : isEdit ? 'Cập Nhật Chính Sách' : 'Lưu & Khởi Tạo'}</span>
          </button>
        </div>
      </div>

      {viewTab === 'editor' ? (
        // ================= EDITOR VIEW =================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Slug */}
            <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-platinum-light mb-1.5">
                  Tiêu Đề Chính Sách <span className="text-champagne">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ví dụ: Chính Sách Bảo Mật & Bảo Vệ Dữ Liệu Cá Nhân"
                  className={`w-full px-4 py-2.5 bg-noir-950 border ${
                    formErrors.title ? 'border-red-500' : 'border-white/15'
                  } rounded-sm text-sm text-white placeholder-platinum-dark/50 focus:outline-none focus:border-champagne transition-colors`}
                />
                {formErrors.title && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-platinum-light mb-1.5">
                  Đường Dẫn Tĩnh (Slug) <span className="text-champagne">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-noir-950/80 border border-r-0 border-white/15 text-xs font-mono text-platinum-dark rounded-l-sm">
                    /
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="chinh-sach-bao-mat"
                    className={`flex-1 px-4 py-2.5 bg-noir-950 border ${
                      formErrors.slug ? 'border-red-500' : 'border-white/15'
                    } rounded-r-sm text-xs font-mono text-champagne focus:outline-none focus:border-champagne transition-colors`}
                  />
                </div>
                {formErrors.slug && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.slug}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-platinum-light mb-1.5">
                  Tóm Tắt Ngắn (Excerpt)
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => {
                    setExcerpt(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  rows={2}
                  placeholder="Mô tả tóm tắt nội dung chính sách hiển thị ở đầu trang..."
                  className="w-full px-4 py-2 bg-noir-950 border border-white/15 rounded-sm text-xs text-white placeholder-platinum-dark/50 focus:outline-none focus:border-champagne transition-colors"
                />
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="p-6 bg-noir-900 border border-white/10 rounded-sm">
              <RichTextEditor
                value={content}
                onChange={handleContentChange}
                label="Nội Dung Chi Tiết Văn Bản Pháp Lý"
                placeholder="Nhập toàn văn quy định, điều khoản, quyền và nghĩa vụ..."
                minHeight="380px"
              />
              {formErrors.content && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.content}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar Settings Column (1/3 width) */}
          <div className="space-y-6">
            {/* Lifecycle & Status Card */}
            <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-white font-medium text-xs uppercase tracking-wider">
                <Settings className="w-4 h-4 text-champagne" />
                <span>Trạng Thái & Vòng Đời</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-platinum-light mb-1.5">
                  Trạng Thái Áp Dụng
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as any);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 bg-noir-950 border border-white/15 rounded-sm text-xs text-white focus:outline-none focus:border-champagne"
                >
                  <option value="draft">Bản nháp (Draft - Chưa công khai)</option>
                  <option value="published">Đã xuất bản (Published - Có hiệu lực)</option>
                  <option value="archived">Đã lưu trữ (Archived - Ngừng hiệu lực)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-platinum-light mb-1.5">
                  Phân Loại Nghiệp Vụ
                </label>
                <select
                  value={categoryKey}
                  onChange={(e) => {
                    setCategoryKey(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 bg-noir-950 border border-white/15 rounded-sm text-xs text-white focus:outline-none focus:border-champagne"
                >
                  {POLICY_CATEGORIES.filter((c) => c.key !== 'all').map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-platinum-light mb-1.5">
                  Thứ Tự Sắp Xếp (Display Order)
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => {
                    setDisplayOrder(parseInt(e.target.value, 10) || 0);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 bg-noir-950 border border-white/15 rounded-sm text-xs text-white font-mono focus:outline-none focus:border-champagne"
                />
              </div>

              <div className="pt-2 text-[11px] text-platinum-dark space-y-1">
                <div className="flex justify-between">
                  <span>Loại thực thể:</span>
                  <span className="font-mono text-champagne">policy</span>
                </div>
                {initialData?.createdAt && (
                  <div className="flex justify-between">
                    <span>Khởi tạo lúc:</span>
                    <span className="font-mono text-white/80">
                      {new Date(initialData.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
                {initialData?.publishedAt && (
                  <div className="flex justify-between">
                    <span>Xuất bản lúc:</span>
                    <span className="font-mono text-emerald-400">
                      {new Date(initialData.publishedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* SEO Optimization Card */}
            <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-white font-medium text-xs uppercase tracking-wider">
                <Globe className="w-4 h-4 text-champagne" />
                <span>Tối Ưu Hóa SEO & Pháp Lý</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-platinum-light mb-1.5">
                  Tiêu Đề Trang SEO (SEO Title)
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder={title || 'Tiêu đề hiển thị trên Google'}
                  className="w-full px-3 py-2 bg-noir-950 border border-white/15 rounded-sm text-xs text-white focus:outline-none focus:border-champagne"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-platinum-light mb-1.5">
                  Mô Tả SEO (Meta Description)
                </label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => {
                    setSeoDescription(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  rows={3}
                  placeholder={excerpt || 'Tóm lược cho máy chủ tìm kiếm...'}
                  className="w-full px-3 py-2 bg-noir-950 border border-white/15 rounded-sm text-xs text-white focus:outline-none focus:border-champagne"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-platinum-light mb-1.5">
                  Từ Khóa SEO (Keywords)
                </label>
                <input
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => {
                    setSeoKeywords(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="chinh sach, bao mat, du lieu ca nhan"
                  className="w-full px-3 py-2 bg-noir-950 border border-white/15 rounded-sm text-xs text-white focus:outline-none focus:border-champagne"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ================= LIVE PREVIEW VIEW =================
        <div className="p-8 bg-noir-900 border border-white/10 rounded-sm space-y-8 max-w-4xl mx-auto shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs text-platinum-dark">
            <span className="flex items-center gap-2 text-champagne font-mono uppercase tracking-widest text-[11px]">
              <Sparkles className="w-3.5 h-3.5" /> Chế độ xem trước giao diện công khai
            </span>
            <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] font-mono">
              Trạng thái dự kiến: {status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="font-serif text-3xl sm:text-4xl uppercase tracking-wider text-white">
              {title || 'Tiêu Đề Chính Sách Chưa Đặt'}
            </h1>
            {excerpt && (
              <p className="text-sm text-platinum-dark font-light leading-relaxed">
                {excerpt}
              </p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-platinum-dark font-mono pt-2 border-t border-white/5">
              <span>Đường dẫn: /{slug}</span>
              <span>•</span>
              <span>Cập nhật: {new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          {/* Render Sanitized Rich Content */}
          <div
            className="prose prose-invert max-w-none text-sm text-platinum-light leading-relaxed space-y-4 border-t border-white/10 pt-6"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) || '<p class="text-platinum-dark italic">Chưa có nội dung văn bản.</p>' }}
          />

          <div className="p-6 rounded-sm bg-champagne/5 border border-champagne/20 text-xs space-y-2 text-platinum-light">
            <div className="flex items-center gap-2 text-champagne font-semibold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4" /> Cam kết tuân thủ pháp luật
            </div>
            <p className="text-platinum-dark text-xs">
              Văn bản chính sách này được áp dụng công khai cho toàn thể khách hàng và người truy cập Atelier Vérité khi được xuất bản chính thức.
            </p>
          </div>
        </div>
      )}
    </form>
  );
};
