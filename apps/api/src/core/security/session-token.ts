import crypto from "node:crypto";

export function hashSessionToken(sessionToken: string): string {
  return crypto.createHash("sha256").update(sessionToken).digest("hex");
}
