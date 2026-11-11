import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { catalogRouter } from "./catalog.routes.js";
import { authRouter } from "./auth.routes.js";
import { productRouter } from "./product.routes.js";
import { warehouseRouter } from "./warehouse.routes.js";
import { stockRouter } from "./stock.routes.js";
import { orderRouter } from "./order.routes.js";
import { reservationRouter } from "./reservation.routes.js";
import { purchaseOrderRouter } from "./purchaseOrder.routes.js";

export const api = Router();
api.use("/auth", authRouter);
api.use("/catalog", catalogRouter);
api.use(authenticate);
api.get("/me", (_req, res) =>
  res.json({ email: res.locals.email, role: res.locals.role }),
);
api.use(requireAdmin);
api.use("/products", productRouter);
api.use("/warehouses", warehouseRouter);
api.use("/stocks", stockRouter);
api.use("/orders", orderRouter);
api.use("/reservations", reservationRouter);
api.use("/purchase-orders", purchaseOrderRouter);
