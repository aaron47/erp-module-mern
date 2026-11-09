import { Schema, model } from "mongoose";
import { documentFields, type DocumentMetadata } from "./document.js";
import { z } from "zod";
import { name } from "./fields.js";

export const productSchema = z
  .object({ name, price: z.number().nonnegative().max(1e9).multipleOf(0.01) })
  .strict();

export type Product = z.output<typeof productSchema>;

export type ProductDocument = Product & DocumentMetadata;

const schema = new Schema<ProductDocument>(
  {
    ...documentFields,
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, versionKey: false },
);
export const ProductModel = model("Product", schema, "products");
