import "server-only";
import { cookies } from "next/headers";
import type { ApiResponse } from "@/shared/types";
import { ApiError, parseApiResponse } from "./shared";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api/v1";

export type ServerApiResponse<T> = ApiResponse<T>;

export { ApiError as ServerApiError };

type RequestOptions = {
  cache?: RequestCache;
  revalidate?: number | false;
  useCookies?: boolean;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const { useCookies = true, cache, revalidate } = options;
  let cookieHeader = "";

  if (useCookies) {
    const cookieStore = await cookies();
    cookieHeader = cookieStore.toString();
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {})
    },
    credentials: useCookies ? "include" : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache,
    next: revalidate !== undefined ? { revalidate } : undefined
  });

  return parseApiResponse<T>(res);
}

export async function serverGet<T>(
  path: string,
  options: { cache?: RequestCache; revalidate?: number | false } = {}
): Promise<T> {
  return request<T>("GET", path, undefined, options);
}

export async function serverPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export async function serverPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PUT", path, body);
}

export async function serverDelete<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}

export async function publicGet<T>(
  path: string,
  options: { cache?: RequestCache; revalidate?: number | false } = {}
): Promise<T> {
  return request<T>("GET", path, undefined, { ...options, useCookies: false });
}
