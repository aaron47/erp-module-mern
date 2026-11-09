import { db } from "../config/database.js";
import type { DocumentMetadata } from "./document.js";
import { z } from "zod";
import { name } from "./fields.js";

export const productSchema = z
  .object({ name, price: z.number().nonnegative().max(1e9).multipleOf(0.01) })
  .strict();

export type Product = z.output<typeof productSchema>;

export type ProductDocument = Product & DocumentMetadata;
export const products = db.collection<ProductDocument>("products");
