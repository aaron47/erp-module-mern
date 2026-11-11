import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { credentials, UserModel } from "../models/user.model.js";
import { ProductService } from "../services/product.service.js";
import { WarehouseService } from "../services/warehouse.service.js";
import { StockService } from "../services/stock.service.js";
import { OrderService } from "../services/order.service.js";
import { PurchaseOrderService } from "../services/purchaseOrder.service.js";
import { ReservationService } from "../services/reservation.service.js";
import { WarehouseModel } from "../models/warehouse.model.js";
import type { ClientSession } from "mongoose";

const catalogSamples = [
  { name: "Adjustable laptop stand", price: 44.9, units: 36 },
  { name: "Noise-cancelling headset", price: 89.5, units: 24 },
  { name: "1080p USB webcam", price: 49, units: 32 },
  { name: "Felt desk mat", price: 18.9, units: 60 },
  { name: "USB-C charging cable", price: 12.5, units: 100 },
  { name: "Portable SSD 1 TB", price: 99.9, units: 20 },
  { name: "LED desk lamp", price: 35, units: 28 },
  { name: "Cable organizer set", price: 8.9, units: 80 },
];

async function addCatalogSamples(owner: string, session: ClientSession) {
  const warehouse =
    (await WarehouseModel.findOne({ owner, active: true })
      .sort({ code: 1 })
      .session(session)) ??
    (await new WarehouseService(owner, session).create({
      code: "DEMO-" + randomUUID().slice(0, 8),
      name: "Catalog stockroom",
      city: "Paris",
    }));
  const products = new ProductService(owner, session);
  const stock = new StockService(owner, session);
  for (const { name, price, units } of catalogSamples) {
    const product = await products.create({ name, price });
    await stock.create({
      productId: product._id,
      warehouseId: warehouse._id,
      quantityOnHand: units,
    });
  }
}

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
  await connectDatabase();
  const owner = randomUUID();
  const hash = await bcrypt.hash(password, 12);
  const created = await mongoose.connection.transaction(async (session) => {
    const existing = await UserModel.findOne({ email }).session(session);
    if (existing) {
      if (!existing.demoSeeded)
        throw new Error(
          "This email belongs to an existing account. Choose a different SEED_EMAIL for the demo.",
        );
      if (!(await bcrypt.compare(password, existing.hash)))
        throw new Error("This demo account uses a different SEED_PASSWORD.");
      if (existing.role !== "admin") {
        existing.role = "admin";
        await existing.save({ session });
      }
      if (!existing.demoCatalogSeeded) {
        await addCatalogSamples(existing._id, session);
        existing.demoCatalogSeeded = true;
        await existing.save({ session });
        return "expanded";
      }
      return false;
    }
    // The account and its entire workspace commit together.
    await new UserModel({
      _id: owner,
      email,
      hash,
      revision: 0,
      demoSeeded: true,
      demoCatalogSeeded: true,
      role: "admin",
    }).save({ session });
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
    await addCatalogSamples(owner, session);
    return true;
  });
  console.log(
    created === "expanded"
      ? `Added ${catalogSamples.length} stocked products to the demo catalog.`
      : created
        ? `Demo data created in ${mongoose.connection.name}. Sign in as ${email} using SEED_PASSWORD.`
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
  await mongoose.disconnect();
}
