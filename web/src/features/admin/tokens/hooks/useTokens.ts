import { useState, useCallback } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { AdminTokensListResponse, TokenStatus, GenerateTokensDto } from "@/shared/types";

export interface UseTokensParams {
  page: number;
  limit: number;
  status: TokenStatus | "all";
  q: string;
}

export function useTokens(electionId: string | null) {
  const [data, setData] = useState<AdminTokensListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(
    async (params: UseTokensParams) => {
      if (!electionId) {
        setData(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.tokens.list(electionId, {
          page: params.page,
          limit: params.limit,
          status: params.status === "all" ? undefined : params.status,
          q: params.q.trim() || undefined
        });
        setData(res);
      } catch (err: unknown) {
        const message =
          err instanceof ApiError ? err.message || "Gagal memuat token." : "Gagal memuat token.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [electionId]
  );

  const generateTokens = async (dto: GenerateTokensDto) => {
    if (!electionId) return;
    try {
      const res = await adminApi.tokens.generate(electionId, dto);
      toast.success(`Berhasil membuat ${res.createdCount} token.`);
      return res;
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message || "Gagal generate token." : "Gagal generate token.";
      toast.error(message);
      throw new Error(message);
    }
  };

  const invalidateToken = async (tokenId: string) => {
    try {
      await adminApi.tokens.invalidate(tokenId);
      toast.success("Token berhasil diinvalidasi.");
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message || "Gagal invalidasi token."
          : "Gagal invalidasi token.";
      toast.error(message);
      throw new Error(message);
    }
  };

  return {
    data,
    loading,
    error,
    fetchTokens,
    generateTokens,
    invalidateToken
  };
}
