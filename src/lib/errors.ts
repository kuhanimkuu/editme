import { FunctionsHttpError } from '@supabase/supabase-js';

/**
 * A message fit to show a person. The database functions already raise
 * plain-English errors ("No revisions left on this plan"); everything else
 * becomes a generic line, so internal details never reach the screen.
 */
export async function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): Promise<string> {
  if (!error) return fallback;
  // Edge functions answer { error: "..." } with an HTTP status.
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body && typeof body.error === 'string') return body.error;
    } catch {
      /* not JSON */
    }
    return fallback;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const e = error as { message?: string; code?: string };
    // Raised on purpose by our functions (custom SQLSTATEs) or auth: readable.
    if (e.code && ['P0002', '22023', '55000', '54000', '42501', '23505'].includes(e.code) && e.message) {
      return e.message;
    }
    if (e.code === '42501' || /permission denied|row-level security/i.test(e.message ?? '')) {
      return "You don't have access to that.";
    }
    if (/Failed to fetch|NetworkError|Load failed/i.test(e.message ?? '')) {
      return 'Could not reach EditMe. Check your connection.';
    }
    // Auth errors are written for people already.
    if ('status' in (error as object) && e.message && !e.code?.match(/^[0-9A-Z]{5}$/)) return e.message;
  }
  return fallback;
}

/**
 * Throws the error from a Supabase response so callers can use try/catch.
 * Lists, inserts with .single() and functions returning a value have data
 * once there's no error, so it's typed without the null. (Not for
 * .maybeSingle(), where null means "no row".)
 */
export function must<T>(result: { data: T; error: unknown }): [T] extends [null | undefined] ? T : NonNullable<T> {
  if (result.error) throw result.error;
  return result.data as [T] extends [null | undefined] ? T : NonNullable<T>;
}
