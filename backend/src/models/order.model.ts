import { Schema, model } from "mongoose";
import { documentFields, type DocumentMetadata } from "./document.js";
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

const schema = new Schema<OrderDocument>(
  {
    ...documentFields,
    description: { type: String, default: "" },
    orderPlacerId: { type: String, ref: "User", required: true },
    status: {
      type: String,
      enum: ["CONFIRMED", "PENDING", "REJECTED", "COMPLETED"],
      required: true,
    },
    items: [
      {
        _id: false,
        productId: { type: String, ref: "Product", required: true },
        quantity: { type: Number, min: 1, required: true },
        unitPrice: { type: Number, min: 0, required: true },
      },
    ],
  },
  { timestamps: true, versionKey: false },
);
export const OrderModel = model("Order", schema, "orders");
