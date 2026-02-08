import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";
import { env } from "../../config/env.js"; 
import { AppError } from "../../common/errors/AppError.js";

import {
  createUserForAuth,
  findUserByEmailForAuth,
  findUserByIdSafe,
  findUserByAcademicIdForAuth,
  upsertUserByEmailForOAuth,
} from "./auth.repository.js";

import { sendVerificationEmail } from "../../common/utils/mailer.js";
import { setEmailVerificationCode, markEmailVerified } from "./auth.repository.js";

function generate6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function toUserResponse(u) {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    fullName: `${u.firstName} ${u.lastName}`,
    email: u.email,
    phone: u.phone ?? null,
    role: u.role,
    academicId: u.academicId,
    department: u.department,
    academicYear: u.academicYear,
    preferredTrack: u.preferredTrack,
    avatarUrl: u.avatarUrl ?? null,
    googleId: u.googleId ?? null,
    githubId: u.githubId ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

function signToken({ id, role }, rememberMe = false) {
  const expiresIn = rememberMe ? env.jwtRememberExpiresIn : env.jwtExpiresIn;
  return jwt.sign({ id, role }, env.jwtSecret, { expiresIn });
}

function assertGoogleEnv() {
  if (!env.googleClientId || !env.googleClientSecret || !env.googleRedirectUri) {
    throw new AppError(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI in .env",
      500,
      "OAUTH_GOOGLE_NOT_CONFIGURED"
    );
  }
}

function assertGithubEnv() {
  if (!env.githubClientId || !env.githubClientSecret || !env.githubRedirectUri) {
    throw new AppError(
      "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET/GITHUB_REDIRECT_URI in .env",
      500,
      "OAUTH_GITHUB_NOT_CONFIGURED"
    );
  }
}

// ---------------- Local register/login ----------------

export async function registerService({
  firstName,
  lastName,
  email,
  phone,
  role,
  academicId,
  department,
  academicYear,
  preferredTrack,
  password,
}) {
  const existsEmail = await findUserByEmailForAuth(email);
  if (existsEmail) throw new AppError("Email already exists", 409, "EMAIL_EXISTS");

  const existsAcademicId = await findUserByAcademicIdForAuth(academicId);
  if (existsAcademicId) throw new AppError("Academic ID already exists", 409, "ACADEMIC_ID_EXISTS");

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await createUserForAuth({
    firstName,
    lastName,
    email,
    ...(phone ? { phone } : {}),
    ...(role ? { role } : {}),
    academicId,
    department,
    academicYear,
    preferredTrack,
    passwordHash,
  });

  const code = generate6DigitCode();
  const expiresAt = new Date(Date.now() + env.verificationCodeTtlMin * 60 * 1000);

  await setEmailVerificationCode({ userId: user.id, code, expiresAt });

  let emailSent = true;
  try {
    await sendVerificationEmail({ to: user.email, code });
  } catch (err) {
    emailSent = false;
    console.error("📧 SEND MAIL FAILED:", err?.message || err);
  }

  const token = signToken({ id: user.id, role: user.role }, true);
  return { token, user: toUserResponse(user), emailSent };
}

export async function loginService({ email, password, rememberMe }) {
  const user = await findUserByEmailForAuth(email);
  if (!user) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  if (!user.passwordHash) {
    throw new AppError("Account has no password set", 400, "NO_PASSWORD");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  const token = signToken({ id: user.id, role: user.role }, Boolean(rememberMe));
  return { token, user: toUserResponse(user) };
}

export async function meService(userId) {
  const user = await findUserByIdSafe(userId);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return toUserResponse(user);
}

// ---------------- Email verification ----------------

export async function sendVerificationService({ email }) {
  const user = await findUserByEmailForAuth(email);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  if (user.isEmailVerified) {
    return { sent: false, message: "Email already verified" };
  }

  const code = generate6DigitCode();
  const expiresAt = new Date(Date.now() + env.verificationCodeTtlMin * 60 * 1000);

  await setEmailVerificationCode({ userId: user.id, code, expiresAt });
  await sendVerificationEmail({ to: user.email, code });

  return { sent: true };
}

export async function verifyEmailService({ email, code }) {
  const user = await findUserByEmailForAuth(email);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  if (user.isEmailVerified) {
    return { verified: true };
  }

  if (!user.emailVerificationCode || !user.emailVerificationExpiresAt) {
    throw new AppError("No verification code requested", 400, "NO_CODE");
  }

  if (user.emailVerificationCode !== code) {
    throw new AppError("Invalid code", 400, "INVALID_CODE");
  }

  if (new Date() > new Date(user.emailVerificationExpiresAt)) {
    throw new AppError("Code expired", 400, "CODE_EXPIRED");
  }

  await markEmailVerified(user.id);
  return { verified: true };
}

// ---------------- OAuth helpers ----------------

export function getGoogleAuthUrl() {
  assertGoogleEnv();

  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function getGithubAuthUrl() {
  assertGithubEnv();

  const params = new URLSearchParams({
    client_id: env.githubClientId,
    redirect_uri: env.githubRedirectUri,
    scope: "read:user user:email",
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function googleCallbackService(code) {
  assertGoogleEnv();
  if (!code) throw new AppError("Missing code", 400, "MISSING_CODE");

  // Exchange code -> token
  const tokenRes = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: env.googleRedirectUri,
      grant_type: "authorization_code",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const accessToken = tokenRes.data?.access_token;
  if (!accessToken) throw new AppError("No access token from Google", 400, "GOOGLE_NO_TOKEN");

  // Get profile (OIDC userinfo is more standard)
  const meRes = await axios.get("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const profile = meRes.data ?? {};
  const email = profile.email;
  const googleId = profile.sub; // OIDC subject
  const firstName = profile.given_name || "Google";
  const lastName = profile.family_name || "User";
  const avatarUrl = profile.picture || null;

  if (!email || !googleId) {
    throw new AppError("Google profile missing email/id", 400, "GOOGLE_BAD_PROFILE");
  }

  const user = await upsertUserByEmailForOAuth({
    email,
    provider: "google",
    providerId: String(googleId),
    firstName,
    lastName,
    avatarUrl,
  });

  const token = signToken({ id: user.id, role: user.role }, true);
  return { token, user: toUserResponse(user) };
}

export async function githubCallbackService(code) {
  assertGithubEnv();
  if (!code) throw new AppError("Missing code", 400, "MISSING_CODE");

  // Exchange code -> token
  const tokenRes = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: env.githubClientId,
      client_secret: env.githubClientSecret,
      code,
      redirect_uri: env.githubRedirectUri,
    },
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "graduation-backend",
      },
    }
  );

  const accessToken = tokenRes.data?.access_token;
  if (!accessToken) throw new AppError("No access token from GitHub", 400, "GITHUB_NO_TOKEN");

  // Get profile
  const userRes = await axios.get("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "graduation-backend",
    },
  });

  const gh = userRes.data ?? {};
  const githubId = gh.id ? String(gh.id) : null;
  const avatarUrl = gh.avatar_url || null;

  // Get email (may be hidden)
  let email = gh.email;
  if (!email) {
    const emailsRes = await axios.get("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "graduation-backend",
      },
    });

    const emails = Array.isArray(emailsRes.data) ? emailsRes.data : [];
    const primary =
      emails.find((e) => e.primary && e.verified) ||
      emails.find((e) => e.verified) ||
      emails[0];

    email = primary?.email;
  }

  if (!email || !githubId) {
    throw new AppError("GitHub profile missing email/id", 400, "GITHUB_BAD_PROFILE");
  }

  const fullName = String(gh.name || gh.login || "GitHub User").trim();
  const parts = fullName.split(/\s+/);
  const firstName = parts[0] || "GitHub";
  const lastName = parts.slice(1).join(" ") || "User";

  const user = await upsertUserByEmailForOAuth({
    email,
    provider: "github",
    providerId: githubId,
    firstName,
    lastName,
    avatarUrl,
  });

  const token = signToken({ id: user.id, role: user.role }, true);
  return { token, user: toUserResponse(user) };
}
