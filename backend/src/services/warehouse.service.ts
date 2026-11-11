import type { ClientSession } from "mongoose";
import { Problem, conflict } from "../errors/Problem.js";
import { WarehouseModel, warehouseSchema } from "../models/warehouse.model.js";
import { StockModel } from "../models/stock.model.js";
export class WarehouseService {
  constructor(
    private readonly owner: string,
    private readonly session?: ClientSession,
  ) {}
  list(owners: string[] = [this.owner]) {
    return WarehouseModel.find({ owner: { $in: owners } })
      .session(this.session ?? null)
      .sort({ _id: 1 })
      .lean();
  }
  async get(id: string) {
    const record = await WarehouseModel.findOne({
      _id: id,
      owner: this.owner,
    }).session(this.session ?? null);
    if (!record) throw new Problem(404, "Record not found in warehouses");
    return record;
  }

  async create(body: unknown) {
    return new WarehouseModel({
      owner: this.owner,
      ...warehouseSchema.parse(body),
    }).save({ session: this.session });
  }
  async update(id: string, body: unknown) {
    const old = await this.get(id);
    old.set(warehouseSchema.parse(body));
    return old.save({ session: this.session });
  }
  async delete(id: string) {
    await this.get(id);
    if (
      await StockModel.findOne({ owner: this.owner, warehouseId: id }).session(
        this.session ?? null,
      )
    )
      conflict("Warehouse still contains stock records.");
    await WarehouseModel.deleteOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
  }
}
