import { UserModel } from "../models/user.model.js";
import type { RequestHandler } from "express";
import { OrderService } from "../services/order.service.js";
import { transact } from "../repositories/transaction.js";
import { notify } from "../services/email.service.js";
export const list: RequestHandler = async (req, res) => {
  const owners =
    req.query.scope === "dashboard"
      ? await UserModel.distinct("_id", { role: "admin" })
      : [res.locals.owner];
  const rows = await new OrderService(res.locals.owner).list(owners);
  res.json(
    req.query.scope === "dashboard"
      ? rows.map((row) => ({
          ...row,
          readOnly: row.owner !== res.locals.owner,
        }))
      : rows,
  );
};
export const get: RequestHandler = async (req, res) => {
  res.json(await new OrderService(res.locals.owner).get(String(req.params.id)));
};
export const create: RequestHandler = async (req, res) => {
  const owner = res.locals.owner;
  const record = await transact(owner, (session) =>
    new OrderService(owner, session).create(req.body),
  );
  notifyOrder(record);
  res.status(201).json(record);
};
export const update: RequestHandler = async (req, res) => {
  const owner = res.locals.owner;
  const record = await transact(owner, (session) =>
    new OrderService(owner, session).update(String(req.params.id), req.body),
  );
  notifyOrder(record);
  res.json(record);
};
export const remove: RequestHandler = async (req, res) => {
  const owner = res.locals.owner;
  await transact(owner, (session) =>
    new OrderService(owner, session).delete(String(req.params.id)),
  );
  res.sendStatus(204);
};
export const status: RequestHandler = async (req, res) => {
  const order = await new OrderService(res.locals.owner).get(
    String(req.params.id),
  );
  res.json(order.status);
};
function notifyOrder(order: { owner: string; status: string; _id: string }) {
  void notify(order.owner, order.status, order._id).catch(() =>
    console.error("Order email delivery failed."),
  );
}
