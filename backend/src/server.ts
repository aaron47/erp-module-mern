import { app } from "./app.js";
import { config } from "./config/env.js";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database.js";

await connectDatabase();
const server = app.listen(config.PORT, "0.0.0.0", () =>
  console.log("ERP listening on port " + config.PORT),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.once(signal, () => server.close(() => void mongoose.disconnect()));
