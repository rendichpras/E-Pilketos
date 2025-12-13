export type ElectionStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED";
export type TokenStatus = "UNUSED" | "USED" | "INVALIDATED";
export type AdminRole = "SUPER_ADMIN" | "COMMITTEE";

export interface Election {
  id: string;
  slug: string;
  name: string;
  description: string;
  startAt: string;
  endAt: string;
  status: ElectionStatus;
  isResultPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CandidatePair {
  id: string;
  electionId: string;
  number: number;
  shortName: string;
  ketuaName: string;
  ketuaClass: string;
  wakilName: string;
  wakilClass: string;
  photoUrl: string | null;
  vision: string | null;
  mission: string | null;
  programs: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Token {
  id: string;
  electionId: string;
  token: string;
  status: TokenStatus;
  generatedBatch: string | null;
  usedAt: string | null;
  invalidatedAt: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  role: AdminRole;
}

export interface PublicActiveElectionResponse {
  activeElection: Election | null;
}

export interface PublicCandidatesResponse {
  election: Election | null;
  candidates: CandidatePair[];
}

export interface AdminTokensListResponse {
  election: Election;
  tokens: Token[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface AdminResultsSummary {
  totalTokens: number;
  usedTokens: number;
  unusedTokens: number;
  invalidTokens: number;
  totalVotes: number;
}

export interface AdminResultsCandidateRow {
  candidateId: string;
  number: number;
  shortName: string;
  ketuaName: string;
  wakilName: string;
  totalVotes: number;
}

export interface AdminResultsResponse {
  election: Election;
  summary: AdminResultsSummary;
  candidates: AdminResultsCandidateRow[];
}

export interface PublicResultsSummary {
  totalVotes: number;
}

export interface PublicResultsCandidateRow {
  candidateId: string;
  number: number;
  shortName: string;
  ketuaName: string;
  wakilName: string;
  totalVotes: number;
}

export interface PublicResultsResponse {
  election: Election | null;
  summary: PublicResultsSummary | null;
  candidates: PublicResultsCandidateRow[];
}
