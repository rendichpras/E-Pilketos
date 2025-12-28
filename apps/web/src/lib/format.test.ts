import { describe, it, expect } from "vitest";
import { fmtJakarta, fmtNumber, fmtDateRange, fmtDateTimeId } from "./format";

describe("fmtJakarta", () => {
  it("formats date in Indonesian locale with Jakarta timezone", () => {
    const date = new Date("2024-06-15T10:30:00Z");
    const result = fmtJakarta(date);
    expect(result).toContain("2024");
    expect(result).toMatch(/\d{1,2}.*\d{2}[.:]\d{2}/);
  });
});

describe("fmtNumber", () => {
  it("formats number with Indonesian locale", () => {
    expect(fmtNumber(1000)).toBe("1.000");
    expect(fmtNumber(1234567)).toBe("1.234.567");
  });

  it("handles zero", () => {
    expect(fmtNumber(0)).toBe("0");
  });

  it("handles negative numbers", () => {
    expect(fmtNumber(-1000)).toBe("-1.000");
  });
});

describe("fmtDateRange", () => {
  it("returns null for empty inputs", () => {
    expect(fmtDateRange("", "")).toBeNull();
  });

  it("formats same-day range", () => {
    const result = fmtDateRange("2024-06-15T08:00:00Z", "2024-06-15T16:00:00Z");
    expect(result).not.toBeNull();
    expect(result).toContain("·");
    expect(result).toContain("–");
  });

  it("formats multi-day range", () => {
    const result = fmtDateRange("2024-06-15T08:00:00Z", "2024-06-16T16:00:00Z");
    expect(result).not.toBeNull();
    expect(result).toContain("—");
  });
});

describe("fmtDateTimeId", () => {
  it("formats ISO string to Indonesian datetime", () => {
    const result = fmtDateTimeId("2024-06-15T10:30:00Z");
    expect(result).toContain("2024");
  });
});
