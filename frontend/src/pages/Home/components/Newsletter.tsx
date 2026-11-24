import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSectionInView } from './WhiteEditorialHome';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Newsletter: React.FC = () => {
  const [sectionRef, inView] = useSectionInView(0.2);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      setStatus('error');
      setErrorMsg('Quý khách vui lòng nhập địa chỉ email.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setStatus('error');
      setErrorMsg('Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    if (!consent) {
      setStatus('error');
      setErrorMsg('Quý khách vui lòng đánh dấu xác nhận đồng ý nhận thư mời.');
      return;
    }

    setStatus('success');
    setErrorMsg('');
    setSubmittedEmail(trimmed);
    setEmail('');
  };

  return (
    <section
      ref={sectionRef}
      className="we-newsletter"
      id="newsletter"
      aria-label="Đăng ký nhận thư mời riêng"
    >
      <div className="we-newsletter-inner">
        {/* Label Mono Nhỏ */}
        <p className={`we-newsletter-badge we-fade-up we-stagger-1 ${inView ? 'is-in-view' : ''}`}>
          THƯ MỜI RIÊNG
        </p>

        {/* Heading Rất Lớn Chữ Kem (clamp 48-110px) */}
        <h2 className={`we-newsletter-heading we-fade-up we-stagger-2 ${inView ? 'is-in-view' : ''}`}>
          Nhận một email khi drop tiếp theo sẵn sàng.
        </h2>

        {/* Dòng Phụ */}
        <p className={`we-newsletter-sub we-fade-up we-stagger-3 ${inView ? 'is-in-view' : ''}`}>
          Mỗi drop một email. Không spam.
        </p>

        {/* Form Đăng Ký */}
        <div className={`we-newsletter-form-wrap we-fade-up we-stagger-4 ${inView ? 'is-in-view' : ''}`}>
          {status === 'success' ? (
            <div className="we-newsletter-success" role="status">
              <CheckCircle2 size={20} className="we-success-icon" />
              <div>
                <strong>Đăng ký thành công</strong>
                <p>
                  Thư mời độc quyền cho drop tiếp theo sẽ được gửi tới <b>{submittedEmail}</b>.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="we-newsletter-form">
              <div className="we-input-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  placeholder="your.name@atelier.com"
                  aria-label="Địa chỉ email nhận thư mời"
                  className="we-newsletter-input"
                />
                <button type="submit" className="we-newsletter-button">
                  <span>ĐĂNG KÝ</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Checkbox Đồng Ý */}
              <label className="we-consent-label">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (status === 'error') setStatus('idle');
                  }}
                  className="we-consent-checkbox"
                />
                <span>
                  Tôi đồng ý nhận thư mời riêng và thông báo drop mới từ Atelier Vérité. Quý khách có thể hủy đăng ký bất cứ lúc nào.
                </span>
              </label>

              {/* Thông Báo Lỗi */}
              {status === 'error' && (
                <div className="we-newsletter-error" role="alert">
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
