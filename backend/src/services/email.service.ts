import nodemailer from "nodemailer";
import { UserModel } from "../models/user.model.js";
import { config } from "../config/env.js";

const mail = config.SMTP_URL
  ? nodemailer.createTransport(config.SMTP_URL)
  : null;
export async function notify(owner: string, status: string, key: string) {
  if (!mail) return;
  const user = await UserModel.findOne({ _id: owner });
  if (user)
    await mail.sendMail({
      from: config.MAIL_FROM ?? "erp@localhost",
      to: user.email,
      subject: "Order " + status.toLowerCase(),
      text: "Order " + key + " is " + status.toLowerCase() + ".",
    });
}
