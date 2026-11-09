import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { Problem } from "../errors/Problem.js";

export const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof Problem) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.issues
        .map((i) => i.path.join(".") + " " + i.message)
        .join(", "),
    });
    return;
  }
  if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
    res
      .status(409)
      .json({ error: "A record with those details already exists." });
    return;
  }
  if (
    err instanceof mongoose.Error.ValidationError ||
    err instanceof mongoose.Error.CastError
  ) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err?.type === "entity.parse.failed" || err?.type === "entity.too.large") {
    res.status(err.status).json({ error: "Invalid request body." });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Unable to complete the request." });
};
