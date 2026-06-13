import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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

      const { data, error } = await query;
      if (error) throw error;
      setMemories((data as MemoryWithMedia[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load memories");
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.year, filters?.location,
      JSON.stringify(filters?.tags), filters?.mediaType]);

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
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setMemory(data as MemoryWithMedia);
        setLoading(false);
      });
  }, [id]);

  return { memory, loading, error };
}

export async function createMemory(input: MemoryInsert): Promise<Memory> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("memories")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Memory;
}

export async function updateMemory(id: string, input: Partial<MemoryInsert>): Promise<Memory> {
  const { data, error } = await supabase
    .from("memories")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Memory;
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await supabase.from("memories").delete().eq("id", id);
  if (error) throw error;
}

export function useAvailableYears() {
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    supabase
      .from("memories")
      .select("memory_date")
      .order("memory_date", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const uniqueYears = [...new Set(
          data.map(m => new Date(m.memory_date).getFullYear())
        )].sort((a, b) => b - a);
        setYears(uniqueYears);
      });
  }, []);

  return years;
}
