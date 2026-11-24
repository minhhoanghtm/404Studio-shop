import nodemailer from "nodemailer";

const cleanPass = (pass) => pass?.replace(/\s/g, "");

export const sendOTP = async (email, otp) => {
  try {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS ? cleanPass(process.env.EMAIL_PASS) : null;

    if (!user || !pass) {
      console.log(`[DEV MODE] OTP for ${email}: ${otp} (SMTP details not configured)`);
      return { messageId: "dev-mock-id" };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: user,
      to: email,
      subject: "Mã OTP Xác Thực - Web Fashion",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4CAF50; text-align: center;">Mã Xác Thực OTP</h2>
          <p>Xin chào,</p>
          <p>Mã OTP của bạn để hoàn tất đăng ký/reset mật khẩu tại Web Fashion là:</p>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0; border-radius: 4px; border: 1px dashed #ccc;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 12px;">Lưu ý: Mã OTP này có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này với người khác.</p>
        </div>
      `,
    });

    console.log("✅ EMAIL SENT:", info.messageId);
    return info;
  } catch (err) {
    console.error("🔥 SMTP ERROR:", err);
    throw err;
  }
};

export const sendResetPasswordEmail = async (email, resetUrl) => {
  try {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS ? cleanPass(process.env.EMAIL_PASS) : null;

    if (!user || !pass) {
      console.log(`[DEV MODE] Reset Password Link for ${email}: ${resetUrl} (SMTP details not configured)`);
      return { messageId: "dev-mock-reset-id" };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `"Atelier Vérité" <${user}>`,
      to: email,
      subject: "Yêu cầu đặt lại mật khẩu - Atelier Vérité",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px 24px; border: 1px solid #e5e5e5; border-radius: 12px; background-color: #fafafa; color: #1c1c1c;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #b48c36; font-weight: 600;">Atelier Vérité — Haute Couture</span>
            <h2 style="font-family: Georgia, serif; font-size: 26px; font-weight: normal; margin: 12px 0 6px 0; color: #111;">Khôi Phục Mật Khẩu</h2>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #444;">Xin chào quý khách,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #444;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Patron liên kết với email <strong>${email}</strong>.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #444;">Để tiếp tục quá trình tạo mật khẩu mới, quý khách vui lòng nhấn vào nút bên dưới:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #111; color: #fff; padding: 14px 32px; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Đặt Lại Mật Khẩu
            </a>
          </div>
          <p style="font-size: 13px; line-height: 1.6; color: #666;">Nếu nút trên không hoạt động, quý khách có thể sao chép liên kết sau và dán vào thanh địa chỉ của trình duyệt:</p>
          <p style="word-break: break-all; font-size: 12px; color: #b48c36; background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #eee;">
            <a href="${resetUrl}" style="color: #b48c36; text-decoration: none;">${resetUrl}</a>
          </p>
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; line-height: 1.5;">
            <p><strong>Lưu ý bảo mật:</strong> Liên kết này chỉ có hiệu lực trong vòng <strong>15 phút</strong> kể từ thời điểm gửi. Nếu quý khách không yêu cầu đặt lại mật khẩu, xin vui lòng bỏ qua thư này — tài khoản của quý khách vẫn hoàn toàn được bảo vệ.</p>
            <p style="margin-top: 8px;">Trân trọng,<br>Đội ngũ Atelier Vérité</p>
          </div>
        </div>
      `,
    });

    console.log("✅ RESET EMAIL SENT:", info.messageId);
    return info;
  } catch (err) {
    console.error("🔥 SMTP ERROR (Reset Password):", err);
    throw err;
  }
};
