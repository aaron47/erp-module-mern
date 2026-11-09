import { db } from "../config/database.js";
import type { DocumentMetadata } from "./document.js";
import { z } from "zod";
import { id } from "./fields.js";

export const stockSchema = z
  .object({
    productId: id,
    warehouseId: id,
    quantityOnHand: z.number().int().min(0).max(1e9),
  })
  .strict();

export type Stock = z.output<typeof stockSchema> & { quantityReserved: number };

export type StockDocument = Stock & DocumentMetadata;
export const stocks = db.collection<StockDocument>("stocks");
