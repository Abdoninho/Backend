import { z } from "zod";
import { ROLE_VALUES } from "../../common/constants/roles.js";
import { DEPARTMENT_VALUES } from "../../common/constants/departments.js";
import { TRACK_VALUES } from "../../common/constants/tracks.js";
import { ACADEMIC_YEAR_VALUES } from "../../common/constants/academicYears.js";

const academicIdSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[-\s]/g, ""))
  .refine((v) => /^\d{8}$/.test(v), "academicId must be 8 digits");

export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "firstName must be at least 2 characters"),
    lastName: z.string().min(2, "lastName must be at least 2 characters"),
    email: z.string().email("invalid email"),
    phone: z.string().min(7).max(20).optional(),

    academicId: academicIdSchema,
    department: z.enum(DEPARTMENT_VALUES),
    academicYear: z.enum(ACADEMIC_YEAR_VALUES),
    preferredTrack: z.enum(TRACK_VALUES),

    role: z.enum(ROLE_VALUES).optional(),
    password: z.string().min(6, "password must be at least 6 characters"),
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

    search: z.string().trim().min(1).optional(),
    role: z.enum(ROLE_VALUES).optional(),
  }),
});

export const updateMeSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(2).max(50).optional(),
      lastName: z.string().min(2).max(50).optional(),
      phone: z.string().min(7).max(20).nullable().optional(),
      department: z.enum(DEPARTMENT_VALUES).nullable().optional(),
      preferredTrack: z.enum(TRACK_VALUES).nullable().optional(),
      academicYear: z.enum(ACADEMIC_YEAR_VALUES).nullable().optional(),
      avatarUrl: z.string().url().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Provide at least one field to update",
    }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
  body: z
    .object({
      firstName: z.string().min(2).max(50).optional(),
      lastName: z.string().min(2).max(50).optional(),
      email: z.string().email("invalid email").optional(),
      phone: z.string().min(7).max(20).nullable().optional(),

      academicId: academicIdSchema.optional(),
      department: z.enum(DEPARTMENT_VALUES).nullable().optional(),
      academicYear: z.enum(ACADEMIC_YEAR_VALUES).nullable().optional(),
      preferredTrack: z.enum(TRACK_VALUES).nullable().optional(),

      role: z.enum(ROLE_VALUES).optional(),
      password: z.string().min(6).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Provide at least one field to update",
    }),
  query: z.any().optional(),
});

// ✅ Delete
export const deleteUserSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

// ✅ Export
export const exportUsersSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    // نفس search/role بتاعة list
    search: z.string().trim().min(1).optional(),
    role: z.enum(ROLE_VALUES).optional(),

    // format: csv/json
    format: z.enum(["csv", "json"]).optional(),
  }),
});

// ✅ Import
// - بيدعم: multipart file field name = "file" (csv)
// - أو JSON body { items: [...] }
export const importUsersSchema = z.object({
  params: z.any().optional(),
  query: z.object({
    // skip = يتجاهل الدوبليكيت، strict = يوقف لو فيه errors
    mode: z.enum(["skip", "strict"]).optional(),
  }),
  body: z.any().optional(),
});