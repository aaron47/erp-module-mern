import { db } from "../config/database.js";
import type { DocumentMetadata } from "./document.js";
import { z } from "zod";
import { id, quantity } from "./fields.js";

export const orderSchema = z
  .object({
    description: z.string().trim().max(500).default(""),
    items: z
      .array(z.object({ productId: id, quantity }).strict())
      .min(1)
      .max(100),
  })
  .strict();

export type OrderStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "COMPLETED";
export type Order = Omit<z.output<typeof orderSchema>, "items"> & {
  items: { productId: string; quantity: number; unitPrice: number }[];
  orderPlacerId: string;
  status: OrderStatus;
};

export type OrderDocument = Order & DocumentMetadata;
export const orders = db.collection<OrderDocument>("orders");
