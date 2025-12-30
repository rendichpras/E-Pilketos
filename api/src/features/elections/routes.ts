import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { adminAuth } from "../auth/admin/auth.middleware";
import { requireRole } from "../auth/admin/require-role";
import { electionService } from "./service";
import { success, created } from "../../core/response";
import { validateBody } from "../../core/validation";
import { createElectionSchema, updateElectionSchema } from "@/shared/validators";

export const adminElectionsApp = new Hono<AppEnv>();

adminElectionsApp.use("/*", adminAuth);

adminElectionsApp.get("/", async (c) => {
  const elections = await electionService.getAll();
  return success(c, elections);
});

adminElectionsApp.get("/:id", async (c) => {
  const { id } = c.req.param();
  const election = await electionService.getById(id);
  return success(c, election);
});

adminElectionsApp.post("/", async (c) => {
  const data = await validateBody(c, createElectionSchema);

  const admin = c.get("admin")!;

  const election = await electionService.create(
    {
      slug: data.slug,
      name: data.name,
      description: data.description,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      isResultPublic: data.isResultPublic
    },
    admin.adminId
  );

  return created(c, election);
});

adminElectionsApp.put("/:id", async (c) => {
  const { id } = c.req.param();
  const data = await validateBody(c, updateElectionSchema);

  const admin = c.get("admin")!;

  const election = await electionService.update(
    id,
    {
      name: data.name,
      description: data.description,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: data.endAt ? new Date(data.endAt) : undefined
    },
    admin.adminId
  );

  return success(c, election);
});

adminElectionsApp.post("/:id/activate", requireRole("SUPER_ADMIN"), async (c) => {
  const { id } = c.req.param();
  const admin = c.get("admin")!;

  const election = await electionService.activate(id, admin.adminId);
  return success(c, election);
});

adminElectionsApp.post("/:id/close", requireRole("SUPER_ADMIN"), async (c) => {
  const { id } = c.req.param();
  const admin = c.get("admin")!;

  const election = await electionService.close(id, admin.adminId);
  return success(c, election);
});

adminElectionsApp.post("/:id/archive", requireRole("SUPER_ADMIN"), async (c) => {
  const { id } = c.req.param();
  const admin = c.get("admin")!;

  const election = await electionService.archive(id, admin.adminId);
  return success(c, election);
});

adminElectionsApp.post("/:id/publish-results", requireRole("SUPER_ADMIN"), async (c) => {
  const { id } = c.req.param();
  const admin = c.get("admin")!;

  const election = await electionService.publishResults(id, admin.adminId);
  return success(c, election);
});

adminElectionsApp.post("/:id/hide-results", requireRole("SUPER_ADMIN"), async (c) => {
  const { id } = c.req.param();
  const admin = c.get("admin")!;

  const election = await electionService.hideResults(id, admin.adminId);
  return success(c, election);
});

export const publicElectionsApp = new Hono<AppEnv>();

publicElectionsApp.get("/active", async (c) => {
  const activeElection = await electionService.getActive();
  return success(c, { activeElection });
});

publicElectionsApp.get("/latest", async (c) => {
  const latestElection = await electionService.getLatest();
  return success(c, { latestElection });
});
