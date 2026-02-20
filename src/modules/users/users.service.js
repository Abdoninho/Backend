import bcrypt from "bcrypt";
import { AppError } from "../../common/errors/AppError.js";

import {
  countUsers,
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUserById,
  findUserByEmailExcludingId,
  findUserByAcademicIdExcludingId,
} from "./users.repository.js";

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function toUserResponse(u) {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    fullName: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    phone: u.phone ?? null,
    role: u.role,
    academicId: u.academicId ?? null,
    department: u.department ?? null,
    academicYear: u.academicYear ?? null,
    preferredTrack: u.preferredTrack ?? null,
    avatarUrl: u.avatarUrl ?? null,
    googleId: u.googleId ?? null,
    githubId: u.githubId ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export async function createUserService({
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
  const normalizedEmail = normalizeEmail(email);

  const exists = await findUserByEmail(normalizedEmail);
  if (exists) throw new AppError("Email already exists", 409, "EMAIL_EXISTS");

  const passwordHash = await bcrypt.hash(String(password), 10);

  try {
    const user = await createUser({
      firstName,
      lastName,
      email: normalizedEmail,
      phone: phone ?? null,
      role: role ?? "STUDENT",
      academicId,
      department,
      academicYear,
      preferredTrack,
      passwordHash,
      isEmailVerified: true,
    });

    return toUserResponse(user);
  } catch (err) {
    if (err?.code === "P2002") {
      const target = err?.meta?.target;
      if (Array.isArray(target) && target.includes("academicId")) {
        throw new AppError("Academic ID already exists", 409, "ACADEMIC_ID_EXISTS");
      }
      if (Array.isArray(target) && target.includes("email")) {
        throw new AppError("Email already exists", 409, "EMAIL_EXISTS");
      }
    }
    throw err;
  }
}

export async function getUserByIdService(id) {
  const user = await findUserById(id);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return toUserResponse(user);
}

export async function listUsersService({ page, limit, search, role }) {
  const skip = (page - 1) * limit;

  const where = {};

  if (role) where.role = role;

  if (search) {
    const s = String(search).trim();
    where.OR = [
      { firstName: { contains: s, mode: "insensitive" } },
      { lastName: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
      { academicId: { contains: s, mode: "insensitive" } },
      { phone: { contains: s, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    countUsers(where),
    listUsers({ skip, take: limit, where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    items: items.map(toUserResponse),
  };
}

export async function updateMeService(userId, payload) {
  const existing = await findUserById(userId);
  if (!existing) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const updateData = {};

  if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
  if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
  if (payload.phone !== undefined) updateData.phone = payload.phone;
  if (payload.department !== undefined) updateData.department = payload.department;
  if (payload.preferredTrack !== undefined) updateData.preferredTrack = payload.preferredTrack;
  if (payload.academicYear !== undefined) updateData.academicYear = payload.academicYear;
  if (payload.avatarUrl !== undefined) updateData.avatarUrl = payload.avatarUrl;

  const updated = await updateUserById(userId, updateData);
  return toUserResponse(updated);
}

// ✅ Admin edit user
export async function updateUserService(userId, payload) {
  const existing = await findUserById(userId);
  if (!existing) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const updateData = {};

  // email unique check
  if (payload.email !== undefined) {
    const normalizedEmail = normalizeEmail(payload.email);
    const emailTaken = await findUserByEmailExcludingId(normalizedEmail, userId);
    if (emailTaken) throw new AppError("Email already exists", 409, "EMAIL_EXISTS");
    updateData.email = normalizedEmail;
  }

  // academicId unique check
  if (payload.academicId !== undefined) {
    const academicTaken = await findUserByAcademicIdExcludingId(payload.academicId, userId);
    if (academicTaken) throw new AppError("Academic ID already exists", 409, "ACADEMIC_ID_EXISTS");
    updateData.academicId = payload.academicId;
  }

  if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
  if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
  if (payload.phone !== undefined) updateData.phone = payload.phone;

  if (payload.department !== undefined) updateData.department = payload.department;
  if (payload.academicYear !== undefined) updateData.academicYear = payload.academicYear;
  if (payload.preferredTrack !== undefined) updateData.preferredTrack = payload.preferredTrack;

  if (payload.role !== undefined) updateData.role = payload.role;

  // password change
  if (payload.password !== undefined) {
    updateData.passwordHash = await bcrypt.hash(String(payload.password), 10);
  }

  try {
    const updated = await updateUserById(userId, updateData);
    return toUserResponse(updated);
  } catch (err) {
    if (err?.code === "P2002") {
      const target = err?.meta?.target;
      if (Array.isArray(target) && target.includes("academicId")) {
        throw new AppError("Academic ID already exists", 409, "ACADEMIC_ID_EXISTS");
      }
      if (Array.isArray(target) && target.includes("email")) {
        throw new AppError("Email already exists", 409, "EMAIL_EXISTS");
      }
    }
    throw err;
  }
}