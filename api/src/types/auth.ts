export type AdminRole = "SUPER_ADMIN" | "COMMITTEE";

export type AdminContext = {
  adminId: string;
  role: AdminRole;
};

export type VoterContext = {
  sessionToken: string;
  tokenId: string;
  electionId: string;
};
