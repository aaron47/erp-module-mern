import { db } from "../config/database.js";
import type { DocumentMetadata } from "./document.js";
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
export const reservations = db.collection<ReservationDocument>("reservations");
