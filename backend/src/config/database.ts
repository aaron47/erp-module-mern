import { MongoClient } from "mongodb";
import { config } from "./env.js";

export const mongo = new MongoClient(config.MONGODB_URI);
export const db = mongo.db();
