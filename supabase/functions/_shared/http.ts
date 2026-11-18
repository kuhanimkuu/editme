// Small helpers shared by EditMe's edge functions.

// The sites that may call these functions from a browser:
//   APP_URL        the live site (also used for payment return links)
//   EXTRA_ORIGINS  optional, comma-separated; "*" matches one label, e.g.
//                  http://localhost:5173,https://editme-*-team.vercel.app
// Sign-in is a bearer token, not a cookie, so this isn't what protects the
// functions; it just stops other sites' pages from using them.
const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173';
const allowed = [appUrl, ...(Deno.env.get('EXTRA_ORIGINS') ?? '').split(',')]
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean)
  .map((o) => new RegExp('^' + o.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+') + '$', 'i'));

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': origin && allowed.some((re) => re.test(origin)) ? origin : appUrl,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** An error the caller should see as is (status + message). */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Runs [handler] for POST requests, answering CORS preflights and turning
 *  errors into JSON. Unexpected errors are logged and shown as a generic
 *  message, so internals never reach the browser. */
export function handlePost(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const cors = corsFor(req);
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    let res: Response;
    if (req.method !== 'POST') {
      res = json({ error: 'Use POST' }, 405);
    } else {
      try {
        res = await handler(req);
      } catch (e) {
        if (e instanceof HttpError) {
          res = json({ error: e.message }, e.status);
        } else {
          console.error(e);
          res = json({ error: 'Something went wrong. Try again.' }, 500);
        }
      }
    }
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  };
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'Expected a JSON body');
  }
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requireUuid(value: unknown, name: string): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) {
    throw new HttpError(400, `${name} must be an id`);
  }
  return value;
}

/** Compares secrets in constant time. */
export function sameSecret(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
