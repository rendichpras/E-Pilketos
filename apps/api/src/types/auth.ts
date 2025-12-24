export type AdminContext = {
  adminId: string;
  role: "SUPER_ADMIN" | "COMMITTEE";
};

export type VoterContext = {
  sessionToken: string;
  tokenId: string;
  electionId: string;
};
