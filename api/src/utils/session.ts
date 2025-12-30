import crypto from "node:crypto";

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashSessionToken(sessionToken: string): string {
  return crypto.createHash("sha256").update(sessionToken).digest("hex");
}

export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}
