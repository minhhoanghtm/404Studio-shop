import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { useToastStore } from '../../shared/stores/useToastStore';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const { register } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (!agreeTerms) {
      addToast({
        title: 'Điều khoản sử dụng',
        message: 'Quý khách vui lòng đọc và đồng ý với Điều khoản sử dụng để tiếp tục.',
        type: 'error',
      });
      return;
    }

    if (!agreePrivacy) {
      addToast({
        title: 'Chính sách bảo mật',
        message: 'Quý khách vui lòng đồng ý cho phép xử lý dữ liệu cá nhân để thiết lập tài khoản.',
        type: 'error',
      });
      return;
    }

    const registered = await register(name, email, password);
    if (!registered) {
      addToast({ title: 'Không thể đăng ký', message: 'Backend không thể tạo tài khoản. Vui lòng thử lại.', type: 'error' });
      return;
    }
    addToast({
      title: 'Đăng ký thành công',
      message: 'Chào mừng quý khách đến với Atelier Vérité.',
      type: 'success',
    });
    navigate('/account');
  };

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-[85vh] flex items-center justify-center p-6 pt-28 pb-16">
      <div className="max-w-md w-full p-8 sm:p-10 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold">
            ĐĂNG KÝ HỘI VIÊN MAISON
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-wide font-medium">
            Đăng Ký Tài Khoản Patron
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-sans font-light">
            Gia nhập danh bạ khách hàng danh dự để nhận thư mời các buổi trình diễn Runway và đặc quyền salon riêng.
          </p>
        </div>

        {/* Prior Notice Disclosure Box */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] space-y-1.5 leading-relaxed font-light">
          <div className="flex items-center gap-1.5 font-medium text-xs text-[var(--accent)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Thông Báo Trước Khi Thu Thập Dữ Liệu</span>
          </div>
          <p>
            Dữ liệu thu thập: Họ tên, email, mật khẩu. Mục đích: Thiết lập hồ sơ khách hàng và quản lý tài khoản. Đơn vị xử lý: Atelier Vérité. Căn cứ: Thực hiện hợp đồng và sự đồng thuận theo Luật 91/2025/QH15.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1 font-medium">
              Họ và tên quý khách *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn An"
              className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] outline-none rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1 font-medium">
              Email đăng ký *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patron@domain.com"
              className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] outline-none rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1 font-medium">
              Mật khẩu bảo mật *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] outline-none rounded-xl"
            />
          </div>

          {/* Unbundled Independent Consent Checkboxes (Never Pre-ticked) */}
          <div className="space-y-2.5 pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)] leading-relaxed">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded mt-0.5 accent-[var(--accent)] cursor-pointer"
              />
              <span>
                Tôi đã đọc và đồng ý với{' '}
                <Link to="/terms-of-service" target="_blank" className="text-[var(--accent)] underline hover:text-[#9E7B15]">
                  Điều khoản sử dụng
                </Link>
                . <span className="text-[var(--accent)]">*</span>
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                className="w-4 h-4 rounded mt-0.5 accent-[var(--accent)] cursor-pointer"
              />
              <span>
                Tôi đồng ý xử lý dữ liệu cá nhân cho mục đích thiết lập hồ sơ Patron và quản trị dịch vụ theo{' '}
                <Link to="/privacy-policy" target="_blank" className="text-[var(--accent)] underline hover:text-[#9E7B15]">
                  Chính sách bảo mật
                </Link>
                . <span className="text-[var(--accent)]">*</span>
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeMarketing}
                onChange={(e) => setAgreeMarketing(e.target.checked)}
                className="w-4 h-4 rounded mt-0.5 accent-[var(--accent)] cursor-pointer"
              />
              <span>
                Tôi đồng ý nhận thư mời tham dự Runway show và thông báo bộ sưu tập giới hạn qua email (Tùy chọn).
              </span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 shadow-lg rounded-xl"
            >
              <span>Tạo hồ sơ Patron</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border)] space-y-2">
          <p>
            Đã có tài khoản thành viên?{' '}
            <Link to="/login" className="text-[var(--accent)] font-semibold hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
