import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
let rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Auto-correct if the two secrets were entered in swapped order
if (rawUrl && rawKey) {
  const urlLooksLikeUrl = rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
  const keyLooksLikeUrl = rawKey.startsWith("http://") || rawKey.startsWith("https://");
  if (!urlLooksLikeUrl && keyLooksLikeUrl) {
    // Swap them
    [rawUrl, rawKey] = [rawKey, rawUrl];
  }
}

if (!rawUrl || !rawKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
    "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Replit Secrets."
  );
}

export const supabase = createClient<Database>(rawUrl, rawKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
