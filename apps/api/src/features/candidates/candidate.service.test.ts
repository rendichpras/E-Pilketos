import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./repository", () => ({
  candidateRepository: {
    findByElection: vi.fn(),
    findById: vi.fn(),
    findActiveByElection: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  electionForCandidate: {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findActive: vi.fn()
  },
  logCandidateAudit: vi.fn()
}));

import { candidateService } from "./service";
import { candidateRepository, electionForCandidate } from "./repository";
import { NotFoundError, BadRequestError, ConflictError } from "../../core/errors";

describe("candidateService", () => {
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

  const mockCandidate = {
    id: "candidate-123",
    electionId: "election-123",
    number: 1,
    shortName: "RINA-BUDI",
    ketuaName: "Rina",
    ketuaClass: "XII IPA 1",
    wakilName: "Budi",
    wakilClass: "XI IPS 2",
    photoUrl: null,
    vision: null,
    mission: null,
    programs: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe("getByElection", () => {
    it("returns election with candidates", async () => {
      vi.mocked(electionForCandidate.findById).mockResolvedValue(mockElection);
      vi.mocked(candidateRepository.findByElection).mockResolvedValue([mockCandidate]);

      const result = await candidateService.getByElection("election-123");

      expect(result.election.id).toBe("election-123");
      expect(result.candidates).toHaveLength(1);
    });

    it("throws NotFoundError for non-existent election", async () => {
      vi.mocked(electionForCandidate.findById).mockResolvedValue(null as any);

      await expect(candidateService.getByElection("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("create", () => {
    it("creates candidate for DRAFT election", async () => {
      vi.mocked(electionForCandidate.findById).mockResolvedValue(mockElection);
      vi.mocked(candidateRepository.create).mockResolvedValue(mockCandidate);

      const result = await candidateService.create(
        {
          electionId: "election-123",
          number: 1,
          shortName: "RINA-BUDI",
          ketuaName: "Rina",
          ketuaClass: "XII IPA 1",
          wakilName: "Budi",
          wakilClass: "XI IPS 2"
        },
        "admin-123"
      );

      expect(result.id).toBe("candidate-123");
    });

    it("throws BadRequestError for non-DRAFT election", async () => {
      const activeElection = { ...mockElection, status: "ACTIVE" as const };
      vi.mocked(electionForCandidate.findById).mockResolvedValue(activeElection);

      await expect(
        candidateService.create(
          {
            electionId: "election-123",
            number: 1,
            shortName: "TEST",
            ketuaName: "A",
            ketuaClass: "B",
            wakilName: "C",
            wakilClass: "D"
          },
          "admin-123"
        )
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("update", () => {
    it("updates candidate for DRAFT election", async () => {
      vi.mocked(candidateRepository.findById).mockResolvedValue(mockCandidate);
      vi.mocked(electionForCandidate.findById).mockResolvedValue(mockElection);
      vi.mocked(candidateRepository.update).mockResolvedValue({
        ...mockCandidate,
        shortName: "UPDATED"
      });

      const result = await candidateService.update(
        "candidate-123",
        { shortName: "UPDATED" },
        "admin-123"
      );

      expect(result?.shortName).toBe("UPDATED");
    });

    it("throws NotFoundError for non-existent candidate", async () => {
      vi.mocked(candidateRepository.findById).mockResolvedValue(null as any);

      await expect(
        candidateService.update("nonexistent", { shortName: "TEST" }, "admin-123")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("deletes candidate for DRAFT election", async () => {
      vi.mocked(candidateRepository.findById).mockResolvedValue(mockCandidate);
      vi.mocked(electionForCandidate.findById).mockResolvedValue(mockElection);
      vi.mocked(candidateRepository.delete).mockResolvedValue(undefined);

      const result = await candidateService.delete("candidate-123", "admin-123");

      expect(result.success).toBe(true);
    });

    it("throws BadRequestError for non-DRAFT election", async () => {
      const activeElection = { ...mockElection, status: "ACTIVE" as const };
      vi.mocked(candidateRepository.findById).mockResolvedValue(mockCandidate);
      vi.mocked(electionForCandidate.findById).mockResolvedValue(activeElection);

      await expect(candidateService.delete("candidate-123", "admin-123")).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe("getPublicCandidates", () => {
    it("returns candidates for active election", async () => {
      const activeElection = { ...mockElection, status: "ACTIVE" as const };
      vi.mocked(electionForCandidate.findActive).mockResolvedValue(activeElection);
      vi.mocked(candidateRepository.findActiveByElection).mockResolvedValue([mockCandidate]);

      const result = await candidateService.getPublicCandidates();

      expect(result.election?.status).toBe("ACTIVE");
      expect(result.candidates).toHaveLength(1);
    });

    it("returns empty when no active election", async () => {
      vi.mocked(electionForCandidate.findActive).mockResolvedValue(null as any);

      const result = await candidateService.getPublicCandidates();

      expect(result.election).toBeNull();
      expect(result.candidates).toHaveLength(0);
    });

    it("finds election by slug when provided", async () => {
      vi.mocked(electionForCandidate.findBySlug).mockResolvedValue(mockElection);
      vi.mocked(candidateRepository.findActiveByElection).mockResolvedValue([mockCandidate]);

      await candidateService.getPublicCandidates("pilketos-2024");

      expect(electionForCandidate.findBySlug).toHaveBeenCalledWith("pilketos-2024");
    });
  });
});
