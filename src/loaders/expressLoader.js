//what does this file do? It configures and sets up the Express.js application with essential middlewares for security, logging, request parsing, and CORS handling.

//عشان اما نغير اعدادات السيرفر نغيرها من مكان واد ونخلي  app.jsنضيف

//middleware are functions that have access to the request object (req), the response object (res), and the next middleware function in the application’s request-response cycle. The next middleware function is generally represented by a variable named next.
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { corsOptions } from "../config/cors.js";

export function expressLoader(app) {
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(cors(corsOptions));
}
