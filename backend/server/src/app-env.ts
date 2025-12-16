import type { AdminContext, VoterContext } from "./types/auth";

export type AppEnv = {
  Variables: {
    requestId?: string;
    admin?: AdminContext;
    voter?: VoterContext;
  };
};
