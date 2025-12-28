import type {
  AdminLoginDto,
  AdminLoginResponse,
  AdminMeResponse,
  AdminResultsResponse,
  AdminTokensListResponse,
  CandidatePair,
  CreateCandidateDto,
  CreateElectionDto,
  Election,
  GenerateTokensDto,
  Token,
  TokenGenerateResponse,
  UpdateCandidateDto,
  UpdateElectionDto
} from "@e-pilketos/types";
import { apiClient } from "./client";

export const adminApi = {
  login(dto: AdminLoginDto): Promise<AdminLoginResponse> {
    return apiClient.post<AdminLoginResponse>("/admin/auth/login", dto);
  },

  logout(): Promise<{ success: true } | unknown> {
    return apiClient.post("/admin/auth/logout", {});
  },

  me(): Promise<AdminMeResponse> {
    return apiClient.get<AdminMeResponse>("/admin/auth/me");
  },

  elections: {
    list(): Promise<Election[]> {
      return apiClient.get<Election[]>("/admin/elections");
    },

    getById(id: string): Promise<Election> {
      return apiClient.get<Election>(`/admin/elections/${id}`);
    },

    create(dto: CreateElectionDto): Promise<Election> {
      return apiClient.post<Election>("/admin/elections", dto);
    },

    update(id: string, dto: UpdateElectionDto): Promise<Election> {
      return apiClient.put<Election>(`/admin/elections/${id}`, dto);
    },

    activate(id: string): Promise<Election> {
      return apiClient.post<Election>(`/admin/elections/${id}/activate`, {});
    },

    close(id: string): Promise<Election> {
      return apiClient.post<Election>(`/admin/elections/${id}/close`, {});
    },

    archive(id: string): Promise<Election> {
      return apiClient.post<Election>(`/admin/elections/${id}/archive`, {});
    },

    publishResults(id: string): Promise<Election> {
      return apiClient.post<Election>(`/admin/elections/${id}/publish-results`, {});
    },

    hideResults(id: string): Promise<Election> {
      return apiClient.post<Election>(`/admin/elections/${id}/hide-results`, {});
    }
  },

  candidates: {
    listByElection(
      electionId: string
    ): Promise<{ election: Election; candidates: CandidatePair[] }> {
      return apiClient.get<{ election: Election; candidates: CandidatePair[] }>(
        `/admin/candidates/election/${electionId}`
      );
    },

    create(electionId: string, dto: CreateCandidateDto): Promise<CandidatePair> {
      return apiClient.post<CandidatePair>(`/admin/candidates/election/${electionId}`, dto);
    },

    update(id: string, dto: UpdateCandidateDto): Promise<CandidatePair> {
      return apiClient.put<CandidatePair>(`/admin/candidates/${id}`, dto);
    },

    remove(id: string): Promise<unknown> {
      return apiClient.delete(`/admin/candidates/${id}`);
    }
  },

  tokens: {
    generate(electionId: string, dto: GenerateTokensDto): Promise<TokenGenerateResponse> {
      return apiClient.post<TokenGenerateResponse>(`/admin/tokens/generate/${electionId}`, dto);
    },

    list(
      electionId: string,
      query?: {
        page?: number;
        limit?: number;
        status?: "UNUSED" | "USED" | "INVALIDATED";
        q?: string;
      }
    ): Promise<AdminTokensListResponse> {
      const qs = new URLSearchParams();
      if (query?.page) qs.set("page", String(query.page));
      if (query?.limit) qs.set("limit", String(query.limit));
      if (query?.status) qs.set("status", query.status);
      if (query?.q) qs.set("q", query.q);

      const suffix = qs.toString();
      return apiClient.get<AdminTokensListResponse>(
        `/admin/tokens/${electionId}${suffix ? `?${suffix}` : ""}`
      );
    },

    invalidate(tokenId: string): Promise<Token> {
      return apiClient.post<Token>(`/admin/tokens/invalidate/${tokenId}`, {});
    }
  },

  results: {
    getAdminResults(electionId: string): Promise<AdminResultsResponse> {
      return apiClient.get<AdminResultsResponse>(`/admin/results/${electionId}`);
    }
  }
};
