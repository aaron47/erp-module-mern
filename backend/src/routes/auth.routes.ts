import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { register, login } from "../controllers/auth.controller.js";

export const authRouter = Router();
authRouter.use(
  rateLimit({
    windowMs: 15 * 60_000,
    limit: 50,
    message: {
      error: "Too many authentication attempts. Please try again later.",
    },
  }),
);
authRouter.post("/register", register);
authRouter.post("/login", login);
