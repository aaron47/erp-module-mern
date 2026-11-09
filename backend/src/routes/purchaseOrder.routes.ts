import { Router } from "express";
import * as controller from "../controllers/purchaseOrder.controller.js";
export const purchaseOrderRouter = Router();
purchaseOrderRouter.get("/", controller.list);
purchaseOrderRouter.get("/:id", controller.get);
purchaseOrderRouter.post("/", controller.create);
purchaseOrderRouter.put("/:id", controller.update);
purchaseOrderRouter.delete("/:id", controller.remove);
