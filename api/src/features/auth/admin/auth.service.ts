import bcrypt from "bcryptjs";
import { adminRepository } from "./auth.repository";
import { UnauthorizedError } from "../../../core/errors";
import { addSeconds, createSessionToken } from "../../../utils/session";
import { env } from "../../../env";
import type { AdminRole } from "@/shared/types";

export interface AdminLoginResult {
  admin: {
    id: string;
    username: string;
    role: AdminRole;
  };
  sessionToken: string;
  expiresAt: Date;
}

export const adminAuthService = {
  async login(username: string, password: string): Promise<AdminLoginResult> {
    const admin = await adminRepository.findByUsername(username);
    if (!admin) {
      throw new UnauthorizedError("Username atau password salah");
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Username atau password salah");
    }

    const now = new Date();
    const expiresAt = addSeconds(now, env.ADMIN_SESSION_TTL_SEC);
    const sessionToken = createSessionToken();

    await adminRepository.createSession(admin.id, sessionToken, expiresAt);

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      },
      sessionToken,
      expiresAt
    };
  },

  async logout(sessionToken: string): Promise<void> {
    await adminRepository.deleteSession(sessionToken);
  },

  async getMe(adminId: string) {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      throw new UnauthorizedError("Tidak terautentikasi");
    }

    return {
      id: admin.id,
      username: admin.username,
      role: admin.role
    };
  }
};
