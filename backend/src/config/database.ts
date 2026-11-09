import mongoose from "mongoose";
import { config } from "./env.js";
import { ProductModel } from "../models/product.model.js";
import { WarehouseModel } from "../models/warehouse.model.js";
import { StockModel } from "../models/stock.model.js";
import { OrderModel } from "../models/order.model.js";
import { ReservationModel } from "../models/reservation.model.js";
import { PurchaseOrderModel } from "../models/purchaseOrder.model.js";
import { UserModel } from "../models/user.model.js";

export async function connectDatabase() {
  await mongoose.connect(config.MONGODB_URI);
  await Promise.all(
    [
      UserModel,
      ProductModel,
      WarehouseModel,
      StockModel,
      OrderModel,
      ReservationModel,
      PurchaseOrderModel,
    ].map((model) => model.init()),
  );
  // Confirm the deployment supports the transactions used by all write routes.
  await mongoose.connection.transaction(async (session) => {
    await UserModel.exists({ _id: "connection-check" }).session(session);
  });
}
