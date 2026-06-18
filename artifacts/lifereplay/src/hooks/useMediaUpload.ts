import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toError, interpretSupabaseError } from "@/lib/errors";
import type { MediaType, MemoryMedia, MemoryMediaInsert } from "@/lib/database.types";
import { validateMediaFile } from "@/lib/validation";

const BUCKET = "memory-media" as const;

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);

  async function uploadFile(
    file: File,
    memoryId: string,
    type: MediaType
  ): Promise<MemoryMedia> {
    // ── Auth ──────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const validationError = validateMediaFile(file, type);
    if (validationError) {
      throw new Error(validationError);
    }

    // ── Build storage path ────────────────────────────────────────────
    const ext      = file.name.split(".").pop() ?? "bin";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path     = `${user.id}/${memoryId}/${type}/${safeName}`;

    setProgress((prev) => [
      ...prev,
      { fileName: file.name, progress: 0, status: "uploading" },
    ]);

    // ── Step 1: Upload to Supabase Storage ────────────────────────────
    console.group(`[upload] → storage bucket="${BUCKET}"`);
    console.log("file    :", file.name, `(${(file.size / 1024).toFixed(1)} KB, ${file.type})`);
    console.log("path    :", path);
    console.log("type    :", type);
    console.groupEnd();

    const { data: storageData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });

    if (uploadError) {
      console.group(`[upload] ❌ storage error on bucket="${BUCKET}"`);
      console.error("message :", uploadError.message);
      console.error("status  :", (uploadError as { statusCode?: number }).statusCode);
      console.error("full    :", uploadError);
      console.groupEnd();

      setProgress((prev) =>
        prev.map((p) =>
          p.fileName === file.name
            ? { ...p, status: "error", error: uploadError.message }
            : p
        )
      );
      throw toError(
        `Storage upload failed: ${uploadError.message}. ` +
        `Bucket="${BUCKET}". Check that the bucket exists and storage policies allow authenticated uploads.`
      );
    }

    console.log(`[upload] ✅ storage success — path: ${storageData.path}`);

    // ── Step 2: Get public URL ────────────────────────────────────────
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    console.log("[upload] public URL:", publicUrl);

    // ── Step 3: Record in memory_media table ──────────────────────────
    const mediaInsert: MemoryMediaInsert = {
      memory_id: memoryId,
      user_id:   user.id,
      type,
      file_name: file.name,
      file_url:  publicUrl,
      file_size: file.size,
      mime_type: file.type,
    };

    console.group(`[upload] INSERT into "memory_media"`);
    console.log("payload:", JSON.stringify(mediaInsert, null, 2));
    console.groupEnd();

    const { data, error: dbError } = await supabase
      .from("memory_media")
      .insert(mediaInsert)
      .select()
      .single();

    if (dbError) {
      console.group(`[upload] ❌ memory_media DB insert error`);
      console.error("message :", dbError.message);
      console.error("code    :", dbError.code);
      console.error("hint    :", dbError.hint);
      console.error("details :", dbError.details);
      console.groupEnd();
      throw toError(interpretSupabaseError(dbError));
    }

    console.log(`[upload] ✅ memory_media record saved — id: ${(data as MemoryMedia).id}`);

    setProgress((prev) =>
      prev.map((p) =>
        p.fileName === file.name ? { ...p, progress: 100, status: "done" } : p
      )
    );

    return data as MemoryMedia;
  }

  async function uploadMultiple(
    files: File[],
    memoryId: string,
    type: MediaType
  ): Promise<MemoryMedia[]> {
    setUploading(true);
    setProgress([]);
    try {
      return await Promise.all(files.map((f) => uploadFile(f, memoryId, type)));
    } finally {
      setUploading(false);
    }
  }

  async function deleteMedia(mediaId: string, fileUrl: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Remove from storage
    try {
      const urlObj   = new URL(fileUrl);
      const pathPart = urlObj.pathname.split(`/storage/v1/object/public/${BUCKET}/`)[1];
      if (pathPart) {
        const { error } = await supabase.storage.from(BUCKET).remove([pathPart]);
        if (error) console.warn("[deleteMedia] storage remove warning:", error.message);
        else console.log("[deleteMedia] ✅ storage file removed:", pathPart);
      }
    } catch (e) {
      console.warn("[deleteMedia] Could not parse storage URL:", e);
    }

    // Remove DB record
    const { error } = await supabase.from("memory_media").delete().eq("id", mediaId);
    if (error) console.error("[deleteMedia] DB delete error:", error);
    else console.log("[deleteMedia] ✅ memory_media record deleted:", mediaId);
  }

  return { uploadMultiple, uploading, progress, deleteMedia };
}

export function getMediaType(file: File): MediaType {
  if (file.type.startsWith("image/")) return "photo";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "voice";
  return "photo";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
