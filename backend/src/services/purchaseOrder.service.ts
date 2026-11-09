import type { ClientSession } from "mongodb";
import { Problem } from "../errors/Problem.js";
import { newDocument } from "../models/document.js";
import {
  purchaseOrders,
  purchaseOrderSchema,
} from "../models/purchaseOrder.model.js";
import { StockService } from "./stock.service.js";
export class PurchaseOrderService {
  constructor(
    private readonly owner: string,
    private readonly session?: ClientSession,
  ) {}
  list() {
    return purchaseOrders
      .find({ owner: this.owner }, { session: this.session })
      .sort({ _id: 1 })
      .toArray();
  }
  async get(id: string) {
    const record = await purchaseOrders.findOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
    if (!record) throw new Problem(404, "Record not found in purchase-orders");
    return record;
  }

  async create(body: unknown) {
    const data = purchaseOrderSchema.parse(body);
    const stock = await new StockService(this.owner, this.session).adjust(
      data.stockId,
      data.quantity,
    );
    const receipt = {
      ...newDocument(this.owner),
      ...data,
      productId: stock.productId,
    };
    await purchaseOrders.insertOne(receipt, { session: this.session });
    return receipt;
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
    const receipt = {
      ...old,
      ...data,
      productId: stock.productId,
      updatedAt: new Date(),
    };
    await purchaseOrders.replaceOne({ _id: id, owner: this.owner }, receipt, {
      session: this.session,
    });
    return receipt;
  }
  async delete(id: string) {
    const old = await this.get(id);
    await new StockService(this.owner, this.session).adjust(
      old.stockId,
      -old.quantity,
    );
    await purchaseOrders.deleteOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
  }
}
