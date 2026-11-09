import type { RequestHandler } from "express";
import * as auth from "../services/auth.service.js";
export const register: RequestHandler = async (req, res) => {
  res.status(201).json(await auth.register(req.body));
};
export const login: RequestHandler = async (req, res) => {
  res.json(await auth.login(req.body));
};
