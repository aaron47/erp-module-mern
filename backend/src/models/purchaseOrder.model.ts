import { Schema, model } from "mongoose";
import { documentFields, type DocumentMetadata } from "./document.js";
import { z } from "zod";
import { id, name, quantity } from "./fields.js";

export const purchaseOrderSchema = z
  .object({ stockId: id, supplierId: name, quantity })
  .strict();

export type PurchaseOrder = z.output<typeof purchaseOrderSchema> & {
  productId: string;
};

export type PurchaseOrderDocument = PurchaseOrder & DocumentMetadata;

const schema = new Schema<PurchaseOrderDocument>(
  {
    ...documentFields,
    stockId: { type: String, ref: "Stock", required: true },
    productId: { type: String, ref: "Product", required: true },
    supplierId: { type: String, required: true },
    quantity: { type: Number, min: 1, required: true },
  },
  { timestamps: true, versionKey: false },
);
export const PurchaseOrderModel = model(
  "PurchaseOrder",
  schema,
  "purchase-orders",
);
