import { mongo } from "../config/database.js";
import { Problem } from "../errors/Problem.js";
import { users } from "../models/user.model.js";
import type { ClientSession } from "mongodb";

export async function transact<T>(
  owner: string,
  fn: (session: ClientSession) => Promise<T>,
) {
  return mongo.withSession((session) =>
    session.withTransaction(async () => {
      // Serialize writers within each workspace, including reference checks and deletes.
      const lock = await users.updateOne(
        { _id: owner },
        { $inc: { revision: 1 } },
        { session },
      );
      if (!lock.matchedCount) throw new Problem(401, "Account unavailable");
      return fn(session);
    }),
  );
}
