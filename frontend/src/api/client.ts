const base = (
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api(
  path: string,
  method = "GET",
  body?: object,
  token?: string,
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      details.error ?? "Request failed (" + response.status + ").",
    );
  }
  return response.status === 204 ? null : response.json();
}

export type RequestApi = <T>(
  path: string,
  method?: string,
  body?: object,
) => Promise<T>;
