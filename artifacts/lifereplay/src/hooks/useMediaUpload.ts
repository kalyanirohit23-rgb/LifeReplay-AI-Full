import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { MediaType, MemoryMedia, MemoryMediaInsert } from "@/lib/database.types";

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const ext = file.name.split(".").pop() ?? "";
    const path = `${user.id}/${memoryId}/${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    setProgress(prev => [
      ...prev,
      { fileName: file.name, progress: 0, status: "uploading" }
    ]);

    const { error: uploadError } = await supabase.storage
      .from("memory-media")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setProgress(prev =>
        prev.map(p =>
          p.fileName === file.name
            ? { ...p, status: "error", error: uploadError.message }
            : p
        )
      );
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("memory-media")
      .getPublicUrl(path);

    const mediaInsert: MemoryMediaInsert = {
      memory_id: memoryId,
      user_id: user.id,
      type,
      file_name: file.name,
      file_url: publicUrl,
      file_size: file.size,
      mime_type: file.type,
    };

    const { data, error: dbError } = await supabase
      .from("memory_media")
      .insert(mediaInsert)
      .select()
      .single();

    if (dbError) throw dbError;

    setProgress(prev =>
      prev.map(p =>
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
      const results = await Promise.all(
        files.map(f => uploadFile(f, memoryId, type))
      );
      return results;
    } finally {
      setUploading(false);
    }
  }

  async function deleteMedia(mediaId: string, fileUrl: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const urlObj = new URL(fileUrl);
    const pathParts = urlObj.pathname.split("/storage/v1/object/public/memory-media/");
    if (pathParts[1]) {
      await supabase.storage.from("memory-media").remove([pathParts[1]]);
    }

    await supabase.from("memory_media").delete().eq("id", mediaId);
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
