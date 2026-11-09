import { mongo, db } from "./database.js";
import { users } from "../models/user.model.js";

export async function initialize() {
  await mongo.connect();
  const hello = await db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== "isdbgrid")
    throw new Error("ERP requires a MongoDB replica set or sharded cluster.");
  await users.createIndex({ email: 1 }, { unique: true });
  for (const kind of [
    "products",
    "warehouses",
    "stocks",
    "orders",
    "reservations",
    "purchase-orders",
  ] as const)
    await db.collection(kind).createIndex({ owner: 1 });
  await db
    .collection("stocks")
    .createIndex({ owner: 1, productId: 1, warehouseId: 1 }, { unique: true });
  await db
    .collection("warehouses")
    .createIndex({ owner: 1, code: 1 }, { unique: true });
  await db
    .collection("reservations")
    .createIndex({ owner: 1, orderId: 1, stockId: 1 }, { unique: true });
}
