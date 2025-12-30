import { type InferSelectModel } from "drizzle-orm";
import type { elections } from "../../db/schema";

export type Election = InferSelectModel<typeof elections>;

export const electionHelpers = {
  isActive(election: Election, now = new Date()): boolean {
    return election.status === "ACTIVE" && election.startAt <= now && now <= election.endAt;
  },

  isDraft(election: Election): boolean {
    return election.status === "DRAFT";
  },

  isClosed(election: Election): boolean {
    return election.status === "CLOSED";
  },

  canManageCandidates(election: Election): boolean {
    return election.status === "DRAFT";
  },

  canGenerateTokens(election: Election): boolean {
    return election.status === "DRAFT";
  }
};
