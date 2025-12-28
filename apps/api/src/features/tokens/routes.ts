import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { adminAuth } from "../auth/admin/auth.middleware";
import { requireRole } from "../auth/admin/require-role";
import { tokenService } from "./service";
import { success, created } from "../../core/response";
import { validateBody, validateQuery } from "../../core/validation";
import { generateTokensSchema, tokenListQuerySchema } from "@e-pilketos/validators";

export const adminTokensApp = new Hono<AppEnv>();

adminTokensApp.use("/*", adminAuth);

adminTokensApp.post("/generate/:electionId", requireRole("SUPER_ADMIN"), async (c) => {
  const { electionId } = c.req.param();
  const { count, batch } = await validateBody(c, generateTokensSchema);

  const admin = c.get("admin")!;

  const result = await tokenService.generate(electionId, count, batch, admin.adminId);
  return created(c, result);
});

adminTokensApp.get("/:electionId", requireRole("SUPER_ADMIN"), async (c) => {
  const { electionId } = c.req.param();

  const query = validateQuery(c, tokenListQuerySchema);

  const result = await tokenService.list(electionId, query);
  return success(c, result);
});

adminTokensApp.post("/invalidate/:id", requireRole("SUPER_ADMIN"), async (c) => {
  const { id } = c.req.param();
  const admin = c.get("admin")!;

  const result = await tokenService.invalidate(id, admin.adminId);
  return success(c, result);
});
