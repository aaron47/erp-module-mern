export class Problem extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function conflict(message: string): never {
  throw new Problem(409, message);
}
