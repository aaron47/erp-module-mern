import type { ClientSession } from "mongoose";
import { Problem, conflict } from "../errors/Problem.js";
import { ProductModel, productSchema } from "../models/product.model.js";
import { StockModel } from "../models/stock.model.js";
import { OrderModel } from "../models/order.model.js";
export class ProductService {
  constructor(
    private readonly owner: string,
    private readonly session?: ClientSession,
  ) {}
  list(owners: string[] = [this.owner]) {
    return ProductModel.find({ owner: { $in: owners } })
      .session(this.session ?? null)
      .sort({ _id: 1 })
      .lean();
  }
  async get(id: string) {
    const record = await ProductModel.findOne({
      _id: id,
      owner: this.owner,
    }).session(this.session ?? null);
    if (!record) throw new Problem(404, "Record not found in products");
    return record;
  }

  async create(body: unknown) {
    return new ProductModel({
      owner: this.owner,
      ...productSchema.parse(body),
    }).save({ session: this.session });
  }
  async update(id: string, body: unknown) {
    const old = await this.get(id);
    old.set(productSchema.parse(body));
    return old.save({ session: this.session });
  }
  async delete(id: string) {
    await this.get(id);
    if (
      (await StockModel.findOne({ owner: this.owner, productId: id }).session(
        this.session ?? null,
      )) ||
      (await OrderModel.findOne({
        owner: this.owner,
        "items.productId": id,
      }).session(this.session ?? null))
    )
      conflict("Product is referenced by stock or OrderModel.");
    await ProductModel.deleteOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
  }
}
