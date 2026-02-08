import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";

import { loginSchema, registerSchema, sendVerificationSchema, verifyEmailSchema } from "./auth.schema.js";
import {
  login,
  me,
  register,
  sendVerification,
  verifyEmail,
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
} from "./auth.controller.js";

const router = Router();

// local auth
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", auth, me);
router.post("/send-verification", validate(sendVerificationSchema), sendVerification);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);

// oauth (no validate)
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);

export default router;
