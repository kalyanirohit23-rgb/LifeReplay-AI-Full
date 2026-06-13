import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toError, interpretSupabaseError } from "@/lib/errors";
import type { Memory, MemoryInsert, MemoryWithMedia } from "@/lib/database.types";

export interface SearchFilters {
  query?: string;
  year?: number;
  location?: string;
  tags?: string[];
  mediaType?: "photo" | "video" | "voice";
}

export function useMemories(filters?: SearchFilters) {
  const [memories, setMemories] = useState<MemoryWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("memories")
        .select("*, memory_media(*)")
        .order("memory_date", { ascending: false });

      if (filters?.query) {
        query = query.or(
          `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,location.ilike.%${filters.query}%`
        );
      }

      if (filters?.year) {
        const start = `${filters.year}-01-01`;
        const end = `${filters.year}-12-31`;
        query = query.gte("memory_date", start).lte("memory_date", end);
      }

      if (filters?.location) {
        query = query.ilike("location", `%${filters.location}%`);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps("tags", filters.tags);
      }

      const { data, error: qErr } = await query;
      if (qErr) throw qErr;
      setMemories((data as unknown as MemoryWithMedia[]) ?? []);
    } catch (err) {
      const msg = interpretSupabaseError(err);
      console.error("[useMemories] fetch error:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    filters?.query,
    filters?.year,
    filters?.location,
    JSON.stringify(filters?.tags),
    filters?.mediaType,
  ]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  return { memories, loading, error, refetch: fetchMemories };
}

export function useMemory(id: string) {
  const [memory, setMemory] = useState<MemoryWithMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("memories")
      .select("*, memory_media(*)")
      .eq("id", id)
      .single()
      .then(({ data, error: qErr }) => {
        if (qErr) {
          console.error("[useMemory] fetch error:", qErr);
          setError(interpretSupabaseError(qErr));
        } else {
          setMemory(data as unknown as MemoryWithMedia);
        }
        setLoading(false);
      });
  }, [id]);

  return { memory, loading, error };
}

export async function createMemory(input: MemoryInsert): Promise<Memory> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated. Please sign in again.");

  console.log("[createMemory] inserting:", { ...input, user_id: user.id });

  const { data, error } = await supabase
    .from("memories")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error("[createMemory] Supabase error:", error);
    throw toError(interpretSupabaseError(error));
  }

  console.log("[createMemory] success:", data);
  return data as Memory;
}

export async function updateMemory(id: string, input: Partial<MemoryInsert>): Promise<Memory> {
  console.log("[updateMemory] updating:", id, input);

  const { data, error } = await supabase
    .from("memories")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[updateMemory] Supabase error:", error);
    throw toError(interpretSupabaseError(error));
  }

  return data as Memory;
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await supabase.from("memories").delete().eq("id", id);
  if (error) {
    console.error("[deleteMemory] Supabase error:", error);
    throw toError(interpretSupabaseError(error));
  }
}

export function useAvailableYears() {
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    supabase
      .from("memories")
      .select("memory_date")
      .order("memory_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          // Silently ignore — years filter just won't show up
          console.warn("[useAvailableYears] error:", error);
          return;
        }
        if (!data) return;
        const uniqueYears = [
          ...new Set(data.map((m) => new Date(m.memory_date).getFullYear())),
        ].sort((a, b) => b - a);
        setYears(uniqueYears);
      });
  }, []);

  return years;
}
