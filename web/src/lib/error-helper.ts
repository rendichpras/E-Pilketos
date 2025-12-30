import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";

export function handleApiError(err: unknown, defaultMessage = "Terjadi kesalahan sistem"): string {
  if (err instanceof ApiError) {
    toast.error(err.message);
    return err.message;
  }

  console.error("Unknown API Error:", err);

  toast.error(defaultMessage);
  return defaultMessage;
}
