import {
  createUserService,
  getUserByIdService,
  listUsersService,
  updateMeService,
  updateUserService,
  deleteUserService,
  exportUsersService,
  importUsersService,
} from "./users.service.js";

export async function createUser(req, res) {
  const {
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
  } = req.validated.body;

  const user = await createUserService({
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
  });

  res.status(201).json({ ok: true, data: user });
}

export async function getUserById(req, res) {
  const { id } = req.validated.params;
  const user = await getUserByIdService(id);
  res.json({ ok: true, data: user });
}

export async function listUsers(req, res) {
  const { page, limit, search, role } = req.validated.query;
  const result = await listUsersService({ page, limit, search, role });
  res.json({ ok: true, data: result });
}

export async function updateMe(req, res) {
  const updated = await updateMeService(req.user.id, req.validated.body);
  res.json({ ok: true, data: updated });
}

export async function updateUser(req, res) {
  const { id } = req.validated.params;
  const updated = await updateUserService(id, req.validated.body);
  res.json({ ok: true, data: updated });
}

// ✅ Delete
export async function deleteUser(req, res) {
  const { id } = req.validated.params;
  const result = await deleteUserService(id);
  res.json({ ok: true, data: result });
}

// ✅ Export
export async function exportUsers(req, res) {
  const { search, role, format } = req.validated.query;

  const result = await exportUsersService({
    search,
    role,
    format: format ?? "csv",
  });

  if (result.format === "json") {
    return res.json({ ok: true, data: result.items });
  }

  // CSV download
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="users.csv"');
  return res.status(200).send(result.csv);
}

// ✅ Import
export async function importUsers(req, res) {
  const mode = req.validated.query?.mode ?? "skip";

  // multipart csv file
  const file = req.file;

  // json body
  const body = req.body;

  const result = await importUsersService({
    mode,
    file, // may be undefined
    body, // may be {}
  });

  res.status(200).json({ ok: true, data: result });
}