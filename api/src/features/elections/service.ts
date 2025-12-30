import { db } from "../../db/client";
import { elections } from "../../db/schema";
import { and, eq, ne } from "drizzle-orm";
import { electionRepository, type CreateElectionData, type UpdateElectionData } from "./repository";
import { NotFoundError, BadRequestError, handlePgError } from "../../core/errors";
import { logAudit } from "../../shared/audit";
import { AuditAction } from "../../shared/constants/audit-actions";

export const electionService = {
  async getAll() {
    return electionRepository.findAll();
  },

  async getById(id: string) {
    const election = await electionRepository.findById(id);
    if (!election) {
      throw new NotFoundError("Election");
    }
    return election;
  },

  async create(data: CreateElectionData, adminId: string) {
    const startAt = data.startAt;
    const endAt = data.endAt;

    if (!(startAt < endAt)) {
      throw new BadRequestError("Waktu mulai harus sebelum waktu selesai");
    }

    try {
      const election = await electionRepository.create(data);

      await logAudit(adminId, election.id, AuditAction.CREATE_ELECTION, {
        slug: election.slug
      });

      return election;
    } catch (e: unknown) {
      handlePgError(e, {
        resourceName: "Election",
        constraintMessages: {
          elections_slug_unique: "Slug sudah digunakan"
        }
      });
    }
  },

  async update(
    id: string,
    data: UpdateElectionData & { isResultPublic?: boolean },
    adminId: string
  ) {
    const current = await electionRepository.findById(id);
    if (!current) {
      throw new NotFoundError("Election");
    }

    if (current.status !== "DRAFT" && (data.startAt || data.endAt)) {
      throw new BadRequestError("Jadwal pemilihan tidak bisa diubah setelah ACTIVE/CLOSED");
    }

    if (typeof data.isResultPublic !== "undefined") {
      throw new BadRequestError("Gunakan endpoint publish/hide hasil, bukan PUT election.");
    }

    const startAt = current.status === "DRAFT" && data.startAt ? data.startAt : current.startAt;
    const endAt = current.status === "DRAFT" && data.endAt ? data.endAt : current.endAt;

    if (!(startAt < endAt)) {
      throw new BadRequestError("Waktu mulai harus sebelum waktu selesai");
    }

    const updated = await electionRepository.update(id, {
      name: data.name,
      description: data.description,
      startAt: current.status === "DRAFT" ? data.startAt : undefined,
      endAt: current.status === "DRAFT" ? data.endAt : undefined
    });

    await logAudit(adminId, id, AuditAction.UPDATE_ELECTION, {
      fields: Object.keys(data)
    });

    return updated;
  },

  async activate(id: string, adminId: string) {
    const target = await electionRepository.findById(id);
    if (!target) {
      throw new NotFoundError("Election");
    }

    if (target.status !== "DRAFT") {
      throw new BadRequestError("Hanya election DRAFT yang bisa diaktifkan");
    }

    const now = new Date();
    if (!(target.startAt <= now && now <= target.endAt)) {
      throw new BadRequestError("Tidak bisa mengaktifkan election di luar jendela waktu");
    }

    try {
      await db.transaction(async (tx) => {
        await tx
          .update(elections)
          .set({ status: "CLOSED", updatedAt: new Date() })
          .where(and(eq(elections.status, "ACTIVE"), ne(elections.id, id)));

        await tx
          .update(elections)
          .set({ status: "ACTIVE", updatedAt: new Date() })
          .where(eq(elections.id, id));
      });

      await logAudit(adminId, id, AuditAction.ACTIVATE_ELECTION, {
        slug: target.slug
      });

      return electionRepository.findById(id);
    } catch (e: unknown) {
      handlePgError(e, {
        resourceName: "Election",
        constraintMessages: {
          elections_single_active_unique: "Masih ada pemilihan lain yang ACTIVE. Coba lagi."
        }
      });
    }
  },

  async close(id: string, adminId: string) {
    const target = await electionRepository.findById(id);
    if (!target) {
      throw new NotFoundError("Election");
    }

    if (target.status !== "ACTIVE") {
      throw new BadRequestError("Hanya election ACTIVE yang bisa ditutup");
    }

    const updated = await electionRepository.updateStatus(id, "CLOSED");

    await logAudit(adminId, id, AuditAction.CLOSE_ELECTION, {
      slug: target.slug
    });

    return updated;
  },

  async archive(id: string, adminId: string) {
    const target = await electionRepository.findById(id);
    if (!target) {
      throw new NotFoundError("Election");
    }

    if (target.status !== "CLOSED") {
      throw new BadRequestError("Hanya election CLOSED yang bisa di-archive");
    }

    const updated = await electionRepository.updateStatus(id, "ARCHIVED");

    await logAudit(adminId, id, AuditAction.ARCHIVE_ELECTION, {
      slug: target.slug
    });

    return updated;
  },

  async publishResults(id: string, adminId: string) {
    const target = await electionRepository.findById(id);
    if (!target) {
      throw new NotFoundError("Election");
    }

    if (target.status !== "CLOSED") {
      throw new BadRequestError("Hasil hanya bisa dipublish setelah election CLOSED");
    }

    const updated = await electionRepository.setResultPublic(id, true);

    await logAudit(adminId, id, AuditAction.PUBLISH_RESULTS, {
      slug: target.slug
    });

    return updated;
  },

  async hideResults(id: string, adminId: string) {
    const target = await electionRepository.findById(id);
    if (!target) {
      throw new NotFoundError("Election");
    }

    if (target.status !== "CLOSED") {
      throw new BadRequestError("Hasil hanya bisa diubah setelah election CLOSED");
    }

    const updated = await electionRepository.setResultPublic(id, false);

    await logAudit(adminId, id, AuditAction.HIDE_RESULTS, {
      slug: target.slug
    });

    return updated;
  },

  async getActive() {
    return electionRepository.findActive();
  },

  async getLatest() {
    return electionRepository.findLatest();
  }
};
