import type { ApiErrorBody, ErrorCode } from "@/types/api";

export class ApiError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ErrorCode, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const BASE_URL = "/api/v1";

export async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers,
  });

  if (res.status === 204) {
    return {} as T;
  }

  const contentType = res.headers.get("content-type") || "";
  let data: any = null;

  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else if (contentType.includes("text/")) {
    data = await res.text();
  }

  if (!res.ok) {
    const errorBody = (data as ApiErrorBody)?.error;
    const code: ErrorCode = errorBody?.code || (res.status === 401 ? "UNAUTHENTICATED" : "INTERNAL");
    const message = errorBody?.message || res.statusText || "Request failed";
    const details = errorBody?.details;

    // Auto-redirect to login on 401 in browser if not already on login page
    if (res.status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/erp/login") && !path.includes("/auth/me") && !path.includes("/auth/login")) {
        window.location.href = `/erp/login?next=${encodeURIComponent(currentPath)}`;
      }
    }

    throw new ApiError(code, message, res.status, details);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    fetchApi<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    fetchApi<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    fetchApi<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  del: <T>(path: string, options?: RequestInit) =>
    fetchApi<T>(path, { method: "DELETE", ...options }),
};
