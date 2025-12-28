import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./repository", () => ({
  tokenRepository: {
    findById: vi.fn(),
    findByElection: vi.fn(),
    generate: vi.fn(),
    invalidate: vi.fn()
  },
  electionForToken: {
    findById: vi.fn()
  },
  logTokenAudit: vi.fn()
}));

import { tokenService } from "./service";
import { tokenRepository, electionForToken } from "./repository";
import { NotFoundError, BadRequestError } from "../../core/errors";

describe("tokenService", () => {
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
    status: "DRAFT" as const,
    isResultPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockToken = {
    id: "token-123",
    electionId: "election-123",
    token: "ABCD-1234",
    status: "UNUSED" as const,
    generatedBatch: "batch-1",
    usedAt: null,
    invalidatedAt: null,
    createdAt: new Date()
  };

  describe("generate", () => {
    it("generates tokens for DRAFT election", async () => {
      vi.mocked(electionForToken.findById).mockResolvedValue(mockElection);
      vi.mocked(tokenRepository.generate).mockResolvedValue(100);

      const result = await tokenService.generate("election-123", 100, "batch-1", "admin-123");

      expect(result.createdCount).toBe(100);
      expect(result.batchLabel).toBe("batch-1");
    });

    it("throws NotFoundError for non-existent election", async () => {
      vi.mocked(electionForToken.findById).mockResolvedValue(null as any);

      await expect(
        tokenService.generate("nonexistent", 100, undefined, "admin-123")
      ).rejects.toThrow(NotFoundError);
    });

    it("throws BadRequestError for non-DRAFT election", async () => {
      const activeElection = { ...mockElection, status: "ACTIVE" as const };
      vi.mocked(electionForToken.findById).mockResolvedValue(activeElection);

      await expect(
        tokenService.generate("election-123", 100, undefined, "admin-123")
      ).rejects.toThrow(BadRequestError);
    });

    it("handles undefined batch label", async () => {
      vi.mocked(electionForToken.findById).mockResolvedValue(mockElection);
      vi.mocked(tokenRepository.generate).mockResolvedValue(50);

      const result = await tokenService.generate("election-123", 50, undefined, "admin-123");

      expect(result.batchLabel).toBeNull();
    });
  });

  describe("list", () => {
    it("returns tokens with pagination", async () => {
      vi.mocked(electionForToken.findById).mockResolvedValue(mockElection);
      vi.mocked(tokenRepository.findByElection).mockResolvedValue({
        tokens: [mockToken],
        total: 1
      });

      const result = await tokenService.list("election-123", { page: 1, limit: 20 });

      expect(result.election.id).toBe("election-123");
      expect(result.tokens).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it("throws NotFoundError for non-existent election", async () => {
      vi.mocked(electionForToken.findById).mockResolvedValue(null as any);

      await expect(tokenService.list("nonexistent", { page: 1, limit: 20 })).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("invalidate", () => {
    it("invalidates unused token", async () => {
      vi.mocked(tokenRepository.findById).mockResolvedValue(mockToken);
      vi.mocked(electionForToken.findById).mockResolvedValue(mockElection);
      vi.mocked(tokenRepository.invalidate).mockResolvedValue({
        ...mockToken,
        status: "INVALIDATED"
      });

      const result = await tokenService.invalidate("token-123", "admin-123");

      expect(result?.status).toBe("INVALIDATED");
    });

    it("throws NotFoundError for non-existent token", async () => {
      vi.mocked(tokenRepository.findById).mockResolvedValue(null as any);

      await expect(tokenService.invalidate("nonexistent", "admin-123")).rejects.toThrow(
        NotFoundError
      );
    });

    it("throws BadRequestError for already used token", async () => {
      const usedToken = { ...mockToken, status: "USED" as const };
      vi.mocked(tokenRepository.findById).mockResolvedValue(usedToken);

      await expect(tokenService.invalidate("token-123", "admin-123")).rejects.toThrow(
        BadRequestError
      );
    });

    it("throws BadRequestError for non-DRAFT election", async () => {
      const activeElection = { ...mockElection, status: "ACTIVE" as const };
      vi.mocked(tokenRepository.findById).mockResolvedValue(mockToken);
      vi.mocked(electionForToken.findById).mockResolvedValue(activeElection);

      await expect(tokenService.invalidate("token-123", "admin-123")).rejects.toThrow(
        BadRequestError
      );
    });
  });
});
