export type MediaType = "photo" | "video" | "voice";

export type MemoryType =
  | "personal"
  | "travel"
  | "family"
  | "work"
  | "celebration"
  | "milestone"
  | "other";

export const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  personal:    "Personal",
  travel:      "Travel",
  family:      "Family",
  work:        "Work",
  celebration: "Celebration",
  milestone:   "Milestone",
  other:       "Other",
};

export type Database = {
  public: {
    Tables: {
      memories: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string | null;
          memory_date: string;
          memory_type: string | null;
          location_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          body?: string | null;
          memory_date: string;
          memory_type?: string | null;
          location_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string | null;
          memory_date?: string;
          memory_type?: string | null;
          location_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      memory_media: {
        Row: {
          id: string;
          memory_id: string;
          user_id: string;
          type: string;
          file_name: string;
          file_url: string;
          file_size: number | null;
          mime_type: string | null;
          duration_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          memory_id: string;
          user_id?: string;
          type: string;
          file_name: string;
          file_url: string;
          file_size?: number | null;
          mime_type?: string | null;
          duration_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          memory_id?: string;
          user_id?: string;
          type?: string;
          file_name?: string;
          file_url?: string;
          file_size?: number | null;
          mime_type?: string | null;
          duration_seconds?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Memory    = Database["public"]["Tables"]["memories"]["Row"];
export type MemoryInsert = Database["public"]["Tables"]["memories"]["Insert"];

export type MemoryMedia = Database["public"]["Tables"]["memory_media"]["Row"] & {
  type: MediaType;
};
export type MemoryMediaInsert = Database["public"]["Tables"]["memory_media"]["Insert"] & {
  type: MediaType;
};

export interface MemoryWithMedia extends Memory {
  memory_media: MemoryMedia[];
}
