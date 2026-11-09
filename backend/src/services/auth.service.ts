import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { config } from "../config/env.js";
import { UserModel, credentials } from "../models/user.model.js";
import { Problem } from "../errors/Problem.js";

function session(account: { _id: string; email: string }) {
  const token = jwt.sign({ sub: account._id }, config.JWT_SECRET, {
    expiresIn: "8h",
    algorithm: "HS256",
    issuer: "erp",
  });
  return { token, email: account.email };
}
export async function register(body: unknown) {
  const { email, password } = credentials.parse(body);
  const account = {
    _id: randomUUID(),
    email,
    hash: await bcrypt.hash(password, 12),
    revision: 0,
  };
  await new UserModel(account).save();
  return session(account);
}
export async function login(body: unknown) {
  const { email, password } = credentials.parse(body);
  const account = await UserModel.findOne({ email });
  if (!account || !(await bcrypt.compare(password, account.hash)))
    throw new Problem(401, "Invalid email or password.");
  return session(account);
}
