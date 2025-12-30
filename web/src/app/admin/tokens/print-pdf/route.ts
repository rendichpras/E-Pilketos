import React from "react";
import type { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import type { AdminTokensListResponse } from "@/lib/types";
import { TokenSheetDocument } from "../TokenSheetDocument";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LIMIT_PER_PAGE = 1000;
const MAX_TOKENS_HARD_CAP = 5000;

function normalizeApiBase(base: string) {
  const clean = base.replace(/\/+$/, "");
  return clean.endsWith("/api/v1") ? clean : `${clean}/api/v1`;
}

function getApiBase(req: NextRequest) {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) return normalizeApiBase(fromEnv);
  return normalizeApiBase(req.nextUrl.origin);
}

function clampInt(value: string | null, def: number, min: number, max: number) {
  const n = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
}

function safeSlug(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest): Promise<Response> {
  const searchParams = req.nextUrl.searchParams;

  const electionId = searchParams.get("electionId");
  const batch = searchParams.get("batch")?.trim() || undefined;

  const statusParam = (searchParams.get("status") || "UNUSED").toUpperCase();
  if (statusParam !== "UNUSED") {
    return new Response("PDF hanya bisa dibuat untuk token UNUSED.", { status: 400 });
  }
  const status = "UNUSED" as const;

  const maxTokens = clampInt(searchParams.get("max"), MAX_TOKENS_HARD_CAP, 1, MAX_TOKENS_HARD_CAP);

  if (!electionId) return new Response("Missing electionId", { status: 400 });

  const apiBase = getApiBase(req);

  const headers: HeadersInit = { Accept: "application/json" };
  const cookie = req.headers.get("cookie");
  if (cookie) (headers as Record<string, string>).cookie = cookie;

  let page = 1;
  let total = Infinity;
  const allTokens: AdminTokensListResponse["tokens"] = [];
  let firstPageData: AdminTokensListResponse | null = null;

  while (allTokens.length < Math.min(total, maxTokens)) {
    const qs = new URLSearchParams();
    qs.set("status", "UNUSED");
    qs.set("page", String(page));
    qs.set("limit", String(LIMIT_PER_PAGE));
    if (batch) qs.set("batch", batch);

    const url = `${apiBase}/admin/tokens/${electionId}?${qs.toString()}`;

    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      return new Response(`Gagal mengambil data token dari server: ${text}`, { status: 500 });
    }
    const data = (await res.json()) as AdminTokensListResponse;

    if (!firstPageData) firstPageData = data;

    total = data.pagination.total ?? 0;

    if (!data.tokens?.length) break;

    const remaining = Math.min(total, maxTokens) - allTokens.length;
    allTokens.push(...data.tokens.slice(0, remaining));

    const gotAll = allTokens.length >= Math.min(total, maxTokens);
    if (gotAll) break;

    const totalPages = Math.ceil(total / data.pagination.limit);
    if (page >= totalPages) break;

    page += 1;
  }

  if (!firstPageData) return new Response("Gagal mengambil data token.", { status: 500 });
  if (!allTokens.length)
    return new Response("Tidak ada token UNUSED untuk dibuatkan PDF.", { status: 400 });

  const electionName = firstPageData.election.name ?? "Pemilihan";
  const electionSlug = firstPageData.election.slug ?? safeSlug(electionName);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(TokenSheetDocument as any, {
    tokens: allTokens,
    electionName,
    status,
    batch: batch || null
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfUint8 = (await renderToBuffer(element as any)) as Uint8Array;

  const pdfArrayBuffer = new ArrayBuffer(pdfUint8.byteLength);
  new Uint8Array(pdfArrayBuffer).set(pdfUint8);

  const batchPart = batch ? `-${safeSlug(batch)}` : "";
  const filename = `tokens-${electionSlug}-UNUSED${batchPart}.pdf`;

  return new Response(pdfArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
