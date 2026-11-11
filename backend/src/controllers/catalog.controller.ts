import type { RequestHandler } from "express";
import { z } from "zod";
import { id, quantity } from "../models/fields.js";
import { ProductModel } from "../models/product.model.js";
import { UserModel } from "../models/user.model.js";
import { OrderService } from "../services/order.service.js";
import { transact } from "../repositories/transaction.js";
import { Problem } from "../errors/Problem.js";

export const list: RequestHandler = async (_req, res) => {
  const sellers = await UserModel.distinct("_id", { role: "admin" });
  res.json(
    await ProductModel.find({ owner: { $in: sellers } })
      .select("_id name price")
      .sort({ name: 1, _id: 1 })
      .lean(),
  );
};

const purchaseInput = z.object({ productId: id, quantity }).strict();

export const purchase: RequestHandler = async (req, res) => {
  const item = purchaseInput.parse(req.body);
  const product = await ProductModel.findById(item.productId)
    .select("owner")
    .lean();
  if (!product) throw new Problem(404, "Product unavailable.");
  const order = await transact(product.owner, async (session) => {
    const seller = await UserModel.exists({
      _id: product.owner,
      role: "admin",
    }).session(session);
    if (!seller) throw new Problem(404, "Product unavailable.");
    return new OrderService(product.owner, session).create(
      {
        description: "Catalog purchase",
        items: [item],
      },
      res.locals.owner,
    );
  });
  res
    .status(201)
    .json({ _id: order._id, status: order.status, items: order.items });
};
