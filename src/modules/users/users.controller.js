//what does this file do? It defines the controller functions for handling user-related HTTP requests. It validates incoming requests, calls the appropriate service functions, and sends back the HTTP responses. The controller functions are exported for use in the main application file.

import {
  createUserService,
  getUserByIdService,
  listUsersService,
} from "./users.service.js";

export async function createUser(req, res) {
  const { firstName, lastName, email, phone, role } = req.validated.body;
  const user = await createUserService({ firstName, lastName, email, phone, role });
  res.status(201).json({ ok: true, data: user });
}

export async function getUserById(req, res) {
  const { id } = req.validated.params;
  const user = await getUserByIdService(id);
  res.json({ ok: true, data: user });
}

export async function listUsers(req, res) {
  const { page, limit } = req.validated.query;
  const result = await listUsersService({ page, limit });
  res.json({ ok: true, ...result });
}
