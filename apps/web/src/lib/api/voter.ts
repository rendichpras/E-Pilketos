import type {
  VoterLoginDto,
  VoterLoginResponse,
  VoterCandidatesResponse,
  VoteDto,
  VoteResponse
} from "@e-pilketos/types";
import { apiClient } from "./client";

export const voterApi = {
  login(token: string): Promise<VoterLoginResponse> {
    const payload: VoterLoginDto = { token };
    return apiClient.post<VoterLoginResponse>("/auth/token-login", payload);
  },

  getCandidates(): Promise<VoterCandidatesResponse> {
    return apiClient.get<VoterCandidatesResponse>("/voter/candidates");
  },

  vote(candidatePairId: string): Promise<VoteResponse> {
    const payload: VoteDto = { candidatePairId };
    return apiClient.post<VoteResponse>("/voter/vote", payload);
  }
};
