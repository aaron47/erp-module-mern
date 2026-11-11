import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { list, purchase } from "../controllers/catalog.controller.js";

export const catalogRouter = Router();
catalogRouter.get("/", list);
catalogRouter.post("/purchases", authenticate, purchase);
