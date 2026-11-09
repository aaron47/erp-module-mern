import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { UserModel } from "./models/user.model.js";
import { api } from "./routes/index.js";
import { Problem } from "./errors/Problem.js";
import { onError } from "./middleware/errorHandler.js";

export const app = express();
app.disable("x-powered-by");
if (process.env.RENDER) app.set("trust proxy", 1);
app.use(cors({ origin: config.CLIENT_ORIGIN }));
app.use(express.json({ limit: "100kb" }));
app.get("/health", async (_req, res) => {
  await UserModel.exists({ _id: "health-check" });
  res.json({ status: "ok" });
});
app.use("/api/v1", api);
app.use((_req, _res, next) => next(new Problem(404, "Endpoint not found.")));
app.use(onError);
