import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { adminAuth } from "../auth/admin/middleware";
import { requireRole } from "../auth/admin/require-role";
import { tokenService } from "./service";
import { success, created } from "../../core/response";
import { generateTokensSchema, tokenListQuerySchema } from "@e-pilketos/validators";

export const adminTokensApp = new Hono<AppEnv>();

adminTokensApp.use("/*", adminAuth);

adminTokensApp.post("/generate/:electionId", requireRole("SUPER_ADMIN"), async (c) => {
  const { electionId } = c.req.param();
  const body = await c.req.json().catch(() => null);
  const parsed = generateTokensSchema.safeParse(body);

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

  const admin = c.get("admin")!;
  const { count, batch } = parsed.data;

  const result = await tokenService.generate(electionId, count, batch, admin.adminId);
  return created(c, result);
});

adminTokensApp.get("/:electionId", requireRole("SUPER_ADMIN"), async (c) => {
  const { electionId } = c.req.param();

  const query = tokenListQuerySchema.safeParse({
    status: c.req.query("status"),
    batch: c.req.query("batch"),
    page: c.req.query("page"),
    limit: c.req.query("limit")
  });

  if (!query.success) {
    return c.json(
      {
        ok: false,
        error: "Validasi query gagal",
        code: "VALIDATION_ERROR",
        details: query.error.flatten()
      },
      400
    );
  }

  const result = await tokenService.list(electionId, query.data);
  return success(c, result);
});

adminTokensApp.post("/invalidate/:id", requireRole("SUPER_ADMIN"), async (c) => {
  const { id } = c.req.param();
  const admin = c.get("admin")!;

  const result = await tokenService.invalidate(id, admin.adminId);
  return success(c, result);
});
