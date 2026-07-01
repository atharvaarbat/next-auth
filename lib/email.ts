import { resend } from "@/lib/resend"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL!

function otpEmailHtml(heading: string, body: string, otp: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="font-size: 20px; margin-bottom: 8px;">${heading}</h1>
      <p style="color: #555; font-size: 14px; line-height: 1.5;">${body}</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 24px 0;">${otp}</div>
      <p style="color: #999; font-size: 12px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `
}

export async function sendVerificationEmail(email: string, otp: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your email address",
    html: otpEmailHtml(
      "Verify your email",
      "Enter this code to verify your email and finish creating your account.",
      otp
    ),
  })
}

export async function sendPasswordResetEmail(email: string, otp: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your password",
    html: otpEmailHtml("Reset your password", "Enter this code to reset your password.", otp),
  })
}
