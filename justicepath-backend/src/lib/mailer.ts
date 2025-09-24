// src/lib/mailer.ts
import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT || 465);
const secure = port === 465; // 465 => SSL; 587 => STARTTLS

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,                // smtp.gmail.com
  port,
  secure,
  auth: {
    user: process.env.SMTP_USER!,              // justicepath.dev.mail@gmail.com
    pass: process.env.SMTP_PASS!,              // 16-char Gmail App Password (no spaces)
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
  tls: { minVersion: "TLSv1.2" },
  // logger: true, // uncomment if you want Nodemailer to print SMTP dialogue
});

// ⚠️ Do NOT verify on import; this causes the startup login error.
// If you ever want a manual check, call this from a script or a dev-only route:
/*
export async function verifyMailer() {
  try {
    await transporter.verify();
    console.log("[mailer] SMTP ready");
  } catch (err: any) {
    console.error("[mailer] verify failed:", err?.message || err);
  }
}
*/

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  // Allow turning email off in dev without breaking auth/uploads
  if (process.env.SEND_VERIFY_EMAIL !== "true") {
    console.log(`[mailer] SEND_VERIFY_EMAIL!=true, skipping send to ${to}`);
    return;
  }

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>Confirm your JusticePath account</h2>
      <p>Click the button below to verify your email and activate your account.</p>
      <p><a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Verify Email</a></p>
      <p>If the button doesn't work, copy and paste this link:</p>
      <code style="word-break:break-all">${verifyUrl}</code>
      <p>This link expires in 24 hours.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      // With Gmail, use the sending account or a verified alias
      from:
        process.env.MAIL_FROM?.trim() ||
        `JusticePath <${process.env.SMTP_USER}>`,
      to,
      subject: "Verify your JusticePath email",
      html,
    });
  } catch (err: any) {
    // Don’t break signup if email fails — just log it
    console.error("[mailer] send failed:", err?.response || err?.message || err);
  }
}
