import {
  tokenRepository,
  electionForToken,
  logTokenAudit,
  type ListTokensQuery
} from "./repository";
import { NotFoundError, BadRequestError } from "../../core/errors";

export const tokenService = {
  async generate(
    electionId: string,
    count: number,
    batchLabel: string | undefined,
    adminId: string
  ) {
    const election = await electionForToken.findById(electionId);
    if (!election) {
      throw new NotFoundError("Election");
    }

    if (election.status !== "DRAFT") {
      throw new BadRequestError("Token hanya bisa dibuat saat election masih DRAFT");
    }

    const createdCount = await tokenRepository.generate(electionId, count, batchLabel);

    await logTokenAudit(adminId, electionId, "GENERATE_TOKENS", {
      count,
      batchLabel: batchLabel ?? null
    });

    return {
      electionId,
      createdCount,
      batchLabel: batchLabel ?? null
    };
  },

  async list(electionId: string, query: ListTokensQuery) {
    const election = await electionForToken.findById(electionId);
    if (!election) {
      throw new NotFoundError("Election");
    }

    const { tokens, total } = await tokenRepository.findByElection(electionId, query);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      election,
      tokens,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages
      }
    };
  },

  async invalidate(id: string, adminId: string) {
    const current = await tokenRepository.findById(id);
    if (!current) {
      throw new NotFoundError("Token");
    }

    if (current.status === "USED") {
      throw new BadRequestError("Tidak bisa invalidate token yang sudah digunakan");
    }

    const election = await electionForToken.findById(current.electionId);
    if (!election) {
      throw new NotFoundError("Election");
    }

    if (election.status !== "DRAFT") {
      throw new BadRequestError("Token hanya bisa di-invalidate saat election masih DRAFT");
    }

    const updated = await tokenRepository.invalidate(id);

    await logTokenAudit(adminId, current.electionId, "INVALIDATE_TOKEN", {
      tokenId: id
    });

    return updated;
  }
};
