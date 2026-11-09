import type { ClientSession } from "mongodb";
import { Problem, conflict } from "../errors/Problem.js";
import { newDocument } from "../models/document.js";
import {
  reservations,
  reservationSchema,
} from "../models/reservation.model.js";

import { StockService } from "./stock.service.js";
import { WarehouseService } from "./warehouse.service.js";
import { orders, type OrderStatus } from "../models/order.model.js";
import type { Reservation } from "../models/reservation.model.js";
export class ReservationService {
  constructor(
    private readonly owner: string,
    private readonly session?: ClientSession,
  ) {}
  list() {
    return reservations
      .find({ owner: this.owner }, { session: this.session })
      .sort({ _id: 1 })
      .toArray();
  }
  async get(id: string) {
    const record = await reservations.findOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
    if (!record) throw new Problem(404, "Record not found in reservations");
    return record;
  }

  async applyAllocation(record: Reservation, direction: 1 | -1) {
    const inventory = new StockService(this.owner, this.session);
    if (record.status === "RESERVED")
      await inventory.adjust(record.stockId, 0, direction * record.quantity);
    if (record.status === "FULFILLED")
      await inventory.adjust(record.stockId, -direction * record.quantity);
  }
  private async validate(body: unknown) {
    const data = reservationSchema.parse(body);
    const order = await orders.findOne(
      { _id: data.orderId, owner: this.owner },
      { session: this.session },
    );
    if (!order) throw new Problem(404, "Record not found in orders");
    const stock = await new StockService(this.owner, this.session).get(
      data.stockId,
    );
    if (
      data.status === "RESERVED" &&
      !(
        await new WarehouseService(this.owner, this.session).get(
          stock.warehouseId,
        )
      ).active
    )
      conflict("Choose stock in an active warehouse.");
    if (!order.items.some((line) => line.productId === stock.productId))
      conflict("Stock must match a product in the selected order.");
    return data;
  }
  async create(body: unknown) {
    const data = await this.validate(body);
    await this.applyAllocation(data, 1);
    const record = { ...newDocument(this.owner), ...data };
    await reservations.insertOne(record, { session: this.session });
    await this.refreshOrder(record.orderId);
    return record;
  }
  async update(id: string, body: unknown) {
    const old = await this.get(id);
    const data = await this.validate(body);
    await this.applyAllocation(old, -1);
    await this.applyAllocation(data, 1);
    const record = { ...old, ...data, updatedAt: new Date() };
    await reservations.replaceOne({ _id: id, owner: this.owner }, record, {
      session: this.session,
    });
    await this.refreshOrder(record.orderId);
    if (old.orderId !== record.orderId) await this.refreshOrder(old.orderId);
    return record;
  }
  async delete(id: string) {
    const old = await this.get(id);
    await this.applyAllocation(old, -1);
    await reservations.deleteOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
    await this.refreshOrder(old.orderId);
  }
  private async refreshOrder(key: string) {
    const order = await orders.findOne(
      { _id: key, owner: this.owner },
      { session: this.session },
    );
    if (!order) throw new Problem(404, "Record not found in orders");
    const allocations = await reservations
      .find({ owner: this.owner, orderId: key }, { session: this.session })
      .toArray();
    const totals = new Map<string, { held: number; shipped: number }>();
    for (const reservation of allocations) {
      if (reservation.status === "RELEASED") continue;
      const { productId } = await new StockService(
        this.owner,
        this.session,
      ).get(reservation.stockId);
      const total = totals.get(productId) ?? { held: 0, shipped: 0 };
      if (reservation.status === "FULFILLED")
        total.shipped += reservation.quantity;
      else total.held += reservation.quantity;
      totals.set(productId, total);
    }
    let complete = true,
      covered = true;
    for (const line of order.items) {
      const { held, shipped } = totals.get(line.productId) ?? {
        held: 0,
        shipped: 0,
      };
      if (shipped + held > line.quantity)
        conflict("Allocation exceeds the order line quantity.");
      complete &&= shipped === line.quantity;
      covered &&= shipped + held === line.quantity;
    }
    const status: OrderStatus = complete
      ? "COMPLETED"
      : covered
        ? "CONFIRMED"
        : "PENDING";
    await orders.updateOne(
      { _id: key, owner: this.owner },
      { $set: { status, updatedAt: new Date() } },
      { session: this.session },
    );
  }
}
