import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { adminAuth } from "../auth/admin/middleware";
import { candidateService } from "./service";
import { success, created, noContent } from "../../core/response";
import { createCandidateSchema, updateCandidateSchema } from "@e-pilketos/validators";

export const adminCandidatesApp = new Hono<AppEnv>();
export const publicCandidatesApp = new Hono<AppEnv>();

adminCandidatesApp.use("/*", adminAuth);

adminCandidatesApp.get("/election/:electionId", async (c) => {
  const { electionId } = c.req.param();
  const result = await candidateService.getByElection(electionId);
  return success(c, result);
});

adminCandidatesApp.post("/election/:electionId", async (c) => {
  const { electionId } = c.req.param();
  const body = await c.req.json().catch(() => null);
  const parsed = createCandidateSchema.safeParse(body);

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
  const data = parsed.data;

  const candidate = await candidateService.create(
    {
      electionId,
      number: data.number,
      shortName: data.shortName,
      ketuaName: data.ketuaName,
      ketuaClass: data.ketuaClass,
      wakilName: data.wakilName,
      wakilClass: data.wakilClass,
      photoUrl: data.photoUrl ?? undefined,
      vision: data.vision ?? undefined,
      mission: data.mission ?? undefined,
      programs: data.programs ?? undefined,
      isActive: data.isActive
    },
    admin.adminId
  );

  return created(c, candidate);
});

adminCandidatesApp.put("/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  const parsed = updateCandidateSchema.safeParse(body);

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
  const data = parsed.data;

  const candidate = await candidateService.update(
    id,
    {
      number: data.number,
      shortName: data.shortName,
      ketuaName: data.ketuaName,
      ketuaClass: data.ketuaClass,
      wakilName: data.wakilName,
      wakilClass: data.wakilClass,
      photoUrl: data.photoUrl ?? undefined,
      vision: data.vision ?? undefined,
      mission: data.mission ?? undefined,
      programs: data.programs ?? undefined,
      isActive: data.isActive
    },
    admin.adminId
  );

  return success(c, candidate);
});

adminCandidatesApp.delete("/:id", async (c) => {
  const { id } = c.req.param();
  const admin = c.get("admin")!;

  await candidateService.delete(id, admin.adminId);
  return noContent(c);
});

publicCandidatesApp.get("/", async (c) => {
  const electionSlug = c.req.query("electionSlug");
  const result = await candidateService.getPublicCandidates(electionSlug);
  return success(c, result);
});
