import { randomUUID } from "node:crypto";
export interface DocumentMetadata {
  _id: string;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}
export const documentFields = {
  _id: { type: String, default: () => randomUUID() },
  owner: {
    type: String,
    ref: "User",
    required: true,
    index: true,
    immutable: true,
  },
};
