import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { UserModel } from "../src/models/user.model.js";

test("isolated CRUD and transactional sales, allocation and receipt flows", async () => {
  const base = process.env.ERP_TEST_URL;
  assert.ok(base, "Set ERP_TEST_URL to a disposable running ERP API.");
  let token = "";
  async function request(
    path: string,
    method = "GET",
    body?: object,
    status = 200,
  ) {
    const res = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    assert.equal(res.status, status, method + " " + path + " " + text);
    return text ? JSON.parse(text) : null;
  }
  const post = (path: string, data: object) =>
    request("/" + path, "POST", data, 201);
  const credentials = {
    email: randomUUID() + "@example.test",
    password: "an-example-password",
  };
  await request("/stocks", "GET", undefined, 401);
  await post("auth/register", credentials);
  assert.ok(
    process.env.ERP_TEST_MONGODB_URI,
    "Supply the disposable API database URI.",
  );
  await mongoose.connect(process.env.ERP_TEST_MONGODB_URI);
  try {
    const promoted = await UserModel.updateOne(
      { email: credentials.email },
      { $set: { role: "admin" } },
    );
    assert.equal(promoted.matchedCount, 1);
  } finally {
    await mongoose.disconnect();
  }
  token = (await request("/auth/login", "POST", credentials)).token;
  const product = await post("products", { name: "Cable", price: 12.5 });
  const p = product._id;
  for (const [code, quantityOnHand] of [
    ["PAR", 6],
    ["LYO", 12],
  ] as const) {
    const w = await post("warehouses", { name: code, city: code, code });
    await post("stocks", { productId: p, warehouseId: w._id, quantityOnHand });
  }
  const order = {
    description: "Split order",
    items: [
      { productId: p, quantity: 13 },
      { productId: p, quantity: 1 },
    ],
  };
  const o = await post("orders", order);
  assert.equal(o.status, "CONFIRMED");
  assert.equal(o.items[0].quantity, 14);
  assert.equal(o.items[0].unitPrice, 12.5);
  const allocations = await request("/reservations");
  assert.equal(allocations.length, 2);
  assert.equal((await request("/purchase-orders")).length, 1);
  const rejected = await post("orders", {
    description: "Unavailable",
    items: [{ productId: p, quantity: 500 }],
  });
  assert.equal(rejected.status, "REJECTED");
  assert.equal((await request("/reservations")).length, 2);
  await request("/products/" + p, "DELETE", undefined, 409);
  const { orderId, stockId, quantity, _id } = allocations[0];
  await request("/reservations/" + _id, "PUT", {
    orderId,
    stockId,
    quantity,
    status: "FULFILLED",
  });
  await request("/orders/" + o._id, "DELETE", undefined, 409);
  await request("/reservations/" + _id, "DELETE", undefined, 204);
  assert.equal(await request("/orders/" + o._id + "/status"), "PENDING");
  await post("reservations", { orderId, stockId, quantity });
  assert.equal(await request("/orders/" + o._id + "/status"), "CONFIRMED");
  await request("/orders/" + o._id, "DELETE", undefined, 204);
  const stock = await request("/stocks/" + stockId);
  const po = await post("purchase-orders", {
    stockId,
    supplierId: "S1",
    quantity: 20,
  });
  await request("/purchase-orders/" + po._id, "PUT", {
    stockId,
    supplierId: "S1",
    quantity: 12,
  });
  assert.equal(
    (await request("/stocks/" + stockId)).quantityOnHand,
    stock.quantityOnHand + 12,
  );
  await request("/purchase-orders/" + po._id, "DELETE", undefined, 204);
  assert.equal(
    (await request("/stocks/" + stockId)).quantityOnHand,
    stock.quantityOnHand,
  );
  const capacity = (await request("/stocks")).reduce(
    (n: number, s: { quantityOnHand: number }) => n + s.quantityOnHand,
    0,
  );
  const concurrent = await Promise.all(
    [0, 1].map(() =>
      post("orders", { items: [{ productId: p, quantity: capacity }] }),
    ),
  );
  assert.deepEqual(concurrent.map((o) => o.status).sort(), [
    "CONFIRMED",
    "REJECTED",
  ]);
  const adminToken = token;
  token = "";
  const publicItem = (await request("/catalog")).find(
    (row: { _id: string }) => row._id === p,
  );
  assert.deepEqual(publicItem, { _id: p, name: "Cable", price: 12.5 });
  await request(
    "/catalog/purchases",
    "POST",
    { productId: p, quantity: 1 },
    401,
  );
  token = (
    await post("auth/register", {
      ...credentials,
      email: randomUUID() + "@example.test",
    })
  ).token;
  await request("/products", "GET", undefined, 403);
  await request("/orders", "POST", order, 403);
  const customerToken = token;
  token = adminToken;
  await request(
    "/orders/" + concurrent.find((o) => o.status === "CONFIRMED")._id,
    "DELETE",
    undefined,
    204,
  );
  token = customerToken;
  const receipt = await post("catalog/purchases", {
    productId: p,
    quantity: 1,
  });
  assert.equal(receipt.status, "CONFIRMED");
  assert.equal(receipt.items[0].unitPrice, 12.5);
  token = adminToken;
  const purchased = await request("/orders/" + receipt._id);
  assert.notEqual(purchased.orderPlacerId, purchased.owner);
  token = customerToken;
  await request("/products?scope=dashboard", "GET", undefined, 403);
  const viewer = await request("/me");
  await mongoose.connect(process.env.ERP_TEST_MONGODB_URI);
  try {
    await UserModel.updateOne(
      { email: viewer.email },
      { $set: { role: "admin" } },
    );
  } finally {
    await mongoose.disconnect();
  }
  for (const collection of [
    "products",
    "warehouses",
    "stocks",
    "orders",
    "reservations",
    "purchase-orders",
  ]) {
    assert.deepEqual(await request("/" + collection), []);
    const rows = await request("/" + collection + "?scope=dashboard");
    assert.ok(
      rows.some(
        (row: { owner: string; readOnly: boolean }) =>
          row.owner === purchased.owner && row.readOnly,
      ),
    );
  }
  await request("/products/" + p, "PUT", { name: "Changed", price: 1 }, 404);
});
