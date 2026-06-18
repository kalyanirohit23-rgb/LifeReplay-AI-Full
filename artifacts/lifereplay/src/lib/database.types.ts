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
          mood: string | null;
          tags: string[];
          people: string[];
          place: string | null;
          is_favorite: boolean;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          body?: string | null;
          memory_date: string;
          memory_type?: string | null;
          location_id?: string | null;
          mood?: string | null;
          tags?: string[];
          people?: string[];
          place?: string | null;
          is_favorite?: boolean;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string | null;
          memory_date?: string;
          memory_type?: string | null;
          location_id?: string | null;
          mood?: string | null;
          tags?: string[];
          people?: string[];
          place?: string | null;
          is_favorite?: boolean;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
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
      memory_embeddings: {
        Row: {
          memory_id: string;
          user_id: string;
          content: string;
          embedding: number[];
          embedding_model: string;
          updated_at: string;
        };
        Insert: {
          memory_id: string;
          user_id: string;
          content: string;
          embedding: number[];
          embedding_model?: string;
          updated_at?: string;
        };
        Update: {
          memory_id?: string;
          user_id?: string;
          content?: string;
          embedding?: number[];
          embedding_model?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_memories_hybrid: {
        Args: {
          query_embedding: number[];
          query_text: string;
          match_count?: number;
        };
        Returns: {
          memory_id: string;
          vector_score: number;
          keyword_score: number;
          hybrid_score: number;
        }[];
      };
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
