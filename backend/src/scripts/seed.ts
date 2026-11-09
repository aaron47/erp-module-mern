import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db, mongo } from "../config/database.js";
import { initialize } from "../config/initialize.js";
import { credentials, users } from "../models/user.model.js";
import { ProductService } from "../services/product.service.js";
import { WarehouseService } from "../services/warehouse.service.js";
import { StockService } from "../services/stock.service.js";
import { OrderService } from "../services/order.service.js";
import { PurchaseOrderService } from "../services/purchaseOrder.service.js";
import { ReservationService } from "../services/reservation.service.js";

async function seed() {
  const login = credentials.safeParse({
    email: process.env.SEED_EMAIL ?? "demo@example.test",
    password: process.env.SEED_PASSWORD,
  });
  if (!login.success) {
    throw new Error(
      "Set SEED_PASSWORD (at least 8 characters, up to 72 bytes) and a valid SEED_EMAIL in backend/.env.",
    );
  }
  const { email, password } = login.data;
  await initialize();
  const owner = randomUUID();
  const hash = await bcrypt.hash(password, 12);
  const created = await mongo.withSession((session) =>
    session.withTransaction(async () => {
      const existing = await users.findOne({ email }, { session });
      if (existing) {
        if (!existing.demoSeeded)
          throw new Error(
            "This email belongs to an existing account. Choose a different SEED_EMAIL for the demo.",
          );
        if (!(await bcrypt.compare(password, existing.hash)))
          throw new Error("This demo account uses a different SEED_PASSWORD.");
        return false;
      }
      // The account and its entire workspace commit together.
      await users.insertOne(
        { _id: owner, email, hash, revision: 0, demoSeeded: true },
        { session },
      );
      const products = new ProductService(owner, session);
      const warehouses = new WarehouseService(owner, session);
      const stock = new StockService(owner, session);
      const orders = new OrderService(owner, session);
      const reservations = new ReservationService(owner, session);

      const paris = await warehouses.create({
        code: "PAR",
        name: "Paris Central",
        city: "Paris",
        address: "10 Demo Street",
      });
      const lyon = await warehouses.create({
        code: "LYO",
        name: "Lyon Distribution",
        city: "Lyon",
        address: "20 Demo Avenue",
      });
      const keyboard = await products.create({
        name: "Mechanical keyboard",
        price: 79.9,
      });
      const mouse = await products.create({
        name: "Wireless mouse",
        price: 29.9,
      });
      const dock = await products.create({ name: "USB-C dock", price: 119 });
      await stock.create({
        productId: keyboard._id,
        warehouseId: paris._id,
        quantityOnHand: 120,
      });
      await stock.create({
        productId: keyboard._id,
        warehouseId: lyon._id,
        quantityOnHand: 100,
      });
      const mouseStock = await stock.create({
        productId: mouse._id,
        warehouseId: lyon._id,
        quantityOnHand: 100,
      });
      await new PurchaseOrderService(owner, session).create({
        stockId: mouseStock._id,
        supplierId: "DEMO-SUPPLY",
        quantity: 20,
      });

      const shipped = await orders.create({
        description: "Shipped accessories",
        items: [{ productId: mouse._id, quantity: 4 }],
      });
      const allocation = (await reservations.list()).find(
        (row) => row.orderId === shipped._id,
      );
      if (!allocation)
        throw new Error("Expected a reservation for the demo shipment.");
      await reservations.update(allocation._id, {
        orderId: shipped._id,
        stockId: allocation.stockId,
        quantity: allocation.quantity,
        status: "FULFILLED",
      });
      await orders.create({
        description: "Keyboard fleet refresh",
        items: [
          { productId: keyboard._id, quantity: 150 },
          { productId: mouse._id, quantity: 5 },
        ],
      });
      await orders.create({
        description: "Dock awaiting inventory",
        items: [{ productId: dock._id, quantity: 2 }],
      });
      return true;
    }),
  );
  console.log(
    created
      ? `Demo data created in ${db.databaseName}. Sign in as ${email} using SEED_PASSWORD.`
      : `Demo data already seeded for ${email}.`,
  );
}

try {
  await seed();
} catch (error) {
  // Driver errors may include connection details.
  console.error(
    error instanceof Error && error.constructor === Error
      ? error.message
      : "Seed failed. Check database connectivity and read/write access, then rerun.",
  );
  process.exitCode = 1;
} finally {
  await mongo.close();
}
