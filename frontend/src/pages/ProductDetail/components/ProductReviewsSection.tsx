import React, { useState, useEffect, useMemo } from 'react';
import { Star, ShieldCheck, MessageSquare, ThumbsUp, Filter, ArrowUpDown, Plus, Image as ImageIcon, X } from 'lucide-react';
import { reviewsApi } from '@/shared/api';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useToastStore } from '@/shared/stores/useToastStore';
import { formatDate } from '@/shared/utils/formatters';

interface ReviewItem {
  _id?: string;
  id?: string;
  product_id?: string;
  user_id?: {
    fullName?: string;
    avatar_url?: string;
  } | string;
  author?: string;
  rating: number;
  content?: {
    text?: string;
    images?: string[];
  } | string;
  comment?: string;
  createdAt?: string;
  date?: string;
  verified?: boolean;
}

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  initialRating?: number;
  initialReviewCount?: number;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  initialRating = 5.0,
  initialReviewCount = 0,
}) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterHasImage, setFilterHasImage] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Write Review Modal
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    let active = true;
    if (!productId) return;
    setLoading(true);

    reviewsApi
      .getProductReviews(productId)
      .then((res: any) => {
        if (!active) return;
        const list = res?.data || res?.items || (Array.isArray(res) ? res : []);
        setReviews(Array.isArray(list) ? list : []);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  // Extract author name
  const getAuthorName = (r: ReviewItem): string => {
    if (typeof r.user_id === 'object' && r.user_id?.fullName) return r.user_id.fullName;
    if (r.author) return r.author;
    return 'Hội viên Atelier';
  };

  // Extract comment text
  const getReviewText = (r: ReviewItem): string => {
    if (typeof r.content === 'object' && r.content?.text) return r.content.text;
    if (typeof r.content === 'string') return r.content;
    if (r.comment) return r.comment;
    return '';
  };

  // Extract review images
  const getReviewImages = (r: ReviewItem): string[] => {
    if (typeof r.content === 'object' && Array.isArray(r.content?.images)) {
      return r.content.images;
    }
    return [];
  };

  // Metrics calculation
  const totalCount = reviews.length > 0 ? reviews.length : initialReviewCount;
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return initialRating;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews, initialRating]);

  // Distribution
  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (reviews.length === 0 && initialReviewCount > 0) {
      counts[5] = initialReviewCount;
      return counts;
    }
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      counts[star as keyof typeof counts] = (counts[star as keyof typeof counts] || 0) + 1;
    });
    return counts;
  }, [reviews, initialReviewCount]);

  // Filtered & Sorted list
  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (filterRating !== null) {
      result = result.filter((r) => Math.round(r.rating) === filterRating);
    }

    if (filterHasImage) {
      result = result.filter((r) => getReviewImages(r).length > 0);
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime());
    } else if (sortBy === 'highest') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'lowest') {
      result.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    }

    return result;
  }, [reviews, filterRating, filterHasImage, sortBy]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      addToast({
        type: 'info',
        title: 'Yêu cầu đăng nhập',
        message: 'Kính mời quý khách đăng nhập để gửi đánh giá thẩm định tác phẩm.',
      });
      return;
    }

    if (!newComment.trim()) {
      addToast({
        type: 'error',
        title: 'Nội dung chưa đầy đủ',
        message: 'Quý khách vui lòng chia sẻ cảm nhận trải nghiệm trang phục.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewsApi.createReview({
        productId,
        rating: newRating,
        comment: newComment.trim(),
      });

      addToast({
        type: 'success',
        title: 'Gửi đánh giá thành công',
        message: 'Trân trọng cảm ơn quý khách đã chia sẻ thẩm định phong cách.',
      });

      // Refresh reviews
      const res: any = await reviewsApi.getProductReviews(productId);
      const list = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setReviews(Array.isArray(list) ? list : []);

      setIsWriteModalOpen(false);
      setNewComment('');
      setNewRating(5);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Không thể gửi đánh giá',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="customer-reviews"
      aria-label="Đánh giá từ giới mộ điệu"
      className="w-full pt-16 pb-20 border-t border-[var(--border)] transition-colors duration-300"
    >
      <div className="space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--border)]">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[var(--accent)] font-semibold block mb-2">
              VOICES OF DISTINCTION · HAUTE COUTURE FEEDBACK
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)]">
              Đánh Giá &amp; Cảm Nhận Quý Khách
            </h2>
          </div>

          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--text-primary)] text-[var(--bg-page)] text-xs uppercase tracking-[0.2em] font-medium hover:opacity-90 transition-opacity self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Viết Cảm Nhận Của Quý Khách</span>
          </button>
        </div>

        {/* Rating Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[var(--bg-card)] p-6 sm:p-8 border border-[var(--border)]">
          {/* Average Score */}
          <div className="md:col-span-4 text-center md:text-left space-y-2 border-b md:border-b-0 md:border-r border-[var(--border)] pb-6 md:pb-0 md:pr-8">
            <span className="font-mono text-5xl sm:text-6xl text-[var(--text-primary)] font-bold tracking-tight">
              {avgRating.toFixed(1)}
            </span>
            <div className="flex items-center justify-center md:justify-start gap-1 text-[var(--accent)]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(avgRating) ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-neutral-300 dark:text-neutral-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">
              Dựa trên {totalCount} lượt thẩm định độc lập
            </p>
          </div>

          {/* Star Distribution Bars */}
          <div className="md:col-span-8 space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star as keyof typeof distribution] || 0;
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-mono text-[var(--text-muted)] flex items-center gap-1 shrink-0">
                    {star} <Star className="w-3 h-3 fill-current text-[var(--accent)]" />
                  </span>
                  <div className="flex-1 h-2 bg-[var(--bg-page)] border border-[var(--border)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-[var(--text-muted)] text-[11px] shrink-0">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          {/* Star filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono mr-2">
              Bộ lọc:
            </span>
            <button
              onClick={() => {
                setFilterRating(null);
                setFilterHasImage(false);
              }}
              className={`px-3 py-1.5 text-xs transition-colors cursor-pointer border ${
                filterRating === null && !filterHasImage
                  ? 'bg-[var(--text-primary)] text-[var(--bg-page)] border-[var(--text-primary)] font-semibold'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
              }`}
            >
              Tất cả ({reviews.length})
            </button>
            {[5, 4, 3].map((star) => (
              <button
                key={star}
                onClick={() => setFilterRating(filterRating === star ? null : star)}
                className={`px-3 py-1.5 text-xs transition-colors cursor-pointer border flex items-center gap-1 ${
                  filterRating === star
                    ? 'bg-[var(--text-primary)] text-[var(--bg-page)] border-[var(--text-primary)] font-semibold'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
                }`}
              >
                <span>{star}</span>
                <Star className="w-3 h-3 fill-[var(--accent)] text-[var(--accent)]" />
              </button>
            ))}
          </div>

          {/* Sort order */}
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)] font-mono uppercase text-[11px]">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] px-2.5 py-1 text-xs focus:outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="highest">Đánh giá cao nhất</option>
              <option value="lowest">Đánh giá thấp nhất</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-6 border border-[var(--border)] bg-[var(--bg-card)] animate-pulse space-y-3">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 w-1/4 rounded" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 w-3/4 rounded" />
              </div>
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-16 px-4 border border-[var(--border)] bg-[var(--bg-card)] space-y-4">
            <MessageSquare className="w-10 h-10 mx-auto text-[var(--accent)] opacity-40" />
            <h4 className="font-serif text-xl text-[var(--text-primary)]">
              Chưa có đánh giá nào thỏa mãn bộ lọc
            </h4>
            <p className="text-xs text-[var(--text-secondary)] font-light max-w-md mx-auto leading-relaxed">
              Hãy là vị khách đầu tiên chia sẻ cảm nhận về phom dáng, chất liệu và kỹ thuật may đo của kiệt tác {productName}.
            </p>
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--text-primary)] text-[var(--bg-page)] text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gửi Đánh Giá Đầu Tiên</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((r, idx) => {
              const author = getAuthorName(r);
              const text = getReviewText(r);
              const imgs = getReviewImages(r);
              const dateStr = r.createdAt ? formatDate(r.createdAt) : r.date || 'Gần đây';

              return (
                <article
                  key={r._id || r.id || idx}
                  className="p-6 sm:p-8 border border-[var(--border)] bg-[var(--bg-card)] space-y-4 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--text-primary)] text-[var(--bg-page)] flex items-center justify-center font-serif text-xs font-semibold uppercase">
                        {author.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-[var(--text-primary)]">
                            {author}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--accent)] uppercase tracking-wider">
                            <ShieldCheck className="w-3 h-3" />
                            Đã Mua Hàng
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">
                          {dateStr}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[var(--accent)]">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < (r.rating || 5) ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-neutral-300 dark:text-neutral-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed whitespace-pre-line">
                    {text}
                  </p>

                  {imgs.length > 0 && (
                    <div className="flex gap-2 pt-2">
                      {imgs.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt="Ảnh đánh giá"
                          className="w-16 h-16 object-cover border border-[var(--border)]"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      {isWriteModalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsWriteModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-[var(--bg-page)] border border-[var(--border)] p-6 sm:p-8 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--accent)] font-semibold block">
                  ATELIER VÉRITÉ · THẨM ĐỊNH PHONG CÁCH
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)]">
                  Cảm Nhận Về {productName}
                </h3>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-5">
              {/* Star Picker */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                  Đánh giá mức độ hài lòng:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewRating(s)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      aria-label={`${s} sao`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= newRating ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-neutral-300 dark:text-neutral-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono text-[var(--accent)] font-semibold ml-2">
                    {newRating} / 5 Sao
                  </span>
                </div>
              </div>

              {/* Comment Input */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                  Nhận xét chi tiết (Phom dáng, chất liệu, độ thoải mái):
                </label>
                <textarea
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Quý khách đánh giá thế nào về phom dáng may đo và độ hoàn thiện của sản phẩm?..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] font-light leading-relaxed"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-5 py-2.5 border border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[var(--text-primary)] text-[var(--bg-page)] text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang Lưu...' : 'Gửi Đánh Giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
