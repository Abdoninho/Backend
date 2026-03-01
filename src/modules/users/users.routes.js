import { Router } from "express";
import multer from "multer";

import { validate } from "../../middlewares/validate.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";

import {
  createUserSchema,
  getUserByIdSchema,
  listUsersSchema,
  updateMeSchema,
  updateUserSchema,
  deleteUserSchema,
  exportUsersSchema,
  importUsersSchema,
} from "./users.schema.js";

import {
  createUser,
  getUserById,
  listUsers,
  updateMe,
  updateUser,
  deleteUser,
  exportUsers,
  importUsers,
} from "./users.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Protect all user endpoints
router.use(auth);

// List + Search
router.get("/", validate(listUsersSchema), listUsers);

// Export (CSV/JSON)  ✅
router.get("/export", validate(exportUsersSchema), exportUsers);

// Import (CSV file or JSON array) ✅
router.post("/import", upload.single("file"), validate(importUsersSchema), importUsers);

// Me update
router.patch("/me", validate(updateMeSchema), updateMe);

// CRUD
router.get("/:id", validate(getUserByIdSchema), getUserById);
router.post("/", validate(createUserSchema), createUser);

// Edit user (Admin page)
router.patch("/:id", validate(updateUserSchema), updateUser);

// Delete user ✅
router.delete("/:id", validate(deleteUserSchema), deleteUser);

export default router;