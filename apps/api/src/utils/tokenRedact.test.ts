import { describe, it, expect } from "vitest";
import { redactUsedToken, redactInvalidToken } from "./tokenRedact";

describe("redactUsedToken", () => {
  it("creates USED- prefix", () => {
    const tokenId = "550e8400-e29b-41d4-a716-446655440000";
    const result = redactUsedToken(tokenId);
    expect(result.startsWith("USED-")).toBe(true);
  });

  it("has consistent length", () => {
    const tokenId = "550e8400-e29b-41d4-a716-446655440000";
    const result = redactUsedToken(tokenId);
    expect(result.length).toBe(32);
  });

  it("removes dashes from UUID in suffix", () => {
    const tokenId = "550e8400-e29b-41d4-a716-446655440000";
    const result = redactUsedToken(tokenId);
    const suffix = result.slice(5);
    expect(suffix).not.toContain("-");
  });

  it("produces different output for different UUIDs", () => {
    const token1 = redactUsedToken("550e8400-e29b-41d4-a716-446655440000");
    const token2 = redactUsedToken("660e8400-e29b-41d4-a716-446655440000");
    expect(token1).not.toBe(token2);
  });
});

describe("redactInvalidToken", () => {
  it("creates INV- prefix", () => {
    const tokenId = "550e8400-e29b-41d4-a716-446655440000";
    const result = redactInvalidToken(tokenId);
    expect(result.startsWith("INV-")).toBe(true);
  });

  it("has consistent length", () => {
    const tokenId = "550e8400-e29b-41d4-a716-446655440000";
    const result = redactInvalidToken(tokenId);
    expect(result.length).toBe(32);
  });

  it("removes dashes from UUID in suffix", () => {
    const tokenId = "550e8400-e29b-41d4-a716-446655440000";
    const result = redactInvalidToken(tokenId);
    const suffix = result.slice(4);
    expect(suffix).not.toContain("-");
  });
});
