import jwt from "jsonwebtoken";
import { env } from "../env";

export type AdminJwtPayload = {
  adminId: string;
  role: "SUPER_ADMIN" | "COMMITTEE";
};

export type VoterJwtPayload = {
  tokenId: string;
  electionId: string;
};

const ADMIN_EXPIRES_IN = "8h";
const VOTER_EXPIRES_IN = "2h";

export function signAdminJwt(payload: AdminJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET_ADMIN, {
    expiresIn: ADMIN_EXPIRES_IN
  });
}

export function verifyAdminJwt(token: string): AdminJwtPayload {
  return jwt.verify(token, env.JWT_SECRET_ADMIN) as AdminJwtPayload;
}

export function signVoterJwt(payload: VoterJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET_VOTER, {
    expiresIn: VOTER_EXPIRES_IN
  });
}

export function verifyVoterJwt(token: string): VoterJwtPayload {
  return jwt.verify(token, env.JWT_SECRET_VOTER) as VoterJwtPayload;
}
