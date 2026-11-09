import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authRouter } from "./auth.routes.js";
import { productRouter } from "./product.routes.js";
import { warehouseRouter } from "./warehouse.routes.js";
import { stockRouter } from "./stock.routes.js";
import { orderRouter } from "./order.routes.js";
import { reservationRouter } from "./reservation.routes.js";
import { purchaseOrderRouter } from "./purchaseOrder.routes.js";

export const api = Router();
api.use("/auth", authRouter);
api.use(authenticate);
api.use("/products", productRouter);
api.use("/warehouses", warehouseRouter);
api.use("/stocks", stockRouter);
api.use("/orders", orderRouter);
api.use("/reservations", reservationRouter);
api.use("/purchase-orders", purchaseOrderRouter);
