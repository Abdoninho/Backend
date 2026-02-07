import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createUserSchema,
  getUserByIdSchema,
  listUsersSchema,
} from "./users.schema.js";
import { createUser, getUserById, listUsers } from "./users.controller.js";

const router = Router();

router.get("/", validate(listUsersSchema), listUsers);
router.get("/:id", validate(getUserByIdSchema), getUserById);
router.post("/", validate(createUserSchema), createUser);

export default router;
