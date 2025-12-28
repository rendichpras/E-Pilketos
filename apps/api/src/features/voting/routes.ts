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

export const voterApp = new Hono<AppEnv>();
export const adminResultsApp = new Hono<AppEnv>();
export const publicResultsApp = new Hono<AppEnv>();

voterApp.use("/*", voterAuth);

voterApp.get("/candidates", async (c) => {
  const voter = c.get("voter");
  if (!voter) {
    return c.json({ ok: false, error: "Tidak terautentikasi", code: "UNAUTHORIZED" }, 401);
  }

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
      const v = c.get("voter") as any;
      return v?.tokenId ? String(v.tokenId) : getClientIp(c);
    }
  }),
  async (c) => {
    const voter = c.get("voter");
    if (!voter) {
      return c.json({ ok: false, error: "Tidak terautentikasi", code: "UNAUTHORIZED" }, 401);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = voteSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          error: "Validasi gagal",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten()
        },
        400
      );
    }

    const { sessionToken, tokenId, electionId } = voter;
    const { candidatePairId } = parsed.data;

    try {
      await votingService.vote(tokenId, electionId, sessionToken, candidatePairId);
      deleteCookie(c, "voter_session", { path: "/", domain: appEnv.COOKIE_DOMAIN });
      return created(c, { success: true });
    } catch (e: any) {
      deleteCookie(c, "voter_session", { path: "/", domain: appEnv.COOKIE_DOMAIN });
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
