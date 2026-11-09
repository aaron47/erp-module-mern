import { Router } from "express";
import * as controller from "../controllers/order.controller.js";
export const orderRouter = Router();
orderRouter.get("/", controller.list);
orderRouter.get("/:id", controller.get);
orderRouter.post("/", controller.create);
orderRouter.put("/:id", controller.update);
orderRouter.delete("/:id", controller.remove);
orderRouter.get("/:id/status", controller.status);
