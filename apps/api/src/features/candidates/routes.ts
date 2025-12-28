import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { adminAuth } from "../auth/admin/auth.middleware";
import { candidateService } from "./service";
import { success, created, noContent } from "../../core/response";
import { validateBody } from "../../core/validation";
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
  const data = await validateBody(c, createCandidateSchema);

  const admin = c.get("admin")!;

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
  const data = await validateBody(c, updateCandidateSchema);

  const admin = c.get("admin")!;

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
