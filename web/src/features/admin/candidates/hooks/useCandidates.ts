import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { CandidatePair, CreateCandidateDto, UpdateCandidateDto } from "@/shared/types";

export function useCandidates(electionId: string | null) {
  const [candidates, setCandidates] = useState<CandidatePair[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCandidates = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.candidates.listByElection(id);
      setCandidates(data.candidates);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message || "Gagal memuat kandidat."
          : "Gagal memuat kandidat.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (electionId) {
      loadCandidates(electionId);
    } else {
      setCandidates([]);
    }
  }, [electionId, loadCandidates]);

  const refresh = useCallback(() => {
    if (electionId) loadCandidates(electionId);
  }, [electionId, loadCandidates]);

  const createCandidate = async (data: CreateCandidateDto) => {
    if (!electionId) return;
    try {
      await adminApi.candidates.create(electionId, data);
      await loadCandidates(electionId);
      toast.success("Kandidat berhasil ditambahkan.");
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message || "Gagal menyimpan kandidat."
          : "Gagal menyimpan kandidat.";
      throw new Error(message);
    }
  };

  const updateCandidate = async (id: string, data: UpdateCandidateDto) => {
    try {
      const updated = await adminApi.candidates.update(id, data);
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success("Kandidat berhasil diperbarui.");
      return updated;
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message || "Gagal memperbarui kandidat."
          : "Gagal memperbarui kandidat.";
      throw new Error(message);
    }
  };

  const deleteCandidate = async (id: string) => {
    try {
      await adminApi.candidates.remove(id);
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      toast.success("Kandidat berhasil dihapus.");
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message || "Gagal menghapus kandidat."
          : "Gagal menghapus kandidat.";
      toast.error(message);
      throw new Error(message);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const updated = await adminApi.candidates.update(id, { isActive });
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success(isActive ? "Kandidat diaktifkan." : "Kandidat dinonaktifkan.");
      return updated;
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message || "Gagal mengubah status kandidat."
          : "Gagal mengubah status kandidat.";
      toast.error(message);
      throw new Error(message);
    }
  };

  return {
    candidates,
    loading,
    error,
    refresh,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    toggleActive
  };
}
