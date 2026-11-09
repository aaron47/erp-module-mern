import { Router } from "express";
import * as controller from "../controllers/stock.controller.js";
export const stockRouter = Router();
stockRouter.get("/", controller.list);
stockRouter.get("/:id", controller.get);
stockRouter.post("/", controller.create);
stockRouter.put("/:id", controller.update);
stockRouter.delete("/:id", controller.remove);
