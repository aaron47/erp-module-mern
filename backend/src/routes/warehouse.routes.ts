import { Router } from "express";
import * as controller from "../controllers/warehouse.controller.js";
export const warehouseRouter = Router();
warehouseRouter.get("/", controller.list);
warehouseRouter.get("/:id", controller.get);
warehouseRouter.post("/", controller.create);
warehouseRouter.put("/:id", controller.update);
warehouseRouter.delete("/:id", controller.remove);
