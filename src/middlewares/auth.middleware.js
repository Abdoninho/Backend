import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../common/errors/AppError.js";

export function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (!payload || typeof payload !== "object") {
      return next(new AppError("Invalid token", 401, "INVALID_TOKEN"));
    }

    // احنا بنوقع التوكن بـ { id, role }
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch (e) {
    return next(new AppError("Invalid token", 401, "INVALID_TOKEN"));
  }
}
