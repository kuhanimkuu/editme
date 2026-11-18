import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2';
import { HttpError } from './http.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/** Full access, bypassing row security. Server-side only, and only for the
 *  steps the browser must not do itself (recording payments, payouts). */
export function adminClient(): SupabaseClient {
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Acts as the person who called the function: their row security applies. */
export function userClient(req: Request): SupabaseClient {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** The signed-in caller, or a 401. Someone with two-step sign-in turned on
 *  must also have entered their code (the same rule as the database). */
export async function requireUser(req: Request): Promise<User> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Sign in first');
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Sign in again');
  const { data: mfaOk, error: mfaError } = await userClient(req).rpc('mfa_ok');
  if (mfaError) throw mfaError;
  if (mfaOk !== true) throw new HttpError(403, 'Enter your two-step sign-in code first');
  return data.user;
}
