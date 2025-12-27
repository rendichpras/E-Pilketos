import { db } from "../../db/client";
import { votingRepository, resultsRepository } from "./repository";
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from "../../core/errors";

export const votingService = {
  async getCandidates(electionId: string) {
    const now = new Date();
    const election = await votingRepository.findElection(electionId);

    const isInactive =
      !election ||
      election.status !== "ACTIVE" ||
      !(election.startAt <= now && now <= election.endAt);

    if (isInactive) {
      throw new BadRequestError("Pemilihan tidak aktif atau di luar jadwal", "ELECTION_INACTIVE");
    }

    const candidates = await votingRepository.findActiveCandidates(electionId);
    return { election, candidates };
  },

  async vote(tokenId: string, electionId: string, sessionToken: string, candidatePairId: string) {
    const now = new Date();
    const election = await votingRepository.findElection(electionId);

    const isInactive =
      !election ||
      election.status !== "ACTIVE" ||
      !(election.startAt <= now && now <= election.endAt);

    if (isInactive) {
      throw new BadRequestError("Pemilihan tidak aktif atau di luar jadwal", "ELECTION_INACTIVE");
    }

    const isValidCandidate = await votingRepository.validateCandidate(candidatePairId, electionId);
    if (!isValidCandidate) {
      throw new BadRequestError("Pasangan calon tidak valid", "CANDIDATE_INVALID");
    }

    return db.transaction(async () => {
      const tokenConsumed = await votingRepository.consumeToken(tokenId, electionId);
      if (!tokenConsumed) {
        await votingRepository.deleteVoterSession(sessionToken);
        throw new ConflictError("Token sudah digunakan", "TOKEN_USED");
      }

      await votingRepository.recordVote(electionId, candidatePairId);
      await votingRepository.deleteVoterSession(sessionToken);

      return { success: true };
    });
  }
};

export const resultsService = {
  async getAdminResults(electionId: string) {
    const data = await resultsRepository.getResults(electionId);
    if (!data) {
      throw new NotFoundError("Election");
    }
    return data;
  },

  async getPublicResults(electionSlug?: string) {
    let election;

    if (electionSlug) {
      election = await resultsRepository.findElectionBySlug(electionSlug);
    } else {
      election = await resultsRepository.findActiveElection();
      if (!election) {
        election = await resultsRepository.findLatestPublicElection();
      }
    }

    if (!election) {
      return { election: null, totalVotes: 0, results: [] };
    }

    if (!election.isResultPublic) {
      throw new ForbiddenError("Hasil belum dipublikasikan");
    }

    const data = await resultsRepository.getResults(election.id);
    if (!data) {
      throw new NotFoundError("Election");
    }

    return {
      election: data.election,
      totalVotes: data.totalVotes,
      results: data.results
    };
  }
};
