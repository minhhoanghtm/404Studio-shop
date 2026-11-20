export interface GuardrailCheckResult {
  blocked: boolean;
  code?: string;
  reason?: string;
  replyMessage?: string;
}

const PASSWORD_CHANGE_PATTERNS = [
  /đổi\s*mật\s*khẩu/i,
  /thay\s*đổi\s*mật\s*khẩu/i,
  /change\s*password/i,
  /reset\s*password/i,
  /quên\s*mật\s*khẩu/i,
];

const OTP_BYPASS_PATTERNS = [
  /bỏ\s*qua\s*otp/i,
  /không\s*cần\s*otp/i,
  /bypass\s*otp/i,
  /nhập\s*hộ\s*otp/i,
  /gửi\s*otp\s*cho\s*tôi/i,
];

const TAMPERING_PATTERNS = [
  /s[ửu]a\s*gi[áa]/iu,
  /ch[ỉi]nh\s*gi[áa]/iu,
  /gi[ảa]m\s*gi[áa]\s*th[àa]nh\s*0/iu,
  /mi[ễe]n\s*ph[íi]\s*cho\s*t[ôo]i/iu,
  /thay\s*[đd][ổo]i\s*tr[ạa]ng\s*th[áa]i\s*thanh\s*to[áa]n/iu,
  /s[ửu]a\s*[đd]i[ểe]m\s*th[ưởu][ởo]ng/iu,
  /c[ộo]ng\s*cho\s*t[ôo]i\s*\d+\s*[đd]i[ểe]m/iu,
];

export class SafetyGuardrails {
  public static evaluateInput(content: string): GuardrailCheckResult {
    const text = String(content || '').trim();

    for (const pattern of PASSWORD_CHANGE_PATTERNS) {
      if (pattern.test(text)) {
        return {
          blocked: true,
          code: 'SENSITIVE_ACTION_PASSWORD',
          reason: 'Yêu cầu thay đổi mật khẩu không được phép xử lý qua hội thoại chat.',
          replyMessage: 'Để bảo vệ an toàn cho tài khoản của bạn, yêu cầu đổi mật khẩu bắt buộc phải thực hiện tại trang Tài khoản > Bảo mật với xác thực OTP đa lớp. Trợ lý AI không có quyền thay đổi mật khẩu trực tiếp.',
        };
      }
    }

    for (const pattern of OTP_BYPASS_PATTERNS) {
      if (pattern.test(text)) {
        return {
          blocked: true,
          code: 'SECURITY_GATE_BYPASS_ATTEMPT',
          reason: 'Cố gắng bỏ qua hoặc can thiệp mã OTP.',
          replyMessage: 'Mã xác thực OTP là lớp bảo mật bắt buộc của hệ thống. Bạn vui lòng không chia sẻ mã OTP trong khung chat và nhập trực tiếp vào biểu mẫu xác thực.',
        };
      }
    }

    for (const pattern of TAMPERING_PATTERNS) {
      if (pattern.test(text)) {
        return {
          blocked: true,
          code: 'TAMPERING_ATTEMPT',
          reason: 'Cố gắng can thiệp giá, điểm thưởng hoặc trạng thái thanh toán.',
          replyMessage: 'Giá bán sản phẩm, điểm thành viên và trạng thái thanh toán được bảo vệ bởi chính sách toàn vẹn dữ liệu máy chủ. Trợ lý AI không có quyền thay đổi các giá trị này.',
        };
      }
    }

    return { blocked: false };
  }
}
