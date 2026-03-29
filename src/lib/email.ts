import nodemailer from 'nodemailer';

/**
 * Zoho Mail üzerinden şifre sıfırlama e-postalarını gönderen servis.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.zoho.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // 465 SSL için true
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"FSM Tiyatro" <info@fsmtiyatro.com>',
    to,
    subject: '🎭 Sahne Seni Bekliyor: Şifrenizi Sıfırlayın',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #050505; color: #f0f0f5; padding: 40px; border-radius: 15px; max-width: 600px; margin: auto; border: 1px solid #D4AF37;">
        <h2 style="color: #D4AF37; text-align: center; font-size: 28px; margin-bottom: 20px;">Şifre Sıfırlama Talebi</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
          Selam! FSM Tiyatro portalına tekrar erişebilmen için bir şifre sıfırlama talebi aldık. 
          Aşağıdaki butona tıklayarak yeni şifreni belirleyebilirsin.
        </p>
        <div style="text-align: center; margin-bottom: 40px;">
          <a href="${resetLink}" style="background-color: #D4AF37; color: #050505; padding: 15px 35px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 0 20px rgba(212, 175, 55, 0.4);">
            Şifremi Sıfırla
          </a>
        </div>
        <p style="font-size: 12px; color: #808090; text-align: center; margin-bottom: 20px;">
          Eğer bu işlemi sen yapmadıysan bu e-postayı dikkate alma. Link 1 saat boyunca geçerlidir.
        </p>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px;">
        <p style="font-size: 11px; text-align: center; color: #D4AF37;">
          © 2026 FSM Tiyatro | Sanatı Birlikte Yaşayalım
        </p>
      </div>
    `,
  };

  // Environment variable yoksa konsola yazdır (Debug/Mock Mode)
  if (!process.env.SMTP_PASS) {
    console.log("--- [DEBUG: EMAIL MOCKED] ---");
    console.log("To:", to);
    console.log("Reset Link:", resetLink);
    console.log("-----------------------------");
    return { success: true, mocked: true };
  }

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error("[SMTP ERROR] E-posta gönderilemedi:", error);
    throw new Error("E-posta servisinde bir hata oluştu: " + error.message);
  }
}
