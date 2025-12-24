import crypto from "crypto";

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}
