export type MediaType = "photo" | "video" | "voice";

export interface Database {
  public: {
    Tables: {
      memories: {
        Row: Memory;
        Insert: MemoryInsert;
        Update: Partial<MemoryInsert>;
      };
      memory_media: {
        Row: MemoryMedia;
        Insert: MemoryMediaInsert;
        Update: Partial<MemoryMediaInsert>;
      };
    };
  };
}

export interface Memory {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  memory_date: string;
  location: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface MemoryInsert {
  title: string;
  description?: string | null;
  memory_date: string;
  location?: string | null;
  tags?: string[] | null;
  user_id?: string;
}

export interface MemoryMedia {
  id: string;
  memory_id: string;
  user_id: string;
  type: MediaType;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface MemoryMediaInsert {
  memory_id: string;
  type: MediaType;
  file_name: string;
  file_url: string;
  file_size?: number | null;
  mime_type?: string | null;
  duration_seconds?: number | null;
  user_id?: string;
}

export interface MemoryWithMedia extends Memory {
  memory_media: MemoryMedia[];
}
