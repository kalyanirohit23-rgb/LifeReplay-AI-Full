/** Supabase PostgrestError / StorageError — plain object, NOT instanceof Error */
interface SupabaseError {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
  error?: string;
  error_description?: string;
  status?: number;
  statusCode?: number;
}

/**
 * Extracts a human-readable message from any thrown value,
 * including Supabase PostgrestError and StorageError objects.
 */
export function getErrorMessage(err: unknown): string {
  if (!err) return "An unknown error occurred";

  // Standard JS Error
  if (err instanceof Error) return err.message;

  // Supabase / Postgrest error object
  const e = err as SupabaseError;
  if (typeof e === "object") {
    const msg = e.message ?? e.error_description ?? e.error ?? "";
    const hint = e.hint ? ` Hint: ${e.hint}` : "";
    const details = e.details ? ` Details: ${e.details}` : "";
    const code = e.code ? ` [${e.code}]` : "";
    if (msg) return `${msg}${hint}${details}${code}`;
  }

  if (typeof err === "string") return err;
  return JSON.stringify(err);
}

/**
 * Wraps any thrown value as a real Error so callers can use instanceof checks.
 */
export function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(getErrorMessage(err));
}

/**
 * Returns a helpful user-facing message for common Supabase error codes.
 */
export function interpretSupabaseError(err: unknown): string {
  const msg = getErrorMessage(err);
  const e = err as SupabaseError;
  const code = e?.code ?? "";

  // Table doesn't exist
  if (code === "42P01" || msg.includes("relation") || msg.includes("does not exist")) {
    return (
      "Database tables are not set up yet. " +
      "Please run the SQL setup script in your Supabase dashboard. " +
      `(Original: ${msg})`
    );
  }

  // RLS / permission denied
  if (code === "42501" || msg.toLowerCase().includes("permission denied") || msg.toLowerCase().includes("row-level security")) {
    return (
      "Permission denied — check your Supabase Row Level Security policies. " +
      `(Original: ${msg})`
    );
  }

  // JWT / auth
  if (msg.toLowerCase().includes("jwt") || msg.toLowerCase().includes("not authenticated")) {
    return "Your session has expired. Please sign in again.";
  }

  return msg;
}
