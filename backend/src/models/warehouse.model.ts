import { db } from "../config/database.js";
import type { DocumentMetadata } from "./document.js";
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
export const warehouses = db.collection<WarehouseDocument>("warehouses");
