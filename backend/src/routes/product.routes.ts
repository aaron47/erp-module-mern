import { Router } from "express";
import * as controller from "../controllers/product.controller.js";
export const productRouter = Router();
productRouter.get("/", controller.list);
productRouter.get("/:id", controller.get);
productRouter.post("/", controller.create);
productRouter.put("/:id", controller.update);
productRouter.delete("/:id", controller.remove);
