import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toError, interpretSupabaseError } from "@/lib/errors";
import type { Memory, MemoryInsert, MemoryWithMedia } from "@/lib/database.types";

export interface SearchFilters {
  query?: string;
  year?: number;
  memoryType?: string;
}

const TABLE = "memories" as const;

export function useMemories(filters?: SearchFilters) {
  const [memories, setMemories] = useState<MemoryWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const buildQuery = (select: string) => {
        let q = supabase
          .from(TABLE)
          .select(select)
          .order("memory_date", { ascending: false });

        if (filters?.query) {
          q = q.or(`title.ilike.%${filters.query}%,body.ilike.%${filters.query}%`);
        }
        if (filters?.year) {
          const start = `${filters.year}-01-01`;
          const end   = `${filters.year}-12-31`;
          q = q.gte("memory_date", start).lte("memory_date", end);
        }
        if (filters?.memoryType) {
          q = q.eq("memory_type", filters.memoryType);
        }
        return q;
      };

      // Try with media join first; fall back to plain select on PGRST200
      let { data, error: qErr } = await buildQuery("*, memory_media(*)");
      if (qErr?.code === "PGRST200") {
        console.warn("[useMemories] memory_media FK not found, fetching without media join");
        ({ data, error: qErr } = await buildQuery("*"));
      }
      if (qErr) throw qErr;

      // Attach empty memory_media array if join wasn't available
      const rawRows = (data ?? []) as unknown as Record<string, unknown>[];
      const rows = rawRows.map((m) =>
        Array.isArray(m.memory_media) ? m : { ...m, memory_media: [] }
      );
      setMemories(rows as unknown as MemoryWithMedia[]);
    } catch (err) {
      const msg = interpretSupabaseError(err);
      console.error(`[useMemories] fetch error from table "${TABLE}":`, err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    filters?.query,
    filters?.year,
    filters?.memoryType,
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

    const fetchOne = async () => {
      // Try with media join first
      let { data, error: qErr } = await supabase
        .from(TABLE)
        .select("*, memory_media(*)")
        .eq("id", id)
        .single();

      // Fall back to plain select if no FK relation
      if (qErr?.code === "PGRST200") {
        console.warn("[useMemory] memory_media FK not found, fetching without media join");
        ({ data, error: qErr } = await supabase
          .from(TABLE)
          .select("*")
          .eq("id", id)
          .single());
      }

      if (qErr) {
        console.error(`[useMemory] fetch error from table "${TABLE}":`, qErr);
        setError(interpretSupabaseError(qErr));
      } else {
        const row = data as Record<string, unknown>;
        setMemory({
          ...row,
          memory_media: Array.isArray(row.memory_media) ? row.memory_media : [],
        } as unknown as MemoryWithMedia);
      }
      setLoading(false);
    };

    fetchOne();
  }, [id]);

  return { memory, loading, error };
}

export interface CreateMemoryInput {
  title: string;
  body: string | null;
  memory_date: string;
  memory_type: string | null;
}

export async function createMemory(input: CreateMemoryInput): Promise<Memory> {
  // ── 1. Require authenticated user ────────────────────────────────────
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    const msg = authError?.message ?? "No authenticated session found.";
    console.error("[createMemory] ❌ getUser() failed:", authError);
    throw new Error(`Authentication error: ${msg}. Please sign in again.`);
  }
  const user_id = authData.user.id;

  // ── 2. Build the exact insert payload ────────────────────────────────
  const payload: {
    user_id: string;
    title: string;
    body: string | null;
    memory_date: string;
    memory_type: string | null;
  } = {
    user_id,
    title:       input.title,
    body:        input.body,
    memory_date: input.memory_date,
    memory_type: input.memory_type,
  };

  // ── 3. Log what is being inserted ────────────────────────────────────
  console.group(`[createMemory] INSERT into "${TABLE}"`);
  console.log("Table        :", TABLE);
  console.log("Columns      :", Object.keys(payload));
  console.log("user_id      :", user_id);
  console.log("Full payload :", JSON.stringify(payload, null, 2));
  console.groupEnd();
  // ─────────────────────────────────────────────────────────────────────

  // ── 4. Insert ─────────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    // Log every field of the raw Supabase error so nothing is hidden
    console.group(`[createMemory] ❌ Supabase INSERT error on "${TABLE}"`);
    console.error("message :", error.message);
    console.error("code    :", error.code);
    console.error("hint    :", error.hint);
    console.error("details :", error.details);
    console.error("Full error object:", error);
    console.error("Payload that caused this:", JSON.stringify(payload, null, 2));
    console.groupEnd();
    throw toError(interpretSupabaseError(error));
  }

  console.log(`[createMemory] ✅ success — id: ${(data as Memory).id}`);
  return data as Memory;
}

export async function updateMemory(id: string, input: Partial<MemoryInsert>): Promise<Memory> {
  const payload = { ...input };
  console.group(`[updateMemory] UPDATE "${TABLE}" id=${id}`);
  console.log("Columns being sent:", Object.keys(payload));
  console.log("Full payload:", JSON.stringify(payload, null, 2));
  console.groupEnd();

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.group(`[updateMemory] ❌ Supabase error on UPDATE "${TABLE}"`);
    console.error("message :", error.message);
    console.error("code    :", error.code);
    console.error("hint    :", error.hint);
    console.error("details :", error.details);
    console.groupEnd();
    throw toError(interpretSupabaseError(error));
  }

  return data as Memory;
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    console.error(`[deleteMemory] Supabase error on DELETE "${TABLE}":`, error);
    throw toError(interpretSupabaseError(error));
  }
}

export function useAvailableYears() {
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    supabase
      .from(TABLE)
      .select("memory_date")
      .order("memory_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.warn(`[useAvailableYears] error on "${TABLE}":`, error);
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
