import type { AdminJwtPayload, VoterJwtPayload } from "./utils/jwt";

export type AppEnv = {
  Variables: {
    admin?: AdminJwtPayload;
    voter?: VoterJwtPayload;
  };
};
