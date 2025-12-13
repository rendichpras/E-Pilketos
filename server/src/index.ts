import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { env } from "./env";
import type { AppEnv } from "./app-env";
import { adminAuthApp } from "./modules/auth/adminRoutes";
import { voterAuthApp } from "./modules/auth/voterRoutes";
import { adminElectionsApp, publicElectionsApp } from "./modules/elections/electionRoutes";
import { adminCandidatesApp, publicCandidatesApp } from "./modules/candidates/candidateRoutes";
import { adminTokensApp } from "./modules/tokens/tokenRoutes";
import { adminResultsApp, publicResultsApp } from "./modules/results/resultRoutes";
import { voterApp } from "./modules/voter/voterRoutes";

const app = new Hono<AppEnv>().basePath("/api/v1");

app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN ?? "*",
    credentials: true
  })
);

app.get("/health", (c) =>
  c.json({
    status: "ok",
    env: env.NODE_ENV
  })
);

app.route("/admin/auth", adminAuthApp);
app.route("/admin/elections", adminElectionsApp);
app.route("/admin/candidates", adminCandidatesApp);
app.route("/admin/tokens", adminTokensApp);
app.route("/admin/results", adminResultsApp);

app.route("/auth", voterAuthApp);
app.route("/voter", voterApp);

app.route("/public/elections", publicElectionsApp);
app.route("/public/candidates", publicCandidatesApp);
app.route("/public/results", publicResultsApp);

serve(
  {
    fetch: app.fetch,
    port: env.PORT
  },
  (info) => {
    console.log(`E-Pilketos API running on http://localhost:${info.port}/api/v1/health`);
  }
);

export default app;
