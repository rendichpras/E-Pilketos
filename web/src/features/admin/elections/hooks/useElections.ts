import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { handleApiError } from "@/lib/error-helper";
import type { Election, UpdateElectionDto, CreateElectionDto } from "@/shared/types";

export function useElections() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadElections = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const data = await adminApi.elections.list();
      setElections(data);
    } catch (err) {
      const message = handleApiError(err, "Gagal memuat daftar pemilihan.");
      setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadElections();
  }, [loadElections]);

  const createElection = async (data: CreateElectionDto) => {
    try {
      const created = await adminApi.elections.create(data);
      setElections((prev) => [created, ...prev]);
      toast.success("Pemilihan berhasil dibuat.");
      return created;
    } catch (err) {
      throw new Error(handleApiError(err, "Gagal membuat pemilihan."));
    }
  };

  const updateElection = async (id: string, data: UpdateElectionDto) => {
    try {
      const updated = await adminApi.elections.update(id, data);
      setElections((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success("Pemilihan berhasil diperbarui.");
      return updated;
    } catch (err) {
      throw new Error(handleApiError(err, "Gagal memperbarui pemilihan."));
    }
  };

  const activateElection = async (id: string) => {
    try {
      const updated = await adminApi.elections.activate(id);
      setElections((prev) =>
        prev.map((e) =>
          e.id === updated.id ? updated : e.status === "ACTIVE" ? { ...e, status: "CLOSED" } : e
        )
      );
      toast.success("Pemilihan berhasil diaktifkan.");
      return updated;
    } catch (err) {
      throw new Error(handleApiError(err, "Gagal mengaktifkan pemilihan."));
    }
  };

  const closeElection = async (id: string) => {
    try {
      const updated = await adminApi.elections.close(id);
      setElections((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success("Pemilihan berhasil ditutup.");
      return updated;
    } catch (err) {
      throw new Error(handleApiError(err, "Gagal menutup pemilihan."));
    }
  };

  const publishResults = async (id: string) => {
    try {
      const updated = await adminApi.elections.publishResults(id);
      setElections((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success("Hasil berhasil dipublikasikan.");
      return updated;
    } catch (err) {
      throw new Error(handleApiError(err, "Gagal mempublikasikan hasil."));
    }
  };

  const hideResults = async (id: string) => {
    try {
      const updated = await adminApi.elections.hideResults(id);
      setElections((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success("Hasil berhasil disembunyikan.");
      return updated;
    } catch (err) {
      throw new Error(handleApiError(err, "Gagal menyembunyikan hasil."));
    }
  };

  return {
    elections,
    loading,
    error,
    refresh: loadElections,
    createElection,
    updateElection,
    activateElection,
    closeElection,
    publishResults,
    hideResults
  };
}
