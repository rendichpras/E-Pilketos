import { describe, it, expect } from "vitest";
import { createSessionToken, addSeconds } from "./session";

describe("createSessionToken", () => {
  it("generates a string token", () => {
    const token = createSessionToken();
    expect(typeof token).toBe("string");
  });

  it("generates unique tokens", () => {
    const token1 = createSessionToken();
    const token2 = createSessionToken();
    expect(token1).not.toBe(token2);
  });

  it("generates token with base64url characters", () => {
    const token = createSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates token with sufficient length", () => {
    const token = createSessionToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
  });
});

describe("addSeconds", () => {
  it("adds seconds to a date", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    const result = addSeconds(date, 60);
    expect(result.toISOString()).toBe("2024-01-01T00:01:00.000Z");
  });

  it("adds hours worth of seconds", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    const result = addSeconds(date, 3600);
    expect(result.toISOString()).toBe("2024-01-01T01:00:00.000Z");
  });

  it("does not mutate original date", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    const originalTime = date.getTime();
    addSeconds(date, 60);
    expect(date.getTime()).toBe(originalTime);
  });

  it("handles zero seconds", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    const result = addSeconds(date, 0);
    expect(result.toISOString()).toBe(date.toISOString());
  });

  it("handles negative seconds", () => {
    const date = new Date("2024-01-01T01:00:00Z");
    const result = addSeconds(date, -3600);
    expect(result.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });
});
