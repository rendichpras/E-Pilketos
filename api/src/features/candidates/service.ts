import {
  candidateRepository,
  type CreateCandidateData,
  type UpdateCandidateData
} from "./repository";
import { sharedElectionRepository } from "../../db/repositories/election.shared";
import { logAudit } from "../../shared/audit";
import { AuditAction } from "../../shared/constants/audit-actions";
import { NotFoundError, BadRequestError, ConflictError } from "../../core/errors";

export const candidateService = {
  async getByElection(electionId: string) {
    const election = await sharedElectionRepository.findById(electionId);
    if (!election) {
      throw new NotFoundError("Election");
    }
    const candidates = await candidateRepository.findByElection(electionId);
    return { election, candidates };
  },

  async create(data: CreateCandidateData, adminId: string) {
    const election = await sharedElectionRepository.findById(data.electionId);
    if (!election) {
      throw new NotFoundError("Election");
    }

    if (election.status !== "DRAFT") {
      throw new BadRequestError("Kandidat hanya bisa ditambah saat election masih DRAFT");
    }

    try {
      const candidate = await candidateRepository.create(data);

      await logAudit(adminId, data.electionId, AuditAction.CREATE_CANDIDATE, {
        candidateId: candidate.id,
        number: candidate.number
      });

      return candidate;
    } catch (e: unknown) {
      const pgErr = e as { code?: string; constraint?: string };
      if (
        pgErr?.code === "23505" &&
        pgErr?.constraint === "candidate_pairs_election_number_unique"
      ) {
        throw new ConflictError("Nomor pasangan sudah dipakai di pemilihan ini");
      }
      throw e;
    }
  },

  async update(id: string, data: UpdateCandidateData, adminId: string) {
    const current = await candidateRepository.findById(id);
    if (!current) {
      throw new NotFoundError("Candidate");
    }

    const election = await sharedElectionRepository.findById(current.electionId);
    if (!election) {
      throw new NotFoundError("Election");
    }

    if (election.status !== "DRAFT") {
      throw new BadRequestError("Kandidat hanya bisa diubah saat election masih DRAFT");
    }

    try {
      const updated = await candidateRepository.update(id, {
        number: data.number ?? current.number,
        shortName: data.shortName ?? current.shortName,
        ketuaName: data.ketuaName ?? current.ketuaName,
        ketuaClass: data.ketuaClass ?? current.ketuaClass,
        wakilName: data.wakilName ?? current.wakilName,
        wakilClass: data.wakilClass ?? current.wakilClass,
        photoUrl: data.photoUrl !== undefined ? data.photoUrl : current.photoUrl,
        vision: data.vision !== undefined ? data.vision : current.vision,
        mission: data.mission !== undefined ? data.mission : current.mission,
        programs: data.programs !== undefined ? data.programs : current.programs,
        isActive: data.isActive ?? current.isActive
      });

      await logAudit(adminId, current.electionId, AuditAction.UPDATE_CANDIDATE, {
        candidateId: id
      });

      return updated;
    } catch (e: unknown) {
      const pgErr = e as { code?: string; constraint?: string };
      if (
        pgErr?.code === "23505" &&
        pgErr?.constraint === "candidate_pairs_election_number_unique"
      ) {
        throw new ConflictError("Nomor pasangan sudah dipakai di pemilihan ini");
      }
      throw e;
    }
  },

  async delete(id: string, adminId: string) {
    const current = await candidateRepository.findById(id);
    if (!current) {
      throw new NotFoundError("Candidate");
    }

    const election = await sharedElectionRepository.findById(current.electionId);
    if (!election) {
      throw new NotFoundError("Election");
    }

    if (election.status !== "DRAFT") {
      throw new BadRequestError("Kandidat hanya bisa dihapus saat election masih DRAFT");
    }

    try {
      await candidateRepository.delete(id);
    } catch (e: unknown) {
      const pgErr = e as { code?: string };
      if (pgErr?.code === "23503") {
        throw new ConflictError("Tidak bisa menghapus kandidat karena sudah ada suara masuk");
      }
      throw e;
    }

    await logAudit(adminId, current.electionId, AuditAction.DELETE_CANDIDATE, {
      candidateId: id
    });

    return { success: true };
  },

  async getPublicCandidates(electionSlug?: string) {
    let election;

    if (electionSlug) {
      election = await sharedElectionRepository.findBySlug(electionSlug);
    } else {
      election = await sharedElectionRepository.findActive();
    }

    if (!election) {
      return { election: null, candidates: [] };
    }

    const candidates = await candidateRepository.findActiveByElection(election.id);
    return { election, candidates };
  }
};
