import type { ClientSession } from "mongoose";
import { Problem, conflict } from "../errors/Problem.js";
import {
  ReservationModel,
  reservationSchema,
} from "../models/reservation.model.js";

import { StockService } from "./stock.service.js";
import { WarehouseService } from "./warehouse.service.js";
import { OrderModel, type OrderStatus } from "../models/order.model.js";
import type { Reservation } from "../models/reservation.model.js";
export class ReservationService {
  constructor(
    private readonly owner: string,
    private readonly session?: ClientSession,
  ) {}
  list(owners: string[] = [this.owner]) {
    return ReservationModel.find({ owner: { $in: owners } })
      .session(this.session ?? null)
      .sort({ _id: 1 })
      .lean();
  }
  async get(id: string) {
    const record = await ReservationModel.findOne({
      _id: id,
      owner: this.owner,
    }).session(this.session ?? null);
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
    const order = await OrderModel.findOne({
      _id: data.orderId,
      owner: this.owner,
    }).session(this.session ?? null);
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
    const record = await new ReservationModel({
      owner: this.owner,
      ...data,
    }).save({ session: this.session });
    await this.refreshOrder(record.orderId);
    return record;
  }
  async update(id: string, body: unknown) {
    const old = await this.get(id);
    const data = await this.validate(body);
    await this.applyAllocation(old, -1);
    await this.applyAllocation(data, 1);
    const previousOrderId = old.orderId;
    old.set(data);
    await old.save({ session: this.session });
    await this.refreshOrder(old.orderId);
    if (previousOrderId !== old.orderId)
      await this.refreshOrder(previousOrderId);
    return old;
  }
  async delete(id: string) {
    const old = await this.get(id);
    await this.applyAllocation(old, -1);
    await ReservationModel.deleteOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
    await this.refreshOrder(old.orderId);
  }
  private async refreshOrder(key: string) {
    const order = await OrderModel.findOne({
      _id: key,
      owner: this.owner,
    }).session(this.session ?? null);
    if (!order) throw new Problem(404, "Record not found in orders");
    const allocations = await ReservationModel.find({
      owner: this.owner,
      orderId: key,
    })
      .session(this.session ?? null)
      .lean();
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
    await OrderModel.updateOne(
      { _id: key, owner: this.owner },
      { $set: { status, updatedAt: new Date() } },
      { session: this.session },
    );
  }
}
