"use client";

import type { CandidatePair, Election } from "@/shared/types";

const KEY = "vote_selection_v2";
const TTL_MS = 10 * 60 * 1000;

export type VoteSelectionPayload = {
  election: Election | null;
  candidate: CandidatePair;
  selectedAt: string;
  expiresAt: number;
};

export function saveVoteSelection(input: { election: Election | null; candidate: CandidatePair }) {
  try {
    const now = Date.now();
    const payload: VoteSelectionPayload = {
      election: input.election,
      candidate: input.candidate,
      selectedAt: new Date(now).toISOString(),
      expiresAt: now + TTL_MS
    };
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {}
}

export function loadVoteSelection(): VoteSelectionPayload | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as VoteSelectionPayload;

    if (!data || typeof data !== "object") return null;
    if (!data.candidate || typeof data.candidate.id !== "string") return null;
    if (typeof data.expiresAt !== "number") return null;

    if (Date.now() > data.expiresAt) {
      clearVoteSelection();
      return null;
    }

    if (data.election?.id && data.candidate.electionId !== data.election.id) {
      clearVoteSelection();
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function clearVoteSelection() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
