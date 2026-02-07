//what does this file do? It defines CORS options for the application, specifying the allowed origin and enabling credentials based on environment variables.
//عشان الربط مع الفرونت (localhost:3000) يشتغل بدون وجع دماغ.
import { env } from "./env.js";

export const corsOptions = {
  origin: (origin, callback) => {
    const allowed = [env.corsOrigin]; // تقدر تزود هنا
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
