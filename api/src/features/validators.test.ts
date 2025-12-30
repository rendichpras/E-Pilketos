import { describe, it, expect } from "vitest";
import {
  adminLoginSchema,
  voterLoginSchema,
  createElectionSchema,
  updateElectionSchema,
  createCandidateSchema,
  generateTokensSchema,
  voteSchema,
  paginationQuerySchema,
  tokenListQuerySchema
} from "@/shared/validators";

describe("adminLoginSchema", () => {
  it("validates correct input", () => {
    const result = adminLoginSchema.safeParse({
      username: "admin",
      password: "password123"
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty username", () => {
    const result = adminLoginSchema.safeParse({
      username: "",
      password: "password123"
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = adminLoginSchema.safeParse({
      username: "admin"
    });
    expect(result.success).toBe(false);
  });

  it("rejects username exceeding max length", () => {
    const result = adminLoginSchema.safeParse({
      username: "a".repeat(65),
      password: "password123"
    });
    expect(result.success).toBe(false);
  });
});

describe("voterLoginSchema", () => {
  it("validates correct token format XXXX-1234", () => {
    const result = voterLoginSchema.safeParse({ token: "ABCD-1234" });
    expect(result.success).toBe(true);
  });

  it("validates all uppercase letters", () => {
    const result = voterLoginSchema.safeParse({ token: "ZZZZ-9999" });
    expect(result.success).toBe(true);
  });

  it("normalizes lowercase token to uppercase", () => {
    const result = voterLoginSchema.safeParse({ token: "abcd-1234" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.token).toBe("ABCD-1234");
    }
  });

  it("rejects token without dash", () => {
    const result = voterLoginSchema.safeParse({ token: "ABCD1234" });
    expect(result.success).toBe(false);
  });

  it("rejects empty token", () => {
    const result = voterLoginSchema.safeParse({ token: "" });
    expect(result.success).toBe(false);
  });

  it("rejects token with wrong length", () => {
    const result = voterLoginSchema.safeParse({ token: "ABC-123" });
    expect(result.success).toBe(false);
  });
});

describe("createElectionSchema", () => {
  const validElection = {
    slug: "pilketos-2024",
    name: "Pilketos 2024",
    description: "Pemilihan Ketua OSIS 2024",
    startAt: "2024-12-01T08:00:00Z",
    endAt: "2024-12-01T16:00:00Z"
  };

  it("validates correct election data", () => {
    const result = createElectionSchema.safeParse(validElection);
    expect(result.success).toBe(true);
  });

  it("rejects slug with uppercase", () => {
    const result = createElectionSchema.safeParse({
      ...validElection,
      slug: "Pilketos-2024"
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with spaces", () => {
    const result = createElectionSchema.safeParse({
      ...validElection,
      slug: "pilketos 2024"
    });
    expect(result.success).toBe(false);
  });

  it("allows slug with numbers and dashes", () => {
    const result = createElectionSchema.safeParse({
      ...validElection,
      slug: "pilketos-2024-semester-1"
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid datetime format", () => {
    const result = createElectionSchema.safeParse({
      ...validElection,
      startAt: "2024-12-01"
    });
    expect(result.success).toBe(false);
  });

  it("defaults isResultPublic to false", () => {
    const result = createElectionSchema.safeParse(validElection);
    if (result.success) {
      expect(result.data.isResultPublic).toBe(false);
    }
  });

  it("accepts isResultPublic as true", () => {
    const result = createElectionSchema.safeParse({
      ...validElection,
      isResultPublic: true
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isResultPublic).toBe(true);
    }
  });
});

describe("updateElectionSchema", () => {
  it("allows partial updates", () => {
    const result = updateElectionSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("allows empty object", () => {
    const result = updateElectionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects empty name if provided", () => {
    const result = updateElectionSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("createCandidateSchema", () => {
  const validCandidate = {
    number: 1,
    shortName: "RINA-BUDI",
    ketuaName: "Rina Sari",
    ketuaClass: "XII IPA 1",
    wakilName: "Budi Santoso",
    wakilClass: "XI IPS 2"
  };

  it("validates correct candidate data", () => {
    const result = createCandidateSchema.safeParse(validCandidate);
    expect(result.success).toBe(true);
  });

  it("rejects number less than 1", () => {
    const result = createCandidateSchema.safeParse({
      ...validCandidate,
      number: 0
    });
    expect(result.success).toBe(false);
  });

  it("allows optional fields", () => {
    const result = createCandidateSchema.safeParse({
      ...validCandidate,
      photoUrl: "https://example.com/photo.jpg",
      vision: "Visi kami",
      mission: "Misi kami",
      programs: "Program kerja"
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid photoUrl", () => {
    const result = createCandidateSchema.safeParse({
      ...validCandidate,
      photoUrl: "not-a-url"
    });
    expect(result.success).toBe(false);
  });

  it("allows null photoUrl", () => {
    const result = createCandidateSchema.safeParse({
      ...validCandidate,
      photoUrl: null
    });
    expect(result.success).toBe(true);
  });
});

describe("generateTokensSchema", () => {
  it("validates correct count", () => {
    const result = generateTokensSchema.safeParse({ count: 100 });
    expect(result.success).toBe(true);
  });

  it("rejects count less than 1", () => {
    const result = generateTokensSchema.safeParse({ count: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects count more than 1000", () => {
    const result = generateTokensSchema.safeParse({ count: 1001 });
    expect(result.success).toBe(false);
  });

  it("allows optional batch", () => {
    const result = generateTokensSchema.safeParse({
      count: 100,
      batch: "batch-1"
    });
    expect(result.success).toBe(true);
  });
});

describe("voteSchema", () => {
  it("validates correct UUID", () => {
    const result = voteSchema.safeParse({
      candidatePairId: "550e8400-e29b-41d4-a716-446655440000"
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = voteSchema.safeParse({
      candidatePairId: "not-a-uuid"
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = voteSchema.safeParse({
      candidatePairId: ""
    });
    expect(result.success).toBe(false);
  });
});

describe("paginationQuerySchema", () => {
  it("defaults to page 1 and limit 20", () => {
    const result = paginationQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("coerces string numbers", () => {
    const result = paginationQuerySchema.safeParse({
      page: "2",
      limit: "50"
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects page less than 1", () => {
    const result = paginationQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects limit more than 100", () => {
    const result = paginationQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });
});

describe("tokenListQuerySchema", () => {
  it("extends pagination with status filter", () => {
    const result = tokenListQuerySchema.safeParse({
      page: 1,
      limit: 20,
      status: "UNUSED"
    });
    expect(result.success).toBe(true);
  });

  it("validates status enum", () => {
    const validStatuses = ["UNUSED", "USED", "INVALIDATED"];
    for (const status of validStatuses) {
      const result = tokenListQuerySchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = tokenListQuerySchema.safeParse({ status: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("allows batch filter", () => {
    const result = tokenListQuerySchema.safeParse({ batch: "batch-1" });
    expect(result.success).toBe(true);
  });
});
