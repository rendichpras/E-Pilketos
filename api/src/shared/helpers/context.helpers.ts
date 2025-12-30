import type { Context } from "hono";
import type { AppEnv } from "../../app-env";
import { UnauthorizedError } from "../../core/errors";
import { ERROR_CODES } from "../types";

export const contextHelpers = {
  getAdmin(c: Context<AppEnv>) {
    const admin = c.get("admin");
    if (!admin) {
      throw new UnauthorizedError("Unauthorized", ERROR_CODES.UNAUTHORIZED);
    }
    return admin;
  },

  getVoter(c: Context<AppEnv>) {
    const voter = c.get("voter");
    if (!voter) {
      throw new UnauthorizedError("Unauthorized", ERROR_CODES.UNAUTHORIZED);
    }
    return voter;
  }
};
