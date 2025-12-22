export type VoteReasonVariant = "default" | "destructive";

export function getVoteReason(
  reason?: string | null
): { variant: VoteReasonVariant; message: string } | null {
  if (!reason) return null;

  switch (reason) {
    case "session_expired":
      return {
        variant: "default",
        message: "Sesi Anda berakhir. Silakan masukkan token kembali."
      };
    case "invalid_token":
      return {
        variant: "destructive",
        message: "Token tidak valid. Periksa kembali token dari panitia."
      };
    case "token_used":
      return {
        variant: "default",
        message: "Token sudah digunakan. Jika ini tidak sesuai, hubungi panitia."
      };
    case "token_ambiguous":
      return {
        variant: "destructive",
        message:
          "Token terdeteksi untuk lebih dari satu pemilihan aktif. Hubungi panitia untuk bantuan."
      };
    case "election_inactive":
      return {
        variant: "default",
        message: "Pemilihan tidak aktif atau di luar jadwal."
      };
    case "missing_choice":
      return {
        variant: "default",
        message: "Silakan pilih pasangan calon terlebih dahulu."
      };
    case "invalid_choice":
      return {
        variant: "destructive",
        message: "Pilihan pasangan calon tidak valid. Silakan pilih ulang."
      };
    default:
      return null;
  }
}
