//what does this file do? It contains functions to interact with the users table in the database using Prisma ORM.
import { prisma } from "../../loaders/dbLoader.js";

// يدور على يوزر بالإيميل (عشان نمنع تكرار الإيميل)
export async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

// إنشاء يوزر جديد
export async function createUser(data) {
  return prisma.user.create({ data });
}

// يجيب يوزر بالـ id
export async function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

// List users مع pagination
export async function listUsers({ skip, take }) {
  return prisma.user.findMany({
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });
}

// عدد اليوزرز (للـ pagination meta)
export async function countUsers() {
  return prisma.user.count();
}
