import type { ClientSession } from "mongodb";
import { Problem, conflict } from "../errors/Problem.js";
import { newDocument } from "../models/document.js";
import { warehouses, warehouseSchema } from "../models/warehouse.model.js";
import { stocks } from "../models/stock.model.js";
export class WarehouseService {
  constructor(
    private readonly owner: string,
    private readonly session?: ClientSession,
  ) {}
  list() {
    return warehouses
      .find({ owner: this.owner }, { session: this.session })
      .sort({ _id: 1 })
      .toArray();
  }
  async get(id: string) {
    const record = await warehouses.findOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
    if (!record) throw new Problem(404, "Record not found in warehouses");
    return record;
  }

  async create(body: unknown) {
    const record = {
      ...newDocument(this.owner),
      ...warehouseSchema.parse(body),
    };
    await warehouses.insertOne(record, { session: this.session });
    return record;
  }
  async update(id: string, body: unknown) {
    const old = await this.get(id);
    const record = {
      ...old,
      ...warehouseSchema.parse(body),
      updatedAt: new Date(),
    };
    await warehouses.replaceOne({ _id: id, owner: this.owner }, record, {
      session: this.session,
    });
    return record;
  }
  async delete(id: string) {
    await this.get(id);
    if (
      await stocks.findOne(
        { owner: this.owner, warehouseId: id },
        { session: this.session },
      )
    )
      conflict("Warehouse still contains stock records.");
    await warehouses.deleteOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
  }
}
