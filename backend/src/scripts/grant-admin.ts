import mongoose from "mongoose";
import { config } from "../config/env.js";
import { UserModel } from "../models/user.model.js";

try {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Supply the email of an existing account.");
  await mongoose.connect(config.MONGODB_URI);
  const result = await UserModel.updateOne(
    { email },
    { $set: { role: "admin" } },
  );
  if (!result.matchedCount)
    throw new Error("No account with that email. Register it first.");
  console.log(`Dashboard access granted to ${email}.`);
} catch (error) {
  console.error(
    error instanceof Error && error.constructor === Error
      ? error.message
      : "Could not grant dashboard access.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
