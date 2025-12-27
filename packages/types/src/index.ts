export type ElectionStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED";
export type TokenStatus = "UNUSED" | "USED" | "INVALIDATED";
export type AdminRole = "SUPER_ADMIN" | "COMMITTEE";

export const ELECTION_STATUS = {
    DRAFT: "DRAFT",
    ACTIVE: "ACTIVE",
    CLOSED: "CLOSED",
    ARCHIVED: "ARCHIVED",
} as const;

export const TOKEN_STATUS = {
    UNUSED: "UNUSED",
    USED: "USED",
    INVALIDATED: "INVALIDATED",
} as const;

export const ADMIN_ROLE = {
    SUPER_ADMIN: "SUPER_ADMIN",
    COMMITTEE: "COMMITTEE",
} as const;

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

export interface Admin {
    id: string;
    username: string;
    role: AdminRole;
    createdAt: string;
    updatedAt: string;
}

export type AdminUser = Admin;

export interface AdminSession {
    adminId: string;
    username: string;
    role: AdminRole;
}

export interface VoterSession {
    tokenId: string;
    electionId: string;
}

export interface Vote {
    id: string;
    electionId: string;
    candidatePairId: string;
    createdAt: string;
}

export interface AuditLog {
    id: string;
    adminId: string;
    electionId: string | null;
    action: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
}

export interface ApiSuccessResponse<T> {
    ok: true;
    data: T;
}

export interface ApiErrorResponse {
    ok: false;
    error: string;
    code?: string;
    details?: unknown;
    requestId?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedResponse<T> {
    ok: true;
    data: T[];
    pagination: Pagination;
}

export interface PublicActiveElectionResponse {
    activeElection: Election | null;
}

export interface PublicLatestElectionResponse {
    latestElection: Election | null;
}

export interface PublicCandidatesResponse {
    election: Election | null;
    candidates: CandidatePair[];
}

export interface VoterCandidatesResponse {
    election: Election;
    candidates: CandidatePair[];
}

export interface AdminTokensListResponse {
    election: Election;
    tokens: Token[];
    pagination: Pagination;
}

export interface TokenGenerateResponse {
    generated: number;
    batch: string;
}

export interface ResultsRow {
    candidate: CandidatePair;
    voteCount: number;
}

export interface TokenStats {
    used: number;
    unused: number;
    invalidated: number;
    total: number;
}

export interface AdminResultsResponse {
    election: Election;
    totalVotes: number;
    results: ResultsRow[];
    tokenStats: TokenStats;
}

export interface PublicResultsResponse {
    election: Election | null;
    totalVotes: number;
    results: ResultsRow[];
}

export interface AdminLoginResponse {
    admin: AdminSession;
}

export interface AdminMeResponse {
    admin: AdminSession;
}

export interface VoterLoginResponse {
    success: boolean;
}

export interface VoteResponse {
    success: boolean;
}

export interface CreateElectionDto {
    slug: string;
    name: string;
    description: string;
    startAt: string;
    endAt: string;
    isResultPublic?: boolean;
}

export interface UpdateElectionDto {
    name?: string;
    description?: string;
    startAt?: string;
    endAt?: string;
}

export interface CreateCandidateDto {
    number: number;
    shortName: string;
    ketuaName: string;
    ketuaClass: string;
    wakilName: string;
    wakilClass: string;
    photoUrl?: string | null;
    vision?: string | null;
    mission?: string | null;
    programs?: string | null;
    isActive?: boolean;
}

export interface UpdateCandidateDto {
    number?: number;
    shortName?: string;
    ketuaName?: string;
    ketuaClass?: string;
    wakilName?: string;
    wakilClass?: string;
    photoUrl?: string | null;
    vision?: string | null;
    mission?: string | null;
    programs?: string | null;
    isActive?: boolean;
}

export interface GenerateTokensDto {
    count: number;
    batch?: string;
}

export interface AdminLoginDto {
    username: string;
    password: string;
}

export interface VoterLoginDto {
    token: string;
}

export interface VoteDto {
    candidatePairId: string;
}
