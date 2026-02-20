import {
  createUserService,
  getUserByIdService,
  listUsersService,
  updateMeService,
  updateUserService,
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

// ✅ Admin edit user
export async function updateUser(req, res) {
  const { id } = req.validated.params;
  const updated = await updateUserService(id, req.validated.body);
  res.json({ ok: true, data: updated });
}