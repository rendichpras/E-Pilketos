import { describe, it, expect } from "vitest";
import { normalize, matchesSearch } from "./search";

describe("normalize", () => {
  it("converts to lowercase", () => {
    expect(normalize("HELLO")).toBe("hello");
  });

  it("removes diacritics", () => {
    expect(normalize("café")).toBe("cafe");
    expect(normalize("naïve")).toBe("naive");
  });

  it("trims whitespace", () => {
    expect(normalize("  hello  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(normalize("")).toBe("");
  });
});

describe("matchesSearch", () => {
  it("returns true for empty query", () => {
    expect(matchesSearch("any text", "")).toBe(true);
    expect(matchesSearch("any text", "   ")).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(matchesSearch("Hello World", "hello")).toBe(true);
    expect(matchesSearch("Hello World", "WORLD")).toBe(true);
  });

  it("returns false when no match", () => {
    expect(matchesSearch("Hello", "Goodbye")).toBe(false);
  });

  it("matches partial text", () => {
    expect(matchesSearch("Pilketos 2024", "pilke")).toBe(true);
  });
});
