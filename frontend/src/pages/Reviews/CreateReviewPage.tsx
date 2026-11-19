import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Star, Upload, ArrowRight, ShieldCheck, CheckCircle2, ArrowLeft, RotateCw } from 'lucide-react';
import { useToastStore } from '@/shared/stores/useToastStore';

export const CreateReviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const productId = searchParams.get('productId') || 'verite-01';
  const productName = searchParams.get('productName') || 'Măng Tô Dạ Cashmere Kiến Trúc';

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [fitRating, setFitRating] = useState<'small' | 'fit' | 'large'>('fit');
  const [comment, setComment] = useState('');
  const [agreePublish, setAgreePublish] = useState(false);
  const [agreeThankYou, setAgreeThankYou] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      addToast({
        title: 'Thiếu nội dung',
        message: 'Vui lòng chia sẻ cảm nhận về sản phẩm thời trang.',
        type: 'error',
      });
      return;
    }

    if (!agreePublish) {
      setConsentError('Quý khách vui lòng đồng ý cho phép hiển thị đánh giá công khai.');
      return;
    }

    setConsentError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      addToast({
        title: 'Gửi đánh giá thành công',
        message: 'Trân trọng cảm ơn quý khách đã đóng góp ý kiến thẩm mỹ cho Atelier.',
        type: 'success',
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-[#f2f2f4] pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {isSuccess ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-[#0f0f14] border border-white/10 shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-white uppercase tracking-wider font-medium">
              Đánh Giá Đã Được Ghi Nhận
            </h2>
            <p className="text-xs sm:text-sm text-white/60 font-light leading-relaxed">
              Cảm ơn quý khách đã dành thời gian chia sẻ cảm nhận thực tế về sản phẩm{' '}
              <strong className="text-white font-medium">{productName}</strong>. Đánh giá sẽ được hiển thị công khai sau khi duyệt tính xác thực.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="px-6 py-2.5 bg-[#d4af37] text-black text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-[#e5c158] transition-all"
              >
                Tiếp tục khám phá
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-10 rounded-2xl bg-[#0f0f14] border border-white/10 shadow-2xl space-y-6">
            <div className="text-center space-y-2 border-b border-white/10 pb-5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#d4af37]">
                ĐẶC QUYỀN ĐÁNH GIÁ PATRON
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl text-white uppercase tracking-wider font-medium">
                Cảm Nhận Sản Phẩm
              </h1>
              <p className="text-xs text-white/60 font-light text-[#d4af37]">
                {productName}
              </p>
            </div>

            {/* Prior Notice Box */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-[11px] text-white/60 space-y-1 leading-relaxed font-light">
              <div className="flex items-center gap-1.5 text-white font-medium text-xs text-[#d4af37]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Thông Báo Quyền Riêng Tư Khi Đánh Giá</span>
              </div>
              <p>
                Dữ liệu thu thập: Xếp hạng sao, đánh giá phom dáng, cảm nhận và hình ảnh tải lên. Mục đích: Đăng tải công khai đánh giá sản phẩm có chứng nhận Người mua đã xác thực theo Luật 91/2025/QH15.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Star Rating */}
              <div className="text-center pb-4 border-b border-white/5">
                <label className="block text-xs uppercase tracking-wider text-white/70 mb-3 font-serif">
                  Mức Độ Hài Lòng Tổng Thể
                </label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || rating) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-white/20'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-white/60 mt-2 block">
                  {rating === 5 ? 'Tuyệt hảo — Vượt trên kỳ vọng' : rating === 4 ? 'Rất hài lòng' : rating === 3 ? 'Hài lòng' : 'Cần cải thiện'}
                </span>
              </div>

              {/* Fit assessment */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-serif">
                  Đánh Giá Độ Vừa Vặn Của Phom Dáng
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'small', label: 'Hơi Ôm' },
                    { id: 'fit', label: 'Chuẩn Kích Cỡ' },
                    { id: 'large', label: 'Hơi Rộng' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFitRating(item.id as 'small' | 'fit' | 'large')}
                      className={`py-2.5 text-xs uppercase tracking-wider border rounded-xl transition-all ${
                        fitRating === item.id
                          ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37] font-semibold'
                          : 'border-white/10 text-white/60 hover:border-white/30'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5 font-serif">
                  Cảm Nhận Chi Tiết (Chất Liệu, Đường May, Độ Rủ) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm thực tế khi mặc, cảm giác trên da và cách phối đồ..."
                  className="w-full p-3.5 text-xs bg-[#14141a] border border-white/10 focus:border-[#d4af37] text-white focus:outline-none rounded-xl transition-colors"
                />
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-white/5 text-[11px] text-white/70 leading-relaxed">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreePublish}
                    onChange={(e) => {
                      setAgreePublish(e.target.checked);
                      if (e.target.checked) setConsentError('');
                    }}
                    className="w-4 h-4 rounded mt-0.5 accent-[#d4af37] cursor-pointer"
                  />
                  <span>
                    Tôi đồng ý cho phép Atelier Vérité công khai nội dung đánh giá và hình ảnh đính kèm trên trang sản phẩm. <span className="text-[#d4af37]">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeThankYou}
                    onChange={(e) => setAgreeThankYou(e.target.checked)}
                    className="w-4 h-4 rounded mt-0.5 accent-[#d4af37] cursor-pointer"
                  />
                  <span>
                    Tôi đồng ý nhận email thông báo ưu đãi tri ân sau khi đánh giá được duyệt (Tùy chọn).
                  </span>
                </label>

                {consentError && (
                  <p className="text-[11px] text-rose-400 font-medium">{consentError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#d4af37] text-black hover:bg-[#e5c158] uppercase text-xs tracking-widest font-semibold transition-all rounded-xl shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Gửi Đánh Giá Sản Phẩm</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
