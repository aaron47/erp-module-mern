import type { ClientSession } from "mongoose";
import { Problem } from "../errors/Problem.js";
import {
  PurchaseOrderModel,
  purchaseOrderSchema,
} from "../models/purchaseOrder.model.js";
import { StockService } from "./stock.service.js";
export class PurchaseOrderService {
  constructor(
    private readonly owner: string,
    private readonly session?: ClientSession,
  ) {}
  list(owners: string[] = [this.owner]) {
    return PurchaseOrderModel.find({ owner: { $in: owners } })
      .session(this.session ?? null)
      .sort({ _id: 1 })
      .lean();
  }
  async get(id: string) {
    const record = await PurchaseOrderModel.findOne({
      _id: id,
      owner: this.owner,
    }).session(this.session ?? null);
    if (!record) throw new Problem(404, "Record not found in purchase-orders");
    return record;
  }

  async create(body: unknown) {
    const data = purchaseOrderSchema.parse(body);
    const stock = await new StockService(this.owner, this.session).adjust(
      data.stockId,
      data.quantity,
    );
    return new PurchaseOrderModel({
      owner: this.owner,
      ...data,
      productId: stock.productId,
    }).save({ session: this.session });
  }
  async update(id: string, body: unknown) {
    const old = await this.get(id);
    const data = purchaseOrderSchema.parse(body);
    const inventory = new StockService(this.owner, this.session);
    const sameStock = old.stockId === data.stockId;
    if (!sameStock) await inventory.adjust(old.stockId, -old.quantity);
    const stock = await inventory.adjust(
      data.stockId,
      data.quantity - (sameStock ? old.quantity : 0),
    );
    old.set({
      ...data,
      productId: stock.productId,
    });
    return old.save({ session: this.session });
  }
  async delete(id: string) {
    const old = await this.get(id);
    await new StockService(this.owner, this.session).adjust(
      old.stockId,
      -old.quantity,
    );
    await PurchaseOrderModel.deleteOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
  }
}
