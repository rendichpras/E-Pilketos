import { voterRepository } from "./voter.repository";
import { UnauthorizedError, BadRequestError, ConflictError } from "../../../core/errors";
import { addSeconds, createSessionToken } from "../../../utils/session";
import { env } from "../../../env";

function normalizeToken(input: string): string | null {
  const cleaned = input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (cleaned.length !== 8) return null;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
}

export interface VoterLoginResult {
  electionId: string;
  electionSlug: string;
  electionName: string;
  sessionToken: string;
  expiresAt: Date;
}

export const voterAuthService = {
  async login(rawToken: string): Promise<VoterLoginResult> {
    const normalizedToken = normalizeToken(rawToken);
    if (!normalizedToken) {
      throw new UnauthorizedError("Token tidak valid");
    }

    const now = new Date();
    const rows = await voterRepository.findTokenWithElection(normalizedToken);

    if (rows.length === 0) {
      throw new UnauthorizedError("Token tidak valid");
    }

    const unusedRows = rows.filter((r) => r.token.status === "UNUSED");
    if (unusedRows.length === 0) {
      throw new ConflictError("Token sudah digunakan", "TOKEN_USED");
    }

    const activeUnused = unusedRows.filter((r) => {
      const e = r.election;
      return e.status === "ACTIVE" && e.startAt <= now && now <= e.endAt;
    });

    if (activeUnused.length === 0) {
      throw new BadRequestError("Pemilihan tidak aktif atau di luar jadwal", "ELECTION_INACTIVE");
    }

    if (activeUnused.length > 1) {
      throw new ConflictError(
        "Token terdeteksi untuk lebih dari satu pemilihan yang aktif. Hubungi panitia.",
        "TOKEN_AMBIGUOUS"
      );
    }

    const row = activeUnused[0];
    const sessionToken = createSessionToken();
    const expiresAt = addSeconds(now, env.VOTER_SESSION_TTL_SEC);

    await voterRepository.createSession({
      tokenId: row.token.id,
      electionId: row.election.id,
      sessionToken,
      expiresAt
    });

    return {
      electionId: row.election.id,
      electionSlug: row.election.slug,
      electionName: row.election.name,
      sessionToken,
      expiresAt
    };
  },

  async logout(sessionToken: string): Promise<void> {
    await voterRepository.deleteSession(sessionToken);
  }
};
