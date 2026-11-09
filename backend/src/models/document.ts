import { randomUUID } from "node:crypto";
export interface DocumentMetadata {
  _id: string;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}
export function newDocument(owner: string): DocumentMetadata {
  const now = new Date();
  return { _id: randomUUID(), owner, createdAt: now, updatedAt: now };
}
