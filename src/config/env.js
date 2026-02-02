//what does this file do? It loads environment variables from a .env file and exports them for use in the application. The .env file should contain variables such as NODE_ENV, PORT, CORS_ORIGIN, and DATABASE_URL.
import "dotenv/config";




export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  jwtRememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN ?? "30d",
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  mailFrom: process.env.MAIL_FROM ?? process.env.SMTP_USER,
  verificationCodeTtlMin: Number(process.env.VERIFICATION_CODE_TTL_MIN ?? 10),

};

if (!env.databaseUrl) {
  throw new Error("Missing DATABASE_URL in .env");
}

if (!env.jwtSecret) {
  throw new Error("Missing JWT_SECRET in .env");
}


if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
  throw new Error("Missing SMTP config in .env (SMTP_HOST/SMTP_USER/SMTP_PASS)");
}
