import "dotenv/config";
import { z } from "zod";

export const config = z
  .object({
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    PORT: z.coerce.number().int().positive().default(4000),
    CLIENT_ORIGIN: z.string().url(),
    LOW_STOCK_THRESHOLD: z.coerce.number().int().min(0).max(100).default(10),
    SMTP_URL: z.string().optional(),
    MAIL_FROM: z.string().email().optional(),
  })
  .parse(process.env);
if (config.JWT_SECRET.startsWith("replace-with-"))
  throw new Error("Configure JWT_SECRET in backend/.env");
