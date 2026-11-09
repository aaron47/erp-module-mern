import { Schema, model } from "mongoose";
import { documentFields, type DocumentMetadata } from "./document.js";
import { z } from "zod";
import { name } from "./fields.js";

export const warehouseSchema = z
  .object({
    code: name.max(30).transform((s) => s.toUpperCase()),
    name,
    city: name,
    address: z.string().trim().max(300).default(""),
    active: z.boolean().default(true),
  })
  .strict();

export type Warehouse = z.output<typeof warehouseSchema>;

export type WarehouseDocument = Warehouse & DocumentMetadata;

const schema = new Schema<WarehouseDocument>(
  {
    ...documentFields,
    code: { type: String, required: true },
    name: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);
schema.index({ owner: 1, code: 1 }, { unique: true });
export const WarehouseModel = model("Warehouse", schema, "warehouses");
