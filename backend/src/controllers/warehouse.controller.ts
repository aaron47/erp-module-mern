import type { RequestHandler } from "express";
import { WarehouseService } from "../services/warehouse.service.js";
import { transact } from "../repositories/transaction.js";

export const list: RequestHandler = async (_req, res) => {
  res.json(await new WarehouseService(res.locals.owner).list());
};
export const get: RequestHandler = async (req, res) => {
  res.json(
    await new WarehouseService(res.locals.owner).get(String(req.params.id)),
  );
};
export const create: RequestHandler = async (req, res) => {
  const owner = res.locals.owner;
  const record = await transact(owner, (session) =>
    new WarehouseService(owner, session).create(req.body),
  );

  res.status(201).json(record);
};
export const update: RequestHandler = async (req, res) => {
  const owner = res.locals.owner;
  const record = await transact(owner, (session) =>
    new WarehouseService(owner, session).update(
      String(req.params.id),
      req.body,
    ),
  );

  res.json(record);
};
export const remove: RequestHandler = async (req, res) => {
  const owner = res.locals.owner;
  await transact(owner, (session) =>
    new WarehouseService(owner, session).delete(String(req.params.id)),
  );
  res.sendStatus(204);
};
