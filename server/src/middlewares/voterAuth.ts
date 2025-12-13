import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verifyVoterJwt } from "../utils/jwt";
import type { AppEnv } from "../app-env";

export async function voterAuth(c: Context<AppEnv>, next: Next) {
  const token = getCookie(c, "voter_session");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = verifyVoterJwt(token);
    c.set("voter", payload);
    return next();
  } catch {
    return c.json({ error: "Invalid or expired voter session" }, 401);
  }
}
