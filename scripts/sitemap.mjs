// Writes dist/sitemap.xml and dist/robots.txt after `vite build`.
// Lists the public pages plus every real (non-sample) editor profile, read
// with the public key, so the sitemap is refreshed on every deploy. If the
// database can't be reached it still writes the public pages.
//   SITE_URL overrides the address (default: the live Vercel domain).
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const SITE = (process.env.SITE_URL ?? 'https://editme-eosin.vercel.app').replace(/\/$/, '');

function env(name) {
  if (process.env[name]) return process.env[name];
  for (const f of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'));
    if (m) return m[1].trim().replace(/^['"]|['"]$/g, '');
  }
}

const pages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/how-it-works', priority: '0.7', changefreq: 'monthly' },
  { path: '/help', priority: '0.6', changefreq: 'monthly' },
  { path: '/sign-up', priority: '0.5', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/refunds', priority: '0.3', changefreq: 'yearly' },
  { path: '/acceptable-use', priority: '0.3', changefreq: 'yearly' },
];

const url = env('VITE_SUPABASE_URL');
const key = env('VITE_SUPABASE_PUBLISHABLE_KEY');
let editors = 0;
if (url && key) {
  try {
    const res = await fetch(`${url}/rest/v1/editor_cards?select=id&is_sample=eq.false&limit=5000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    for (const { id } of await res.json()) {
      pages.push({ path: `/editors/${id}`, priority: '0.8', changefreq: 'weekly' });
      editors++;
    }
  } catch (e) {
    console.warn(`sitemap: couldn't list editors (${e.message}); writing public pages only`);
  }
} else {
  console.warn('sitemap: no Supabase env; writing public pages only');
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${today}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>
`);

// Signed-in pages have nothing for search engines.
writeFileSync('dist/robots.txt', `User-agent: *
Allow: /
Disallow: /projects
Disallow: /chat
Disallow: /wallet
Disallow: /analytics
Disallow: /profile
Disallow: /settings
Disallow: /saved
Disallow: /notifications
Disallow: /reset-password

Sitemap: ${SITE}/sitemap.xml
`);
console.log(`sitemap: ${pages.length} pages (${editors} editors) for ${SITE}`);
