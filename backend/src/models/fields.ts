import { z } from "zod";

export const id = z.string().uuid();
export const name = z.string().trim().min(1).max(200);
export const quantity = z.number().int().positive().max(1_000_000);
