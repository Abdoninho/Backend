import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../common/errors/AppError.js";
import { prisma } from "../loaders/dbLoader.js";

export async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (!payload || typeof payload !== "object" || !payload.id) {
      return next(new AppError("Invalid token", 401, "INVALID_TOKEN"));
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, isEmailVerified: true },
    });

    if (!user) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    if (!user.isEmailVerified) {
      return next(new AppError("Email not verified", 403, "EMAIL_NOT_VERIFIED"));
    }

    req.user = { id: user.id, role: user.role };
    return next();
  } catch (e) {
    return next(new AppError("Invalid token", 401, "INVALID_TOKEN"));
  }
}
