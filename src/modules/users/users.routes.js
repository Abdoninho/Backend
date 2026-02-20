import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";

import {
  createUserSchema,
  getUserByIdSchema,
  listUsersSchema,
  updateMeSchema,
  updateUserSchema,
} from "./users.schema.js";

import {
  createUser,
  getUserById,
  listUsers,
  updateMe,
  updateUser,
} from "./users.controller.js";

const router = Router();

// ✅ Protect all user endpoints
router.use(auth);

router.get("/", validate(listUsersSchema), listUsers);
router.patch("/me", validate(updateMeSchema), updateMe);

router.get("/:id", validate(getUserByIdSchema), getUserById);
router.post("/", validate(createUserSchema), createUser);

// ✅ Edit user (Admin page)
router.patch("/:id", validate(updateUserSchema), updateUser);

export default router;