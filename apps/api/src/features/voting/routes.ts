import { Hono } from "hono";
import { deleteCookie } from "hono/cookie";
import type { AppEnv } from "../../app-env";
import { voterAuth } from "./voter-middleware";
import { adminAuth } from "../auth/admin/auth.middleware";
import { votingService, resultsService } from "./service";
import { success, created } from "../../core/response";
import { rateLimit, getClientIp, rateLimitConfig } from "../../core/middleware";
import { env as appEnv } from "../../env";
import { voteSchema } from "@e-pilketos/validators";
import { validateBody } from "../../core/validation";
import { isHttpError, UnauthorizedError } from "../../core/errors";
import { ERROR_CODES } from "@e-pilketos/types";

export const voterApp = new Hono<AppEnv>();
export const adminResultsApp = new Hono<AppEnv>();
export const publicResultsApp = new Hono<AppEnv>();

voterApp.use("/*", voterAuth);

voterApp.get("/candidates", async (c) => {
  const voter = c.get("voter");
  if (!voter) throw new UnauthorizedError("Tidak terautentikasi", ERROR_CODES.UNAUTHORIZED);

  const result = await votingService.getCandidates(voter.electionId);
  return success(c, result);
});

voterApp.post(
  "/vote",
  rateLimit({
    windowSec: appEnv.RATE_LIMIT_VOTE_WINDOW_SEC,
    max: appEnv.RATE_LIMIT_VOTE_MAX,
    prefix: rateLimitConfig.vote.prefix,
    id: (c) => {
      const v = c.get("voter");
      return v?.tokenId ? String(v.tokenId) : getClientIp(c);
    }
  }),
  async (c) => {
    const voter = c.get("voter");
    if (!voter) throw new UnauthorizedError("Tidak terautentikasi", ERROR_CODES.UNAUTHORIZED);

    const { candidatePairId } = await validateBody(c, voteSchema);

    const { sessionToken, tokenId, electionId } = voter;

    try {
      await votingService.vote(tokenId, electionId, sessionToken, candidatePairId);

      deleteCookie(c, "voter_session", { path: "/", domain: appEnv.COOKIE_DOMAIN });

      return created(c, { success: true });
    } catch (e: unknown) {
      if (
        isHttpError(e) &&
        (e.code === ERROR_CODES.TOKEN_USED ||
          e.code === ERROR_CODES.TOKEN_INVALID ||
          e.code === ERROR_CODES.SESSION_EXPIRED)
      ) {
        deleteCookie(c, "voter_session", { path: "/", domain: appEnv.COOKIE_DOMAIN });
      }

      throw e;
    }
  }
);

adminResultsApp.use("/*", adminAuth);

adminResultsApp.get("/:electionId", async (c) => {
  const { electionId } = c.req.param();
  const data = await resultsService.getAdminResults(electionId);
  return success(c, data);
});

publicResultsApp.get("/", async (c) => {
  const electionSlug = c.req.query("electionSlug")?.trim();
  const data = await resultsService.getPublicResults(electionSlug || undefined);
  return success(c, data);
});
