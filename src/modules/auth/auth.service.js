import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/AppError.js";
import {
  createUserForAuth,
  findUserByEmailForAuth,
  findUserByIdSafe,
  findUserByNationalIdForAuth,
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
    nationalId: u.nationalId,
    department: u.department,
    academicYear: u.academicYear,
    preferredTrack: u.preferredTrack,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

function signToken({ id, role }, rememberMe = false) {
  const expiresIn = rememberMe ? env.jwtRememberExpiresIn : env.jwtExpiresIn;
  return jwt.sign({ id, role }, env.jwtSecret, { expiresIn });
}

export async function registerService({
  firstName,
  lastName,
  email,
  phone,
  role,
  nationalId,
  department,
  academicYear,
  preferredTrack,
  password,
}) {
  const existsEmail = await findUserByEmailForAuth(email);
  if (existsEmail) throw new AppError("Email already exists", 409, "EMAIL_EXISTS");

  const existsNid = await findUserByNationalIdForAuth(nationalId);
  if (existsNid) throw new AppError("National ID already exists", 409, "NATIONAL_ID_EXISTS");

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await createUserForAuth({
    firstName,
    lastName,
    email,
    ...(phone ? { phone } : {}),
    ...(role ? { role } : {}),
    nationalId,
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
  console.error("📧 SEND MAIL FAILED:", err.message);
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
