import { supabase, supabaseKey, supabaseUrl } from './supabase';
import { LEGAL } from './legal';

/*
 * "Continue with Google". Google sends people back to /sign-in?next=..., where
 * the usual sign-in page takes over (two-step code if they have one, then on to
 * `next`). What they agreed to before leaving is kept in sessionStorage and
 * saved on the account when they come back (UserContext).
 */

const PENDING = 'editme.oauth';
const MAX_AGE_MS = 15 * 60 * 1000;

type Pending = { terms: string; role: 'client' | 'editor'; at: number };

let enabled: Promise<boolean> | null = null;

/** Whether Google sign-in is switched on for this Supabase project (asked once per page load). */
export function googleEnabled(): Promise<boolean> {
  enabled ??= fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseKey } })
    .then((r) => (r.ok ? r.json() : null))
    .then((s) => !!s?.external?.google)
    .catch(() => false);
  return enabled;
}

export async function continueWithGoogle(next: string, role: 'client' | 'editor' = 'client') {
  try {
    sessionStorage.setItem(PENDING, JSON.stringify({ terms: LEGAL.version, role, at: Date.now() } satisfies Pending));
  } catch {
    /* private window: the account just won't record the terms version */
  }
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/sign-in?next=${encodeURIComponent(next)}`,
      // Let people pick which Google account, instead of silently using the last one.
      queryParams: { prompt: 'select_account' },
    },
  });
}

/** What the person agreed to before going to Google, if they just came back from there. Read once. */
export function takePendingOAuth(): Pending | null {
  try {
    const raw = sessionStorage.getItem(PENDING);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING);
    const p = JSON.parse(raw) as Pending;
    return Date.now() - p.at < MAX_AGE_MS ? p : null;
  } catch {
    return null;
  }
}

/** An error Google or Supabase sent back in the address (e.g. the person pressed Cancel). */
export function oauthErrorFromUrl(): string | null {
  const read = (s: string) => new URLSearchParams(s.replace(/^[#?]/, ''));
  const q = read(window.location.search);
  const h = read(window.location.hash);
  const code = q.get('error') ?? h.get('error');
  const description = q.get('error_description') ?? h.get('error_description');
  if (!code && !description) return null;
  if (code === 'access_denied') return 'Google sign-in was cancelled.';
  return description ? `Google sign-in didn't work: ${description.replace(/\+/g, ' ')}` : "Google sign-in didn't work. Try again.";
}
