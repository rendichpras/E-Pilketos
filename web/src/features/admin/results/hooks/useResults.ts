import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { AdminResultsResponse } from "@/shared/types";

export function useResults(electionId: string | null) {
  const [results, setResults] = useState<AdminResultsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.results.getAdminResults(id);
      setResults(res);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message || "Gagal memuat hasil." : "Gagal memuat hasil.";
      setError(message);
      toast.error(message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (electionId) {
      fetchResults(electionId);
    } else {
      setResults(null);
    }
  }, [electionId, fetchResults]);

  const refresh = () => {
    if (electionId) fetchResults(electionId);
  };

  return {
    results,
    loading,
    error,
    refresh
  };
}
