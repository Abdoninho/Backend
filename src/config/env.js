import "dotenv/config";

const str = (v) => (typeof v === "string" ? v.trim() : v);

export const env = {
  nodeEnv: str(process.env.NODE_ENV) ?? "development",
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: str(process.env.CORS_ORIGIN) ?? "http://localhost:3000",
  databaseUrl: str(process.env.DATABASE_URL),

  jwtSecret: str(process.env.JWT_SECRET),
  jwtExpiresIn: str(process.env.JWT_EXPIRES_IN) ?? "1d",
  jwtRememberExpiresIn: str(process.env.JWT_REMEMBER_EXPIRES_IN) ?? "30d",

  smtpHost: str(process.env.SMTP_HOST),
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: str(process.env.SMTP_USER),
  smtpPass: str(process.env.SMTP_PASS),
  mailFrom: str(process.env.MAIL_FROM) ?? str(process.env.SMTP_USER),
  verificationCodeTtlMin: Number(process.env.VERIFICATION_CODE_TTL_MIN ?? 10),

  apiUrl: str(process.env.API_URL),

  // ✅ OAuth keys
  googleClientId: str(process.env.GOOGLE_CLIENT_ID),
  googleClientSecret: str(process.env.GOOGLE_CLIENT_SECRET),
  googleRedirectUri: str(process.env.GOOGLE_REDIRECT_URI),

  githubClientId: str(process.env.GITHUB_CLIENT_ID),
  githubClientSecret: str(process.env.GITHUB_CLIENT_SECRET),
  githubRedirectUri: str(process.env.GITHUB_REDIRECT_URI),
};

if (!env.databaseUrl) throw new Error("Missing DATABASE_URL in .env");
if (!env.jwtSecret) throw new Error("Missing JWT_SECRET in .env");
