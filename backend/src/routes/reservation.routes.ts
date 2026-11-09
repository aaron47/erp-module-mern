import { Router } from "express";
import * as controller from "../controllers/reservation.controller.js";
export const reservationRouter = Router();
reservationRouter.get("/", controller.list);
reservationRouter.get("/:id", controller.get);
reservationRouter.post("/", controller.create);
reservationRouter.put("/:id", controller.update);
reservationRouter.delete("/:id", controller.remove);
