import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./env";
import type { AppEnv } from "./app-env";

import { requestId } from "./middlewares/requestId";
import { onError } from "./middlewares/errorHandler";
import { originGuard } from "./middlewares/originGuard";
import { healthApp } from "./routes/health";

import { adminAuthApp } from "./routes/adminAuth";
import { voterAuthApp } from "./routes/voterAuth";
import { adminElectionsApp, publicElectionsApp } from "./routes/elections";
import { adminCandidatesApp, publicCandidatesApp } from "./routes/candidates";
import { adminTokensApp } from "./routes/tokens";
import { adminResultsApp, publicResultsApp } from "./routes/results";
import { voterApp } from "./routes/voter";

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
app.use("*", logger());
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
    console.log(
      `E-Pilketos API running on http://localhost:${info.port}/api/v1/health (ready: /api/v1/health/ready)`
    );
  }
);

export default app;
