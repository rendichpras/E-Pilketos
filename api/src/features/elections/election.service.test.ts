import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./repository", () => ({
  electionRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findActive: vi.fn(),
    findLatest: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    setResultPublic: vi.fn()
  }
}));

vi.mock("../../db/client", () => ({
  db: {
    transaction: vi.fn((fn) =>
      fn({ update: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis(), where: vi.fn() })
    )
  }
}));

vi.mock("../../shared/audit", () => ({
  logAudit: vi.fn()
}));

import { electionService } from "./service";
import { electionRepository } from "./repository";
import { NotFoundError, BadRequestError, ConflictError as _ConflictError } from "../../core/errors";

describe("electionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockElection = {
    id: "election-123",
    slug: "pilketos-2024",
    name: "Pilketos 2024",
    description: "Pemilihan Ketua OSIS",
    startAt: new Date("2024-06-15T08:00:00Z"),
    endAt: new Date("2024-06-15T16:00:00Z"),
    status: "DRAFT" as const,
    isResultPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe("getAll", () => {
    it("returns all elections", async () => {
      vi.mocked(electionRepository.findAll).mockResolvedValue([mockElection]);

      const result = await electionService.getAll();

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("pilketos-2024");
    });
  });

  describe("getById", () => {
    it("returns election by id", async () => {
      vi.mocked(electionRepository.findById).mockResolvedValue(mockElection);

      const result = await electionService.getById("election-123");

      expect(result.id).toBe("election-123");
    });

    it("throws NotFoundError for non-existent election", async () => {
      vi.mocked(electionRepository.findById).mockResolvedValue(null as any);

      await expect(electionService.getById("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("create", () => {
    it("creates election with valid data", async () => {
      vi.mocked(electionRepository.create).mockResolvedValue(mockElection);

      const result = await electionService.create(
        {
          slug: "pilketos-2024",
          name: "Pilketos 2024",
          description: "Desc",
          startAt: new Date("2024-06-15T08:00:00Z"),
          endAt: new Date("2024-06-15T16:00:00Z")
        },
        "admin-123"
      );

      expect(result.slug).toBe("pilketos-2024");
      expect(electionRepository.create).toHaveBeenCalled();
    });

    it("throws BadRequestError when startAt >= endAt", async () => {
      await expect(
        electionService.create(
          {
            slug: "test",
            name: "Test",
            description: "Desc",
            startAt: new Date("2024-06-15T16:00:00Z"),
            endAt: new Date("2024-06-15T08:00:00Z")
          },
          "admin-123"
        )
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("close", () => {
    it("closes active election", async () => {
      const activeElection = { ...mockElection, status: "ACTIVE" as const };
      vi.mocked(electionRepository.findById).mockResolvedValue(activeElection);
      vi.mocked(electionRepository.updateStatus).mockResolvedValue({
        ...activeElection,
        status: "CLOSED"
      });

      const result = await electionService.close("election-123", "admin-123");

      expect(result?.status).toBe("CLOSED");
      expect(electionRepository.updateStatus).toHaveBeenCalledWith("election-123", "CLOSED");
    });

    it("throws BadRequestError when closing non-active election", async () => {
      vi.mocked(electionRepository.findById).mockResolvedValue(mockElection);

      await expect(electionService.close("election-123", "admin-123")).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe("publishResults", () => {
    it("publishes results for closed election", async () => {
      const closedElection = { ...mockElection, status: "CLOSED" as const };
      vi.mocked(electionRepository.findById).mockResolvedValue(closedElection);
      vi.mocked(electionRepository.setResultPublic).mockResolvedValue({
        ...closedElection,
        isResultPublic: true
      });

      const result = await electionService.publishResults("election-123", "admin-123");

      expect(result?.isResultPublic).toBe(true);
    });

    it("throws BadRequestError when publishing for non-closed election", async () => {
      vi.mocked(electionRepository.findById).mockResolvedValue(mockElection);

      await expect(electionService.publishResults("election-123", "admin-123")).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe("getActive", () => {
    it("returns active election", async () => {
      const activeElection = { ...mockElection, status: "ACTIVE" as const };
      vi.mocked(electionRepository.findActive).mockResolvedValue(activeElection);

      const result = await electionService.getActive();

      expect(result?.status).toBe("ACTIVE");
    });

    it("returns null when no active election", async () => {
      vi.mocked(electionRepository.findActive).mockResolvedValue(null as any);

      const result = await electionService.getActive();

      expect(result).toBeNull();
    });
  });
});
