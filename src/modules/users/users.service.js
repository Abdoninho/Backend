import bcrypt from "bcrypt";
import { AppError } from "../../common/errors/AppError.js";

import {
  countUsers,
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUserById,
  deleteUserById,
  listAllUsers,
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

function buildWhere({ search, role }) {
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
  return where;
}

function escapeCsvCell(v) {
  const s = String(v ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function usersToCsv(items) {
  const headers = [
    "id",
    "firstName",
    "lastName",
    "email",
    "phone",
    "role",
    "academicId",
    "department",
    "academicYear",
    "preferredTrack",
    "isEmailVerified",
    "createdAt",
    "updatedAt",
  ];

  const lines = [];
  lines.push(headers.join(","));

  for (const u of items) {
    const row = [
      u.id,
      u.firstName,
      u.lastName,
      u.email,
      u.phone ?? "",
      u.role,
      u.academicId ?? "",
      u.department ?? "",
      u.academicYear ?? "",
      u.preferredTrack ?? "",
      u.isEmailVerified ? "true" : "false",
      u.createdAt?.toISOString?.() ?? "",
      u.updatedAt?.toISOString?.() ?? "",
    ].map(escapeCsvCell);

    lines.push(row.join(","));
  }

  return lines.join("\n");
}

function parseCsv(text) {
  // CSV بسيط (يدعم quotes)
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cur);
        cur = "";
      } else if (ch === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (ch === "\r") {
        // ignore
      } else {
        cur += ch;
      }
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }

  return rows;
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
  const where = buildWhere({ search, role });

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

export async function updateUserService(userId, payload) {
  const existing = await findUserById(userId);
  if (!existing) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const updateData = {};

  if (payload.email !== undefined) {
    const normalizedEmail = normalizeEmail(payload.email);
    const emailTaken = await findUserByEmailExcludingId(normalizedEmail, userId);
    if (emailTaken) throw new AppError("Email already exists", 409, "EMAIL_EXISTS");
    updateData.email = normalizedEmail;
  }

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

// ✅ Delete
export async function deleteUserService(id) {
  const existing = await findUserById(id);
  if (!existing) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  // (اختياري) متخليش الأدمن يمسح نفسه:
  // if (String(id) === String(req.user?.id)) ...

  const deleted = await deleteUserById(id);

  return {
    deleted: true,
    id: deleted.id,
  };
}

// ✅ Export
export async function exportUsersService({ search, role, format }) {
  const where = buildWhere({ search, role });

  const items = await listAllUsers({ where });

  if (format === "json") {
    return { format: "json", items: items.map(toUserResponse) };
  }

  const csv = usersToCsv(items);
  return { format: "csv", csv };
}

// ✅ Import
export async function importUsersService({ mode, file, body }) {
  const strict = mode === "strict";

  let items = [];

  // 1) CSV File upload: field name = file
  if (file?.buffer) {
    const text = file.buffer.toString("utf-8");
    const rows = parseCsv(text);

    if (!rows.length) {
      throw new AppError("Empty CSV file", 400, "BAD_FILE");
    }

    const headers = rows[0].map((h) => String(h ?? "").trim());

    // expected columns (min):
    // firstName,lastName,email,academicId,department,academicYear,preferredTrack,password
    // optional: phone,role
    const dataRows = rows.slice(1);

    items = dataRows
      .filter((r) => r.some((x) => String(x ?? "").trim() !== ""))
      .map((r) => {
        const obj = {};
        for (let i = 0; i < headers.length; i++) {
          obj[headers[i]] = r[i];
        }
        return obj;
      });
  } else {
    // 2) JSON body: { items: [...] } or direct array
    if (Array.isArray(body)) items = body;
    else if (Array.isArray(body?.items)) items = body.items;
    else {
      throw new AppError("Provide CSV file or JSON items array", 400, "BAD_REQUEST");
    }
  }

  if (!items.length) {
    throw new AppError("No users to import", 400, "BAD_REQUEST");
  }

  const created = [];
  const skipped = [];
  const errors = [];

  for (let index = 0; index < items.length; index++) {
    const raw = items[index] ?? {};

    const firstName = String(raw.firstName ?? "").trim();
    const lastName = String(raw.lastName ?? "").trim();
    const email = normalizeEmail(raw.email);
    const phone = raw.phone !== undefined && raw.phone !== null ? String(raw.phone).trim() : undefined;

    const academicId = String(raw.academicId ?? "").trim();
    const department = raw.department !== undefined && raw.department !== null ? String(raw.department).trim() : null;
    const academicYear =
      raw.academicYear !== undefined && raw.academicYear !== null ? String(raw.academicYear).trim() : null;
    const preferredTrack =
      raw.preferredTrack !== undefined && raw.preferredTrack !== null ? String(raw.preferredTrack).trim() : null;

    const role = raw.role !== undefined && raw.role !== null ? String(raw.role).trim() : undefined;

    const password = String(raw.password ?? "").trim();

    // basic checks (خفيف)
    if (!firstName || !lastName || !email || !academicId || !password) {
      const e = { index, code: "VALIDATION_ERROR", message: "Missing required fields" };
      errors.push(e);
      if (strict) throw new AppError(`Import failed at row ${index + 1}: ${e.message}`, 400, "IMPORT_FAILED");
      continue;
    }

    try {
      const user = await createUserService({
        firstName,
        lastName,
        email,
        phone,
        role,
        academicId,
        department: department ?? undefined,
        academicYear: academicYear ?? undefined,
        preferredTrack: preferredTrack ?? undefined,
        password,
      });

      created.push({ index, id: user.id, email: user.email });
    } catch (err) {
      // duplicates
      if (err?.code === "EMAIL_EXISTS" || err?.code === "ACADEMIC_ID_EXISTS") {
        skipped.push({ index, code: err.code, message: err.message, email, academicId });
        if (strict) throw err;
        continue;
      }

      errors.push({
        index,
        code: err?.code || "IMPORT_ERROR",
        message: err?.message || "Import error",
      });

      if (strict) throw err;
    }
  }

  return {
    total: items.length,
    createdCount: created.length,
    skippedCount: skipped.length,
    errorCount: errors.length,
    created,
    skipped,
    errors,
  };
}