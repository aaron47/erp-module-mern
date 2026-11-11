import type { ClientSession } from "mongoose";
import { Problem, conflict } from "../errors/Problem.js";
import { StockModel, stockSchema } from "../models/stock.model.js";
import { ProductService } from "./product.service.js";
import { WarehouseService } from "./warehouse.service.js";
import { ReservationModel } from "../models/reservation.model.js";
import { PurchaseOrderModel } from "../models/purchaseOrder.model.js";
export class StockService {
  constructor(
    private readonly owner: string,
    private readonly session?: ClientSession,
  ) {}
  list(owners: string[] = [this.owner]) {
    return StockModel.find({ owner: { $in: owners } })
      .session(this.session ?? null)
      .sort({ _id: 1 })
      .lean();
  }
  async get(id: string) {
    const record = await StockModel.findOne({
      _id: id,
      owner: this.owner,
    }).session(this.session ?? null);
    if (!record) throw new Problem(404, "Record not found in stocks");
    return record;
  }

  async create(body: unknown) {
    const data = stockSchema.parse(body);
    await new ProductService(this.owner, this.session).get(data.productId);
    await new WarehouseService(this.owner, this.session).get(data.warehouseId);
    return new StockModel({
      owner: this.owner,
      ...data,
      quantityReserved: 0,
    }).save({ session: this.session });
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
    old.set(data);
    return old.save({ session: this.session });
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
    old.set({
      quantityOnHand,
      quantityReserved,
    });
    return old.save({ session: this.session });
  }
  async delete(id: string) {
    await this.get(id);
    if (
      (await ReservationModel.findOne({
        owner: this.owner,
        stockId: id,
      }).session(this.session ?? null)) ||
      (await PurchaseOrderModel.findOne({
        owner: this.owner,
        stockId: id,
      }).session(this.session ?? null))
    )
      conflict("Stock is referenced by reservations or receipts.");
    await StockModel.deleteOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
  }
}
