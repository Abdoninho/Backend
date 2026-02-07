//what does this file do? It contains the business logic for user-related operations such as creating a user, retrieving a user by ID, and listing users with pagination. It interacts with the users repository to perform database operations and formats the responses. It also handles errors and throws custom AppError exceptions when necessary.

import { AppError } from "../../common/errors/AppError.js";
import {
  countUsers,
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
} from "./users.repository.js";

function toUserResponse(u) {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    fullName: `${u.firstName} ${u.lastName}`,
    email: u.email,
    phone: u.phone ?? null,
    role: u.role,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export async function createUserService({ firstName, lastName, email, phone, role }) {
  const exists = await findUserByEmail(email);
  if (exists) throw new AppError("Email already exists", 409, "EMAIL_EXISTS");

  const user = await createUser({
    firstName,
    lastName,
    email,
    ...(phone ? { phone } : {}),
    ...(role ? { role } : {}),
  });

  return toUserResponse(user);
}

export async function getUserByIdService(id) {
  const user = await findUserById(id);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return toUserResponse(user);
}

export async function listUsersService({ page, limit }) {
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    countUsers(),
    listUsers({ skip, take: limit }),
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
