import { db } from "../config/database.js";
import type { DocumentMetadata } from "./document.js";
import { z } from "zod";
import { id, name, quantity } from "./fields.js";

export const purchaseOrderSchema = z
  .object({ stockId: id, supplierId: name, quantity })
  .strict();

export type PurchaseOrder = z.output<typeof purchaseOrderSchema> & {
  productId: string;
};

export type PurchaseOrderDocument = PurchaseOrder & DocumentMetadata;
export const purchaseOrders =
  db.collection<PurchaseOrderDocument>("purchase-orders");
