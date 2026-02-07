import { z } from "zod";
import { ROLE_VALUES } from "../../common/constants/roles.js";

export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "firstName must be at least 2 characters"),
    lastName: z.string().min(2, "lastName must be at least 2 characters"),
    email: z.string().email("invalid email"),
    phone: z.string().min(7).max(20).optional(),
    role: z.enum(ROLE_VALUES).optional(),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const getUserByIdSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const listUsersSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});
