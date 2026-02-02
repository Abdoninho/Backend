import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";

import { loginSchema, registerSchema, sendVerificationSchema, verifyEmailSchema } from "./auth.schema.js";
import { login, me, register, sendVerification, verifyEmail } from "./auth.controller.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", auth, me);
router.post("/send-verification", validate(sendVerificationSchema), sendVerification);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);


export default router;
