import "server-only";
import { cookies } from "next/headers";
import type { ApiResponse } from "@/shared/types";
import { ApiError, parseApiResponse } from "./shared";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api/v1";

export type ServerApiResponse<T> = ApiResponse<T>;

export { ApiError as ServerApiError };

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

  return parseApiResponse<T>(res);
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

  return parseApiResponse<T>(res);
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

  return parseApiResponse<T>(res);
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

  return parseApiResponse<T>(res);
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

  return parseApiResponse<T>(res);
}
