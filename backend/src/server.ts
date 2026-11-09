import { app } from "./app.js";
import { config } from "./config/env.js";
import { initialize } from "./config/initialize.js";
import { mongo } from "./config/database.js";

await initialize();
const server = app.listen(config.PORT, "0.0.0.0", () =>
  console.log("ERP listening on port " + config.PORT),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.once(signal, () => server.close(() => void mongo.close()));
