import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

export function createTransporter() {
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: false, // 587 = STARTTLS
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
}

export async function sendVerificationEmail({ to, code }) {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Verify your email</h2>
      <p>Your verification code is:</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">
        ${code}
      </div>
      <p>This code will expire in ${env.verificationCodeTtlMin} minutes.</p>
    </div>
  `;

  await transporter.sendMail({
    from: env.mailFrom,
    to,
    subject: "Your verification code",
    html,
  });
}
