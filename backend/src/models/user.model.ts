import { model, Schema } from "mongoose";
import { z } from "zod";

const schema = new Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    hash: { type: String, required: true },
    revision: { type: Number, default: 0 },
    demoSeeded: Boolean,
  },
  { versionKey: false },
);
export const UserModel = model("User", schema, "users");

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
