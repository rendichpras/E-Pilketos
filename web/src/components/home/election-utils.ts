import type { Election } from "@/lib/types";

export type ElectionDisplayStatus = "NONE" | "UPCOMING" | "OPEN" | "CLOSED";

export type ElectionStatusInfo = {
  status: ElectionDisplayStatus;
  label: string;
  description: string;
};

export function getElectionStatus(election: Election | null, now: Date): ElectionStatusInfo {
  if (!election) {
    return {
      status: "NONE",
      label: "Belum ada pemilihan",
      description: "Saat ini belum ada pemilihan yang aktif."
    };
  }

  const start = new Date(election.startAt);
  const end = new Date(election.endAt);

  if (now < start) {
    return {
      status: "UPCOMING",
      label: "Akan dibuka",
      description: "Pemilihan akan dibuka sesuai jadwal. Anda bisa melihat paslon lebih dulu."
    };
  }

  if (now >= start && now <= end) {
    return {
      status: "OPEN",
      label: "Dibuka",
      description: "Bilik suara terbuka. Masukkan token Anda untuk memilih."
    };
  }

  return {
    status: "CLOSED",
    label: "Ditutup",
    description: "Pemilihan telah ditutup. Menunggu publikasi hasil dari panitia."
  };
}

export function isVoteEnabled(election: Election | null, now: Date): boolean {
  if (!election) return false;
  const start = new Date(election.startAt);
  const end = new Date(election.endAt);
  return now >= start && now <= end;
}

export function getVoteDisabledLabel(status: ElectionDisplayStatus): string {
  switch (status) {
    case "UPCOMING":
      return "Belum dibuka";
    case "CLOSED":
      return "Sudah ditutup";
    case "NONE":
      return "Belum ada pemilihan";
    default:
      return "Masuk bilik suara";
  }
}
