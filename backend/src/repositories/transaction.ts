import mongoose, { type ClientSession } from "mongoose";
import { Problem } from "../errors/Problem.js";
import { UserModel } from "../models/user.model.js";
export function transact<T>(
  owner: string,
  fn: (session: ClientSession) => Promise<T>,
) {
  return mongoose.connection.transaction(async (session) => {
    // Serialize writers for this owner, including reference checks and deletes.
    const lock = await UserModel.updateOne(
      { _id: owner },
      { $inc: { revision: 1 } },
      { session },
    );
    if (!lock.matchedCount) throw new Problem(401, "Account unavailable");
    return fn(session);
  });
}
