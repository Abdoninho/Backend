import { z } from "zod";
import { ROLE_VALUES } from "../../common/constants/roles.js";
import { DEPARTMENT_VALUES } from "../../common/constants/departments.js";
import { ACADEMIC_YEAR_VALUES } from "../../common/constants/academicYears.js";
import { TRACK_VALUES } from "../../common/constants/tracks.js";

const academicIdSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[-\s]/g, "")) // يشيل '-' والمسافات
  .refine((v) => /^\d{8}$/.test(v), "academicId must be 8 digits");

export const registerSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(7).max(20).optional(),
      academicId: academicIdSchema,
      department: z.enum(DEPARTMENT_VALUES),
      academicYear: z.enum(ACADEMIC_YEAR_VALUES),
      preferredTrack: z.enum(TRACK_VALUES),

      password: z.string().min(6, "password must be at least 6 characters"),
      confirmPassword: z.string().min(6),

      acceptTerms: z.literal(true),

      // اختياري (لو عايزين): مش موجود في UI غالبًا
      role: z.enum(ROLE_VALUES).optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    rememberMe: z.boolean().optional(),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const sendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().regex(/^\d{6}$/, "code must be 6 digits"),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});
