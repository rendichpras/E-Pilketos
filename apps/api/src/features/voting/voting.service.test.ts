import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./repository", () => ({
  votingRepository: {
    findElection: vi.fn(),
    findActiveCandidates: vi.fn(),
    validateCandidate: vi.fn(),
    consumeToken: vi.fn(),
    recordVote: vi.fn(),
    deleteVoterSession: vi.fn()
  },
  resultsRepository: {
    getResults: vi.fn(),
    findElectionBySlug: vi.fn(),
    findActiveElection: vi.fn(),
    findLatestPublicElection: vi.fn()
  }
}));

vi.mock("../../db/client", () => ({
  db: {
    transaction: vi.fn((fn) => fn())
  }
}));

import { votingService, resultsService } from "./service";
import { votingRepository, resultsRepository } from "./repository";
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from "../../core/errors";

describe("votingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockElection = {
    id: "election-123",
    slug: "pilketos-2024",
    name: "Pilketos 2024",
    description: "Desc",
    startAt: new Date("2024-06-15T08:00:00Z"),
    endAt: new Date("2024-06-15T16:00:00Z"),
    status: "ACTIVE" as const,
    isResultPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCandidate = {
    id: "candidate-123",
    electionId: "election-123",
    number: 1,
    shortName: "RINA-BUDI",
    ketuaName: "Rina",
    ketuaClass: "XII",
    wakilName: "Budi",
    wakilClass: "XI",
    photoUrl: null,
    vision: null,
    mission: null,
    programs: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe("getCandidates", () => {
    it("returns candidates for active election", async () => {
      vi.mocked(votingRepository.findElection).mockResolvedValue(mockElection);
      vi.mocked(votingRepository.findActiveCandidates).mockResolvedValue([mockCandidate]);

      const result = await votingService.getCandidates("election-123");

      expect(result.election.status).toBe("ACTIVE");
      expect(result.candidates).toHaveLength(1);
    });

    it("throws BadRequestError for inactive election", async () => {
      const draftElection = { ...mockElection, status: "DRAFT" as const };
      vi.mocked(votingRepository.findElection).mockResolvedValue(draftElection);

      await expect(votingService.getCandidates("election-123")).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError for non-existent election", async () => {
      vi.mocked(votingRepository.findElection).mockResolvedValue(null as any);

      await expect(votingService.getCandidates("nonexistent")).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when outside time window", async () => {
      const futureElection = {
        ...mockElection,
        startAt: new Date("2024-06-16T08:00:00Z"),
        endAt: new Date("2024-06-16T16:00:00Z")
      };
      vi.mocked(votingRepository.findElection).mockResolvedValue(futureElection);

      await expect(votingService.getCandidates("election-123")).rejects.toThrow(BadRequestError);
    });
  });

  describe("vote", () => {
    it("successfully records vote", async () => {
      vi.mocked(votingRepository.findElection).mockResolvedValue(mockElection);
      vi.mocked(votingRepository.validateCandidate).mockResolvedValue(true);
      vi.mocked(votingRepository.consumeToken).mockResolvedValue(true);
      vi.mocked(votingRepository.recordVote).mockResolvedValue(undefined);
      vi.mocked(votingRepository.deleteVoterSession).mockResolvedValue(undefined);

      const result = await votingService.vote(
        "token-123",
        "election-123",
        "session-token",
        "candidate-123"
      );

      expect(result.success).toBe(true);
      expect(votingRepository.recordVote).toHaveBeenCalled();
    });

    it("throws BadRequestError for inactive election", async () => {
      vi.mocked(votingRepository.findElection).mockResolvedValue(null as any);

      await expect(
        votingService.vote("token-123", "election-123", "session-token", "candidate-123")
      ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError for invalid candidate", async () => {
      vi.mocked(votingRepository.findElection).mockResolvedValue(mockElection);
      vi.mocked(votingRepository.validateCandidate).mockResolvedValue(false);

      await expect(
        votingService.vote("token-123", "election-123", "session-token", "invalid-candidate")
      ).rejects.toThrow(BadRequestError);
    });

    it("throws ConflictError when token already used", async () => {
      vi.mocked(votingRepository.findElection).mockResolvedValue(mockElection);
      vi.mocked(votingRepository.validateCandidate).mockResolvedValue(true);
      vi.mocked(votingRepository.consumeToken).mockResolvedValue(false);
      vi.mocked(votingRepository.deleteVoterSession).mockResolvedValue(undefined);

      await expect(
        votingService.vote("token-123", "election-123", "session-token", "candidate-123")
      ).rejects.toThrow(ConflictError);
    });
  });
});

describe("resultsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockElection = {
    id: "election-123",
    slug: "pilketos-2024",
    name: "Pilketos 2024",
    description: "Desc",
    startAt: new Date(),
    endAt: new Date(),
    status: "CLOSED" as const,
    isResultPublic: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockResults = {
    election: mockElection,
    totalVotes: 100,
    results: [],
    tokenStats: { used: 100, unused: 50, invalidated: 0, total: 150 }
  };

  describe("getAdminResults", () => {
    it("returns results for election", async () => {
      vi.mocked(resultsRepository.getResults).mockResolvedValue(mockResults);

      const result = await resultsService.getAdminResults("election-123");

      expect(result.totalVotes).toBe(100);
    });

    it("throws NotFoundError for non-existent election", async () => {
      vi.mocked(resultsRepository.getResults).mockResolvedValue(null);

      await expect(resultsService.getAdminResults("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getPublicResults", () => {
    it("returns public results when published", async () => {
      vi.mocked(resultsRepository.findActiveElection).mockResolvedValue(mockElection);
      vi.mocked(resultsRepository.getResults).mockResolvedValue(mockResults);

      const result = await resultsService.getPublicResults();

      expect(result.totalVotes).toBe(100);
    });

    it("throws ForbiddenError when results not published", async () => {
      const unpublishedElection = { ...mockElection, isResultPublic: false };
      vi.mocked(resultsRepository.findActiveElection).mockResolvedValue(unpublishedElection);

      await expect(resultsService.getPublicResults()).rejects.toThrow(ForbiddenError);
    });

    it("returns empty when no election found", async () => {
      vi.mocked(resultsRepository.findActiveElection).mockResolvedValue(null as any);
      vi.mocked(resultsRepository.findLatestPublicElection).mockResolvedValue(null as any);

      const result = await resultsService.getPublicResults();

      expect(result.election).toBeNull();
      expect(result.totalVotes).toBe(0);
    });

    it("finds election by slug when provided", async () => {
      vi.mocked(resultsRepository.findElectionBySlug).mockResolvedValue(mockElection);
      vi.mocked(resultsRepository.getResults).mockResolvedValue(mockResults);

      await resultsService.getPublicResults("pilketos-2024");

      expect(resultsRepository.findElectionBySlug).toHaveBeenCalledWith("pilketos-2024");
    });
  });
});
