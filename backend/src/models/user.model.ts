import { db } from "../config/database.js";
import { z } from "zod";

export const users = db.collection<{
  _id: string;
  email: string;
  hash: string;
  revision: number;
  demoSeeded?: boolean;
}>("users");

export const credentials = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((x) => x.toLowerCase()),
    password: z
      .string()
      .min(8)
      .refine((x) => Buffer.byteLength(x) <= 72, "Password exceeds 72 bytes."),
  })
  .strict();
