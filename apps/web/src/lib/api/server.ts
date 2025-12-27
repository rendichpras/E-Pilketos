import "server-only";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api/v1";

export type ServerApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string; details?: unknown };

export class ServerApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ServerApiError";
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
    throw new ServerApiError(
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

export async function serverGet<T>(
  path: string,
  options: { cache?: RequestCache; revalidate?: number | false } = {}
): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {})
    },
    credentials: "include",
    cache: options.cache,
    next: options.revalidate !== undefined ? { revalidate: options.revalidate } : undefined
  });

  return parseResponse<T>(res);
}

export async function serverPost<T>(path: string, body?: unknown): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {})
    },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  return parseResponse<T>(res);
}

export async function serverPut<T>(path: string, body?: unknown): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {})
    },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  return parseResponse<T>(res);
}

export async function serverDelete<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {})
    },
    credentials: "include"
  });

  return parseResponse<T>(res);
}

export async function publicGet<T>(
  path: string,
  options: { cache?: RequestCache; revalidate?: number | false } = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
    cache: options.cache,
    next: options.revalidate !== undefined ? { revalidate: options.revalidate } : undefined
  });

  return parseResponse<T>(res);
}
