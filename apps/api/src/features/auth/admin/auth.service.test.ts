import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("./auth.repository", () => ({
  adminRepository: {
    findByUsername: vi.fn(),
    findById: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn()
  }
}));

vi.mock("../../../utils/session", () => ({
  createSessionToken: vi.fn(() => "mock-session-token"),
  addSeconds: vi.fn((date, seconds) => new Date(date.getTime() + seconds * 1000))
}));

vi.mock("../../../env", () => ({
  env: {
    ADMIN_SESSION_TTL_SEC: 3600
  }
}));

import { adminAuthService } from "./auth.service";
import { adminRepository } from "./auth.repository";
import { UnauthorizedError } from "../../../core/errors";

describe("adminAuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    const mockAdmin = {
      id: "admin-123",
      username: "admin",
      passwordHash: "$2a$10$hashedpassword",
      role: "SUPER_ADMIN" as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it("successfully logs in with valid credentials", async () => {
      vi.mocked(adminRepository.findByUsername).mockResolvedValue(mockAdmin);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
      vi.mocked(adminRepository.createSession).mockResolvedValue(undefined);

      const result = await adminAuthService.login("admin", "password123");

      expect(result.admin.id).toBe("admin-123");
      expect(result.admin.username).toBe("admin");
      expect(result.admin.role).toBe("SUPER_ADMIN");
      expect(result.sessionToken).toBe("mock-session-token");
      expect(adminRepository.createSession).toHaveBeenCalled();
    });

    it("throws UnauthorizedError for non-existent user", async () => {
      vi.mocked(adminRepository.findByUsername).mockResolvedValue(null as any);

      await expect(adminAuthService.login("nobody", "password")).rejects.toThrow(UnauthorizedError);
      await expect(adminAuthService.login("nobody", "password")).rejects.toThrow(
        "Username atau password salah"
      );
    });

    it("throws UnauthorizedError for wrong password", async () => {
      vi.mocked(adminRepository.findByUsername).mockResolvedValue(mockAdmin);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(false as never);

      await expect(adminAuthService.login("admin", "wrongpassword")).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("creates session with correct admin ID", async () => {
      vi.mocked(adminRepository.findByUsername).mockResolvedValue(mockAdmin);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
      vi.mocked(adminRepository.createSession).mockResolvedValue(undefined);

      await adminAuthService.login("admin", "password123");

      expect(adminRepository.createSession).toHaveBeenCalledWith(
        "admin-123",
        "mock-session-token",
        expect.any(Date)
      );
    });
  });

  describe("logout", () => {
    it("deletes session", async () => {
      vi.mocked(adminRepository.deleteSession).mockResolvedValue(undefined);

      await adminAuthService.logout("session-token");

      expect(adminRepository.deleteSession).toHaveBeenCalledWith("session-token");
    });
  });

  describe("getMe", () => {
    const mockAdmin = {
      id: "admin-123",
      username: "admin",
      passwordHash: "hash",
      role: "COMMITTEE" as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it("returns admin data for valid adminId", async () => {
      vi.mocked(adminRepository.findById).mockResolvedValue(mockAdmin);

      const result = await adminAuthService.getMe("admin-123");

      expect(result.id).toBe("admin-123");
      expect(result.username).toBe("admin");
      expect(result.role).toBe("COMMITTEE");
    });

    it("throws UnauthorizedError for non-existent admin", async () => {
      vi.mocked(adminRepository.findById).mockResolvedValue(null as any);

      await expect(adminAuthService.getMe("nobody")).rejects.toThrow(UnauthorizedError);
    });
  });
});
