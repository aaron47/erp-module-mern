import { type RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Problem } from "../errors/Problem.js";
import { config } from "../config/env.js";

export const authenticate: RequestHandler = (req, res, next) => {
  try {
    const token = req.header("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) throw new Error();
    const claims = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "erp",
    });
    if (typeof claims === "string" || typeof claims.sub !== "string")
      throw new Error();
    res.locals.owner = claims.sub;
    next();
  } catch {
    next(new Problem(401, "Sign in to access your workspace."));
  }
};
