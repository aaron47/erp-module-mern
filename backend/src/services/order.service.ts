import type { ClientSession, HydratedDocument } from "mongoose";
import { Problem, conflict } from "../errors/Problem.js";
import {
  OrderModel,
  orderSchema,
  type OrderDocument,
} from "../models/order.model.js";
import { config } from "../config/env.js";
import { StockModel, type StockDocument } from "../models/stock.model.js";
import { ReservationModel } from "../models/reservation.model.js";
import { ProductService } from "./product.service.js";
import { WarehouseService } from "./warehouse.service.js";
import { ReservationService } from "./reservation.service.js";
import { PurchaseOrderService } from "./purchaseOrder.service.js";
export class OrderService {
  constructor(
    private readonly owner: string,
    private readonly session?: ClientSession,
  ) {}
  list() {
    return OrderModel.find({ owner: this.owner })
      .session(this.session ?? null)
      .sort({ _id: 1 })
      .lean();
  }
  async get(id: string) {
    const record = await OrderModel.findOne({
      _id: id,
      owner: this.owner,
    }).session(this.session ?? null);
    if (!record) throw new Problem(404, "Record not found in orders");
    return record;
  }

  create(body: unknown) {
    return this.place(body);
  }
  async update(id: string, body: unknown) {
    return this.place(body, await this.get(id));
  }
  async delete(id: string) {
    await this.get(id);
    await this.clearOrder(id);
    await OrderModel.deleteOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
  }
  private async clearOrder(key: string) {
    const allocations = await ReservationModel.find({
      owner: this.owner,
      orderId: key,
    })
      .session(this.session ?? null)
      .lean();
    if (allocations.some((x) => x.status === "FULFILLED"))
      conflict(
        "Reverse fulfilled reservations before changing order lines or deleting this order.",
      );
    for (const r of allocations) {
      await new ReservationService(this.owner, this.session).applyAllocation(
        r,
        -1,
      );
      await ReservationModel.deleteOne(
        { _id: r._id, owner: this.owner },
        { session: this.session },
      );
    }
  }
  private async place(body: unknown, old?: HydratedDocument<OrderDocument>) {
    const input = orderSchema.parse(body);
    const quantities = new Map<string, number>();
    for (const item of input.items)
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      );
    const unchanged =
      old &&
      old.items.length === quantities.size &&
      old.items.every((x) => quantities.get(x.productId) === x.quantity);
    if (unchanged && old.status !== "REJECTED") {
      old.description = input.description;
      return old.save({ session: this.session });
    }
    if (old) await this.clearOrder(old._id);
    const items: OrderDocument["items"] = [];
    const plan: { stockId: string; quantity: number }[] = [];
    const replenish: StockDocument[] = [];
    let covered = true;
    for (const [productId, quantity] of quantities) {
      const product = await new ProductService(this.owner, this.session).get(
        productId,
      );
      const prior = old?.items.find((i) => i.productId === productId);
      items.push({
        productId,
        quantity,
        unitPrice: prior?.unitPrice ?? product.price,
      });
      let remaining = quantity;
      for (const stock of await StockModel.find({
        owner: this.owner,
        productId,
      })
        .session(this.session ?? null)
        .sort({ _id: 1 })
        .lean()) {
        if (
          !(
            await new WarehouseService(this.owner, this.session).get(
              stock.warehouseId,
            )
          ).active
        )
          continue;
        if (stock.quantityOnHand < config.LOW_STOCK_THRESHOLD)
          replenish.push(stock);
        const take = Math.min(
          remaining,
          stock.quantityOnHand - stock.quantityReserved,
        );
        if (take > 0) plan.push({ stockId: stock._id, quantity: take });
        remaining -= take;
        if (remaining === 0) break;
      }
      if (remaining > 0) covered = false;
    }
    const order =
      old ?? new OrderModel({ owner: this.owner, orderPlacerId: this.owner });
    order.set({
      description: input.description,
      items,
      status: covered ? "CONFIRMED" : "REJECTED",
    });
    await order.save({ session: this.session });
    if (covered)
      for (const allocation of plan) {
        const data = {
          ...allocation,
          orderId: order._id,
          status: "RESERVED" as const,
        };
        await new ReservationService(this.owner, this.session).applyAllocation(
          data,
          1,
        );
        await new ReservationModel({ owner: this.owner, ...data }).save({
          session: this.session,
        });
      }
    // Simulated receipts follow the reservation decision, even for a rejected order.
    for (const stock of replenish) {
      const candidates = await StockModel.find({
        owner: this.owner,
        productId: stock.productId,
      })
        .session(this.session ?? null)
        .sort({ _id: 1 })
        .lean();
      const receivingStock = candidates.reduce((lowest, candidate) =>
        candidate.quantityOnHand < lowest.quantityOnHand ? candidate : lowest,
      );
      await new PurchaseOrderService(this.owner, this.session).create({
        stockId: receivingStock._id,
        supplierId: "1",
        quantity: 100 - stock.quantityOnHand,
      });
    }
    return order;
  }
}
