import { type RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Problem } from "../errors/Problem.js";
import { config } from "../config/env.js";
import { UserModel } from "../models/user.model.js";

export const authenticate: RequestHandler = async (req, res, next) => {
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
  } catch {
    return next(new Problem(401, "Please sign in."));
  }
  const account = await UserModel.findById(res.locals.owner)
    .select("email role")
    .lean();
  if (!account) throw new Problem(401, "Account unavailable.");
  res.locals.role = account.role ?? "customer";
  res.locals.email = account.email;
  next();
};

export const requireAdmin: RequestHandler = (_req, res, next) => {
  if (res.locals.role !== "admin")
    throw new Problem(403, "Administrator access required.");
  next();
};
