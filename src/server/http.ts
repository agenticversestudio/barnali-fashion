import type { ApiErrorBody, ErrorCode } from "@/types/api";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  GARMENT_CONFLICT: 409,
  RULE: 422,
  LOCKED: 423,
  INTERNAL: 500,
};

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
  get status() {
    return STATUS[this.code];
  }
}

export const fail = (code: ErrorCode, message: string, details?: unknown): never => {
  throw new ApiError(code, message, details);
};

export function json(data: unknown, init: { status?: number; headers?: HeadersInit } = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(data, { status: init.status ?? 200, headers });
}

export function errorResponse(e: unknown): Response {
  if (e instanceof ApiError) {
    const body: ApiErrorBody = { error: { code: e.code, message: e.message, details: e.details } };
    return json(body, { status: e.status });
  }
  console.error("[api] unhandled", e);
  const body: ApiErrorBody = { error: { code: "INTERNAL", message: "Something went wrong" } };
  return json(body, { status: 500 });
}

/** Wrap a route handler so thrown ApiErrors become JSON error responses. */
export function route<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

/** Parse a JSON body into a plain object (400 if not an object). */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("VALIDATION", "Body must be valid JSON");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("VALIDATION", "Body must be a JSON object");
  return body as Record<string, unknown>;
}

/** Map a libsql error that came from our overlap trigger into a typed error marker. */
export function isConflictError(e: unknown): boolean {
  return e instanceof Error && /GARMENT_CONFLICT/.test(e.message);
}
