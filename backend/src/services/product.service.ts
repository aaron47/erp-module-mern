import type { ClientSession } from "mongodb";
import { Problem, conflict } from "../errors/Problem.js";
import { newDocument } from "../models/document.js";
import { products, productSchema } from "../models/product.model.js";
import { stocks } from "../models/stock.model.js";
import { orders } from "../models/order.model.js";
export class ProductService {
  constructor(
    private readonly owner: string,
    private readonly session?: ClientSession,
  ) {}
  list() {
    return products
      .find({ owner: this.owner }, { session: this.session })
      .sort({ _id: 1 })
      .toArray();
  }
  async get(id: string) {
    const record = await products.findOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
    if (!record) throw new Problem(404, "Record not found in products");
    return record;
  }

  async create(body: unknown) {
    const record = { ...newDocument(this.owner), ...productSchema.parse(body) };
    await products.insertOne(record, { session: this.session });
    return record;
  }
  async update(id: string, body: unknown) {
    const old = await this.get(id);
    const record = {
      ...old,
      ...productSchema.parse(body),
      updatedAt: new Date(),
    };
    await products.replaceOne({ _id: id, owner: this.owner }, record, {
      session: this.session,
    });
    return record;
  }
  async delete(id: string) {
    await this.get(id);
    if (
      (await stocks.findOne(
        { owner: this.owner, productId: id },
        { session: this.session },
      )) ||
      (await orders.findOne(
        { owner: this.owner, "items.productId": id },
        { session: this.session },
      ))
    )
      conflict("Product is referenced by stock or orders.");
    await products.deleteOne(
      { _id: id, owner: this.owner },
      { session: this.session },
    );
  }
}
