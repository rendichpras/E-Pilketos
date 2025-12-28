import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./voter.repository", () => ({
  voterRepository: {
    findTokenWithElection: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn()
  }
}));

vi.mock("../../../utils/session", () => ({
  createSessionToken: vi.fn(() => "mock-voter-session-token"),
  addSeconds: vi.fn((date, seconds) => new Date(date.getTime() + seconds * 1000))
}));

vi.mock("../../../env", () => ({
  env: {
    VOTER_SESSION_TTL_SEC: 7200
  }
}));

import { voterAuthService } from "./voter.service";
import { voterRepository } from "./voter.repository";
import { UnauthorizedError, BadRequestError, ConflictError } from "../../../core/errors";

describe("voterAuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("login", () => {
    const mockActiveElection = {
      id: "election-123",
      slug: "pilketos-2024",
      name: "Pilketos 2024",
      status: "ACTIVE" as const,
      startAt: new Date("2024-06-15T08:00:00Z"),
      endAt: new Date("2024-06-15T16:00:00Z"),
      description: "Desc",
      isResultPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockUnusedToken = {
      id: "token-123",
      token: "ABCD-1234",
      status: "UNUSED" as const,
      electionId: "election-123",
      generatedBatch: null,
      usedAt: null,
      invalidatedAt: null,
      createdAt: new Date()
    };

    it("successfully logs in with valid token", async () => {
      vi.mocked(voterRepository.findTokenWithElection).mockResolvedValue([
        { token: mockUnusedToken, election: mockActiveElection }
      ]);
      vi.mocked(voterRepository.createSession).mockResolvedValue(undefined);

      const result = await voterAuthService.login("ABCD-1234");

      expect(result.electionId).toBe("election-123");
      expect(result.electionSlug).toBe("pilketos-2024");
      expect(result.sessionToken).toBe("mock-voter-session-token");
      expect(voterRepository.createSession).toHaveBeenCalled();
    });

    it("normalizes token to uppercase", async () => {
      vi.mocked(voterRepository.findTokenWithElection).mockResolvedValue([
        { token: mockUnusedToken, election: mockActiveElection }
      ]);
      vi.mocked(voterRepository.createSession).mockResolvedValue(undefined);

      await voterAuthService.login("abcd-1234");

      expect(voterRepository.findTokenWithElection).toHaveBeenCalledWith("ABCD-1234");
    });

    it("throws UnauthorizedError for non-existent token", async () => {
      vi.mocked(voterRepository.findTokenWithElection).mockResolvedValue([]);

      await expect(voterAuthService.login("XXXX-9999")).rejects.toThrow(UnauthorizedError);
    });

    it("throws ConflictError for already used token", async () => {
      const usedToken = { ...mockUnusedToken, status: "USED" as const };
      vi.mocked(voterRepository.findTokenWithElection).mockResolvedValue([
        { token: usedToken, election: mockActiveElection }
      ]);

      await expect(voterAuthService.login("ABCD-1234")).rejects.toThrow(ConflictError);
      await expect(voterAuthService.login("ABCD-1234")).rejects.toThrow("Token sudah digunakan");
    });

    it("throws BadRequestError for inactive election", async () => {
      const inactiveElection = { ...mockActiveElection, status: "DRAFT" as const };
      vi.mocked(voterRepository.findTokenWithElection).mockResolvedValue([
        { token: mockUnusedToken, election: inactiveElection }
      ]);

      await expect(voterAuthService.login("ABCD-1234")).rejects.toThrow(BadRequestError);
      await expect(voterAuthService.login("ABCD-1234")).rejects.toThrow(
        "Pemilihan tidak aktif atau di luar jadwal"
      );
    });

    it("throws BadRequestError when outside election time window", async () => {
      const pastElection = {
        ...mockActiveElection,
        startAt: new Date("2024-06-14T08:00:00Z"),
        endAt: new Date("2024-06-14T16:00:00Z")
      };
      vi.mocked(voterRepository.findTokenWithElection).mockResolvedValue([
        { token: mockUnusedToken, election: pastElection }
      ]);

      await expect(voterAuthService.login("ABCD-1234")).rejects.toThrow(BadRequestError);
    });

    it("throws ConflictError when token matches multiple active elections", async () => {
      const election2 = { ...mockActiveElection, id: "election-456" };
      vi.mocked(voterRepository.findTokenWithElection).mockResolvedValue([
        { token: mockUnusedToken, election: mockActiveElection },
        { token: { ...mockUnusedToken, id: "token-456" }, election: election2 }
      ]);

      const error = await voterAuthService.login("ABCD-1234").catch((e) => e);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.code).toBe("TOKEN_AMBIGUOUS");
    });
  });

  describe("logout", () => {
    it("deletes session", async () => {
      vi.mocked(voterRepository.deleteSession).mockResolvedValue(undefined);

      await voterAuthService.logout("session-token");

      expect(voterRepository.deleteSession).toHaveBeenCalledWith("session-token");
    });
  });
});
