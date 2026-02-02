import { prisma } from "../../loaders/dbLoader.js";

export async function findUserByEmailForAuth(email) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      passwordHash: true,
      nationalId: true,
      department: true,
      academicYear: true,
      preferredTrack: true,
      createdAt: true,
      updatedAt: true,
      isEmailVerified: true,
      emailVerificationCode: true,
      emailVerificationExpiresAt: true,
    },
  });
}

export async function findUserByNationalIdForAuth(nationalId) {
  return prisma.user.findUnique({
    where: { nationalId },
    select: { id: true },
  });
}

export async function createUserForAuth(data) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      nationalId: true,
      department: true,
      academicYear: true,
      preferredTrack: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function findUserByIdSafe(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      nationalId: true,
      department: true,
      academicYear: true,
      preferredTrack: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}


export async function setEmailVerificationCode({ userId, code, expiresAt }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationCode: code,
      emailVerificationExpiresAt: expiresAt,
    },
  });
}

export async function markEmailVerified(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpiresAt: null,
    },
  });
}

