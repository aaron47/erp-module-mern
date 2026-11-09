import { Schema, model } from "mongoose";
import { documentFields, type DocumentMetadata } from "./document.js";
import { z } from "zod";
import { id, quantity } from "./fields.js";

export const reservationSchema = z
  .object({
    orderId: id,
    stockId: id,
    quantity,
    status: z.enum(["RESERVED", "FULFILLED", "RELEASED"]).default("RESERVED"),
  })
  .strict();

export type Reservation = z.output<typeof reservationSchema>;

export type ReservationDocument = Reservation & DocumentMetadata;

const schema = new Schema<ReservationDocument>(
  {
    ...documentFields,
    orderId: { type: String, ref: "Order", required: true },
    stockId: { type: String, ref: "Stock", required: true },
    quantity: { type: Number, min: 1, required: true },
    status: {
      type: String,
      enum: ["RESERVED", "RELEASED", "FULFILLED"],
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);
schema.index({ owner: 1, orderId: 1, stockId: 1 }, { unique: true });
export const ReservationModel = model("Reservation", schema, "reservations");
