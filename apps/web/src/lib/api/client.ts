import { API_BASE_URL } from "../config";

export type ApiResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
      code?: string;
      details?: unknown;
    };

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ApiErrorData {
  error?: string;
  code?: string;
  details?: unknown;
}

function isApiErrorData(data: unknown): data is ApiErrorData {
  return typeof data === "object" && data !== null;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const errorData = isApiErrorData(data) ? data : {};
    throw new ApiError(
      errorData.error ?? `Request failed with status ${res.status}`,
      res.status,
      errorData.code,
      errorData.details
    );
  }

  if (data && typeof data === "object" && "ok" in data && data.ok === true && "data" in data) {
    return data.data as T;
  }

  return data as T;
}

class ApiClient {
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {})
      },
      credentials: "include"
    });

    return parseResponse<T>(res);
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
