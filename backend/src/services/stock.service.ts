import type { ClientSession } from "mongodb";
import { Problem, conflict } from "../errors/Problem.js";
import { newDocument } from "../models/document.js";
import { stocks, stockSchema } from "../models/stock.model.js";
import { ProductService } from "./product.service.js";
import { WarehouseService } from "./warehouse.service.js";
import { reservations } from "../models/reservation.model.js";
import { purchaseOrders } from "../models/purchaseOrder.model.js";
export class StockService {
  constructor(
    private readonly owner: string,
    private readonly session?: ClientSession,
  ) {}
  list() {
    return stocks
      .find({ owner: this.owner }, { session: this.session })
      .sort({ _id: 1 })
      .toArray();
  }
  async get(id: string) {
    const record = await stocks.findOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
    if (!record) throw new Problem(404, "Record not found in stocks");
    return record;
  }

  async create(body: unknown) {
    const data = stockSchema.parse(body);
    await new ProductService(this.owner, this.session).get(data.productId);
    await new WarehouseService(this.owner, this.session).get(data.warehouseId);
    const stock = { ...newDocument(this.owner), ...data, quantityReserved: 0 };
    await stocks.insertOne(stock, { session: this.session });
    return stock;
  }
  async update(id: string, body: unknown) {
    const old = await this.get(id);
    const data = stockSchema.parse(body);
    if (
      old.productId !== data.productId ||
      old.warehouseId !== data.warehouseId
    )
      conflict("Product and warehouse are fixed for this stock record.");
    if (data.quantityOnHand < old.quantityReserved)
      conflict("On-hand stock must cover reserved units.");
    const stock = { ...old, ...data, updatedAt: new Date() };
    await stocks.replaceOne({ _id: id, owner: this.owner }, stock, {
      session: this.session,
    });
    return stock;
  }
  async adjust(id: string, onHand: number, reserved = 0) {
    const old = await this.get(id);
    const quantityOnHand = old.quantityOnHand + onHand,
      quantityReserved = old.quantityReserved + reserved;
    if (
      quantityReserved < 0 ||
      quantityOnHand < quantityReserved ||
      quantityOnHand > 1e9
    )
      conflict("Stock adjustment exceeds available inventory.");
    const stock = {
      ...old,
      quantityOnHand,
      quantityReserved,
      updatedAt: new Date(),
    };
    await stocks.replaceOne({ _id: id, owner: this.owner }, stock, {
      session: this.session,
    });
    return stock;
  }
  async delete(id: string) {
    await this.get(id);
    if (
      (await reservations.findOne(
        { owner: this.owner, stockId: id },
        { session: this.session },
      )) ||
      (await purchaseOrders.findOne(
        { owner: this.owner, stockId: id },
        { session: this.session },
      ))
    )
      conflict("Stock is referenced by reservations or receipts.");
    await stocks.deleteOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
  }
}
