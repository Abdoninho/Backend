import {
  loginService,
  meService,
  registerService,
  sendVerificationService,
  verifyEmailService,
  getGoogleAuthUrl,
  getGithubAuthUrl,
  googleCallbackService,
  githubCallbackService,
} from "./auth.service.js";

export async function register(req, res) {
  const {
    firstName,
    lastName,
    email,
    phone,
    role,
    academicId,
    department,
    academicYear,
    preferredTrack,
    password,
  } = req.validated.body;

  const result = await registerService({
    firstName,
    lastName,
    email,
    phone,
    role,
    academicId,
    department,
    academicYear,
    preferredTrack,
    password,
  });

  res.status(201).json({ ok: true, data: result });
}

export async function login(req, res) {
  const { email, password, rememberMe } = req.validated.body;
  const result = await loginService({ email, password, rememberMe });
  res.json({ ok: true, data: result });
}

export async function me(req, res) {
  const user = await meService(req.user.id);
  res.json({ ok: true, data: user });
}

export async function sendVerification(req, res) {
  const { email } = req.validated.body;
  const result = await sendVerificationService({ email });
  res.json({ ok: true, data: result });
}

export async function verifyEmail(req, res) {
  const { email, code } = req.validated.body;
  const result = await verifyEmailService({ email, code });
  res.json({ ok: true, data: result });
}

// -------- OAuth endpoints (JSON responses) --------

// يبدأ رحلة جوجل: Redirect لصفحة جوجل
export async function googleAuth(req, res) {
  const url = getGoogleAuthUrl();
  res.redirect(url);
}

// Callback من جوجل: يرجع JSON (token + user)
export async function googleCallback(req, res) {
  const code = req.query.code;
  const result = await googleCallbackService(code);
  res.json({ ok: true, data: result });
}

// يبدأ رحلة جيتهاب
export async function githubAuth(req, res) {
  const url = getGithubAuthUrl();
  res.redirect(url);
}

// Callback من جيتهاب: يرجع JSON
export async function githubCallback(req, res) {
  const code = req.query.code;
  const result = await githubCallbackService(code);
  res.json({ ok: true, data: result });
}
