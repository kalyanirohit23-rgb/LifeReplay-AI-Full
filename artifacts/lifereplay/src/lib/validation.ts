import { z } from "zod";
import type { MediaType } from "@/lib/database.types";

export const memoryDraftSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(180, "Title is too long"),
  body: z.string().max(8000, "Story is too long").optional(),
  memory_date: z.string().min(1, "Date is required"),
  memory_type: z.string().optional(),
  mood: z.string().max(40).optional(),
  place: z.string().max(120).optional(),
});

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const MIME_BY_MEDIA_TYPE: Record<MediaType, string[]> = {
  photo: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  voice: ["audio/webm", "audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg"],
};

export function validateMediaFile(file: File, type: MediaType): string | null {
  if (file.size <= 0) return "File is empty";
  if (file.size > MAX_FILE_SIZE_BYTES) return "File exceeds 50MB limit";

  const allowed = MIME_BY_MEDIA_TYPE[type];
  if (allowed.length > 0 && !allowed.includes(file.type)) {
    return `Unsupported ${type} format: ${file.type || "unknown"}`;
  }

  return null;
}
