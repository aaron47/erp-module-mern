import { Schema, model } from "mongoose";
import { documentFields, type DocumentMetadata } from "./document.js";
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

const schema = new Schema<StockDocument>(
  {
    ...documentFields,
    productId: { type: String, ref: "Product", required: true },
    warehouseId: { type: String, ref: "Warehouse", required: true },
    quantityOnHand: { type: Number, min: 0, required: true },
    quantityReserved: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false },
);
schema.index({ owner: 1, productId: 1, warehouseId: 1 }, { unique: true });
export const StockModel = model("Stock", schema, "stocks");
