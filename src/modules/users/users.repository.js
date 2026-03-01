import { prisma } from "../../loaders/dbLoader.js";

export async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(data) {
  return prisma.user.create({ data });
}

export async function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

export async function listUsers({ skip, take, where }) {
  return prisma.user.findMany({
    skip,
    take,
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function countUsers(where) {
  return prisma.user.count({ where });
}

export function updateUserById(id, data) {
  return prisma.user.update({ where: { id }, data });
}

// ✅ Delete
export function deleteUserById(id) {
  return prisma.user.delete({ where: { id }, select: { id: true } });
}

// ✅ For export (no pagination)
export function listAllUsers({ where }) {
  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

// ✅ helpers for uniqueness on edit
export async function findUserByEmailExcludingId(email, id) {
  return prisma.user.findFirst({
    where: {
      email,
      NOT: { id },
    },
    select: { id: true },
  });
}

export async function findUserByAcademicIdExcludingId(academicId, id) {
  return prisma.user.findFirst({
    where: {
      academicId,
      NOT: { id },
    },
    select: { id: true },
  });
}