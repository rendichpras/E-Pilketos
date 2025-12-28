import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./env";
import type { AppEnv } from "./app-env";
import { logger } from "./core/logger";

import { requestId, onError, originGuard, loggerMiddleware } from "./core/middleware";

import {
  adminAuthApp,
  voterAuthApp,
  adminElectionsApp,
  publicElectionsApp,
  adminCandidatesApp,
  publicCandidatesApp,
  adminTokensApp,
  voterApp,
  adminResultsApp,
  publicResultsApp,
  healthApp
} from "./features";

const app = new Hono<AppEnv>().basePath("/api/v1");

function parseOrigins(raw: string | undefined): string[] {
  const s = (raw ?? "http://localhost:3000").trim();
  if (!s) return [];
  if (s === "*") return ["*"];
  return s
    .split(",")
    .map((v) => v.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

const allowedOrigins = parseOrigins(env.CORS_ORIGIN);

app.onError(onError);

app.use("*", requestId);
app.use("*", loggerMiddleware());
app.use("*", prettyJSON());

app.use(
  "*",
  secureHeaders({
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "no-referrer",
    strictTransportSecurity:
      env.NODE_ENV === "production" ? "max-age=15552000; includeSubDomains" : false
  })
);

if (allowedOrigins.length > 0 && !allowedOrigins.includes("*")) {
  app.use("*", originGuard({ allowedOrigins }));
}

app.use(
  "*",
  cors({
    origin: allowedOrigins.length
      ? allowedOrigins.includes("*")
        ? "*"
        : allowedOrigins
      : "http://localhost:3000",
    credentials: true
  })
);

app.route("/health", healthApp);

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
    logger.info(`E-Pilketos API running on http://localhost:${info.port}/api/v1/health`);
  }
);

export default app;
