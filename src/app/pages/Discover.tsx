import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Search, Star, Play, CheckCircle, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { motion } from 'motion/react';
import { lazy, Suspense } from 'react';
import type { HireTarget } from '../components/HiringWizard';

// Loaded on the first "Hire" click, not with the page.
const HiringWizard = lazy(() => import('../components/HiringWizard').then((m) => ({ default: m.HiringWizard })));
import { parseVideoUrl } from '../components/editor-parts';
import { ErrorState, PageLoading, UserAvatar } from '../components/common';
import { useAuth } from '../context/UserContext';
import { supabase, type EditorCard, type EditorCategory } from '../../lib/supabase';
import { availabilityDot, availabilityLabels, categories, categoryLabels, money } from '../../lib/format';
import { publicUrl } from '../../lib/storage';
import { useAsync } from '../../lib/useAsync';
import { must } from '../../lib/errors';

const softwareOptions = ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Final Cut Pro', 'Cinema 4D', 'Blender'];

/** Real editors first (available, then best rated), samples last in their set order. */
function rank(a: EditorCard, b: EditorCard) {
  if (!!a.is_sample !== !!b.is_sample) return a.is_sample ? 1 : -1;
  if (a.is_sample) return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  const avail = Number(b.availability === 'available') - Number(a.availability === 'available');
  if (avail) return avail;
  return (b.rating_avg ?? 0) - (a.rating_avg ?? 0) || (b.completed_count ?? 0) - (a.completed_count ?? 0);
}

/** The card's picture: a sample's image, an uploaded picture, or a YouTube thumbnail. */
export function coverOf(card: EditorCard): { image?: string; video?: string } {
  if (card.cover_url) return { image: card.cover_url };
  if (card.cover_path) {
    const url = publicUrl('portfolio', card.cover_path);
    return /\.(mp4|mov|webm)$/i.test(card.cover_path) ? { video: url } : { image: url };
  }
  const ref = parseVideoUrl(card.cover_video_url);
  return ref?.kind === 'youtube' ? { image: `https://i.ytimg.com/vi/${ref.id}/hqdefault.jpg` } : {};
}

export function Discover() {
  const { user, mode } = useAuth();
  const isClient = !user || mode === 'client';
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') ?? '').trim().toLowerCase();

  const [category, setCategory] = useState<EditorCategory | 'all'>('all');
  const [showFilters, setShowFilters] = useState(true);
  const [showSamples, setShowSamples] = useState(true);
  const [minRating, setMinRating] = useState(0);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [software, setSoftware] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState('');
  const [hire, setHire] = useState<HireTarget | null>(null);

  const cards = useAsync(async () => {
    const rows = must(await supabase.from('editor_cards').select('*').limit(500));
    return rows.filter((r): r is EditorCard & { id: string } => !!r.id).sort(rank);
  }, []);

  const filtered = useMemo(() => {
    const max = Number(maxPrice) * 100;
    return (cards.data ?? []).filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (!showSamples && e.is_sample) return false;
      if (onlyAvailable && e.availability !== 'available') return false;
      if (minRating && (e.is_sample || (e.rating_avg ?? 0) < minRating)) return false;
      if (max > 0 && (e.starting_price_cents ?? 0) > max) return false;
      if (software.length && !software.every((s) => e.skills?.some((k) => k.toLowerCase() === s.toLowerCase()))) return false;
      if (query) {
        const hay = [e.display_name, e.headline, ...(e.skills ?? []), e.category ? categoryLabels[e.category] : '']
          .join(' ').toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [cards.data, category, showSamples, onlyAvailable, minRating, maxPrice, software, query]);

  const realCount = filtered.filter((e) => !e.is_sample).length;
  const sampleCount = filtered.length - realCount;
  const filtersOn = category !== 'all' || minRating > 0 || onlyAvailable || software.length > 0 || !!maxPrice || !!query;

  const resetFilters = () => {
    setCategory('all');
    setMinRating(0);
    setOnlyAvailable(false);
    setSoftware([]);
    setMaxPrice('');
    if (query) setParams({});
  };

  const startHire = (e: EditorCard & { id: string }) => {
    if (!user) {
      navigate(`/sign-in?next=${encodeURIComponent(`/editors/${e.id}`)}`);
      return;
    }
    setHire({
      id: e.id,
      name: e.display_name ?? 'Editor',
      avatarUrl: e.avatar_url,
      categoryLabel: e.category ? categoryLabels[e.category] : '',
    });
  };

  // Samples can't be hired: point to real editors in the same category.
  const showSimilar = (e: EditorCard) => {
    if (e.category) setCategory(e.category);
    setShowSamples(false);
  };

  const categoryPill = (value: EditorCategory | 'all', label: string, compact = false) => (
    <button key={value} onClick={() => setCategory(value)} aria-pressed={category === value}
      className={compact
        ? `flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            category === value ? 'bg-[#2979FF] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#2979FF] hover:text-[#2979FF]'}`
        : `w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
            category === value ? 'bg-[#EFF6FF] text-[#2979FF]' : 'text-gray-600 hover:bg-gray-50'}`}>
      {label}
    </button>
  );

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)]">
      {/* ── Filter sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ width: showFilters ? 256 : 0, opacity: showFilters ? 1 : 0 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="flex-shrink-0 overflow-hidden border-r border-gray-100 bg-white hidden lg:block"
      >
        <div className="w-64 h-full overflow-y-auto">
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Filters</span>
              {filtersOn && <button onClick={resetFilters} className="text-xs text-[#2979FF] hover:underline">Reset all</button>}
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Specialization</p>
              <div className="space-y-0.5">
                {categoryPill('all', 'All')}
                {categories.map((c) => categoryPill(c, categoryLabels[c]))}
              </div>
            </div>

            <div>
              <label htmlFor="max-price" className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Starting price up to</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                <Input id="max-price" inputMode="numeric" placeholder="Any" value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))}
                  className="h-8 rounded-lg text-xs bg-gray-50 border-transparent pl-6" />
              </div>
            </div>

            <fieldset>
              <legend className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Min. rating</legend>
              <div className="space-y-1.5">
                {[0, 5, 4, 3].map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="rating" className="accent-[#2979FF]" checked={minRating === r} onChange={() => setMinRating(r)} />
                    {r === 0 ? <span className="text-xs text-gray-600">Any</span> : (
                      <>
                        <span className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < r ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                          ))}
                        </span>
                        <span className="text-xs text-gray-500">{r === 5 ? '5' : `${r}+`}</span>
                      </>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Availability</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-[#2979FF]" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
                <span className={`w-2 h-2 rounded-full ${availabilityDot.available}`} />
                <span className="text-xs text-gray-600">Available now</span>
              </label>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Software</p>
              <div className="space-y-1.5">
                {softwareOptions.map((sw) => (
                  <label key={sw} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[#2979FF]" checked={software.includes(sw)}
                      onChange={(e) => setSoftware((prev) => (e.target.checked ? [...prev, sw] : prev.filter((x) => x !== sw)))} />
                    <span className="text-xs text-gray-600">{sw}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="sticky top-16 z-20 bg-[#F7F8FA] border-b border-gray-100 px-5 py-2.5 flex items-center gap-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex-shrink-0 ${
              showFilters ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2979FF]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {showFilters ? 'Hide filters' : 'Filters'}
          </button>
          <div className="w-px h-5 bg-gray-200 hidden lg:block flex-shrink-0" />
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
            {categoryPill('all', 'All', true)}
            {categories.map((c) => categoryPill(c, categoryLabels[c], true))}
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 hidden md:block">
            {realCount} {realCount === 1 ? 'editor' : 'editors'}
            {sampleCount > 0 && ` · ${sampleCount} ${sampleCount === 1 ? 'sample' : 'samples'}`}
          </span>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {query && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              Results for <span className="font-semibold text-gray-900">"{params.get('q')}"</span>
              <button onClick={() => setParams({})} className="p-1 rounded-full hover:bg-gray-200" aria-label="Clear search"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {!isClient && (
            <div className="mb-5 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#9333ea]/10 flex items-center justify-center flex-shrink-0 text-base">🎨</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">You're browsing as an Editor</p>
                <p className="text-xs text-gray-600">See how other editors present their work, or switch to Client mode to hire.</p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-none text-xs">Editor Mode</Badge>
            </div>
          )}

          {sampleCount > 0 && (
            <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
              <Badge className="bg-amber-400 text-amber-950 border-none text-[11px] flex-shrink-0">Sample</Badge>
              <p className="flex-1 text-xs text-gray-700">
                Profiles marked Sample show what EditMe looks like. They aren't real editors and can't be hired.
                Real editors always appear first.
              </p>
              <button onClick={() => setShowSamples(false)} className="text-xs font-medium text-[#2979FF] hover:underline flex-shrink-0">Hide samples</button>
            </div>
          )}

          {cards.loading && !cards.data ? <PageLoading label="Finding editors" /> :
           cards.error ? <ErrorState message="Couldn't load editors." onRetry={cards.reload} /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((editor, i) => {
              const cover = coverOf(editor);
              const name = editor.display_name ?? 'Editor';
              const isMe = editor.id === user?.id;
              return (
                <motion.div
                  key={editor.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 12) * 0.035 }}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/80 transition-all duration-300"
                >
                  <Link to={`/editors/${editor.id}`} className="block relative aspect-video bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
                    {cover.image ? (
                      <img src={cover.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : cover.video ? (
                      <video src={cover.video} muted preload="metadata" className="w-full h-full object-cover" />
                    ) : null}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 text-[#2979FF] fill-[#2979FF] ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                      {editor.category && (
                        <Badge className="bg-black/55 text-white border-none text-[11px] backdrop-blur-sm">{categoryLabels[editor.category]}</Badge>
                      )}
                      {editor.is_sample && <Badge className="bg-amber-400 text-amber-950 border-none text-[11px]">Sample</Badge>}
                    </div>
                    {editor.availability && (
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <span className={`w-2 h-2 rounded-full ${availabilityDot[editor.availability]}`} />
                        <span className="text-white text-[11px] font-medium drop-shadow">{availabilityLabels[editor.availability]}</span>
                      </div>
                    )}
                  </Link>

                  <div className="p-3.5">
                    <Link to={`/editors/${editor.id}`} className="flex items-start gap-2.5 mb-2.5">
                      <div className="relative flex-shrink-0">
                        <UserAvatar name={name} url={editor.avatar_url} className="h-9 w-9 border-2 border-white shadow-sm" />
                        {editor.is_verified && (
                          <CheckCircle className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 fill-[#2979FF] text-white" aria-label="Verified" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[13.5px] text-gray-900 truncate">{name}</h3>
                        <p className="text-[11.5px] text-gray-500 truncate leading-snug">{editor.headline || (editor.category ? categoryLabels[editor.category] : '')}</p>
                      </div>
                    </Link>

                    {editor.is_sample ? (
                      <p className="mb-2.5 text-[12px] text-gray-400">Example profile · not taking work</p>
                    ) : (
                      <div className="flex items-center gap-3 mb-2.5 text-[12px]">
                        {(editor.rating_count ?? 0) > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-gray-900">{Number(editor.rating_avg).toFixed(1)}</span>
                            <span className="text-gray-400">({editor.rating_count})</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">New</Badge>
                        )}
                        {(editor.completed_count ?? 0) > 0 && (
                          <span className="text-gray-400">{editor.completed_count} done</span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3 min-h-[22px]">
                      {(editor.skills ?? []).slice(0, 3).map((skill) => (
                        <span key={skill} className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-full text-[11px] text-gray-600 font-medium">{skill}</span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        {editor.starting_price_cents != null ? (
                          <>
                            <span className="text-[11px] text-gray-500">From </span>
                            <span className="text-[17px] font-bold text-gray-900">{money(editor.starting_price_cents)}</span>
                          </>
                        ) : <span className="text-xs text-gray-400">Price on request</span>}
                      </div>
                      {editor.is_sample ? (
                        <Button size="sm" variant="outline" onClick={() => showSimilar(editor)}
                          className="rounded-xl h-8 px-3.5 text-xs font-medium border-gray-200">
                          Similar editors
                        </Button>
                      ) : isClient && !isMe ? (
                        <Button size="sm" onClick={() => startHire(editor)}
                          className="bg-[#2979FF] hover:bg-[#1565C0] text-white rounded-xl h-8 px-3.5 text-xs font-medium shadow-sm">
                          Hire Now
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="outline" className="rounded-xl h-8 px-3.5 text-xs font-medium border-gray-200">
                          <Link to={`/editors/${editor.id}`}>{isMe ? 'Your profile' : 'View'}</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          )}

          {!cards.loading && !cards.error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <Search className="w-7 h-7 text-gray-300" />
              </div>
              {filtersOn ? (
                <>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">No editors match</h3>
                  <p className="text-sm text-gray-500 mb-4">Try fewer filters or a different search.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl text-sm" onClick={resetFilters}>Clear filters</Button>
                    {!showSamples && <Button variant="outline" className="rounded-xl text-sm" onClick={() => setShowSamples(true)}>Show examples</Button>}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">No editors here yet</h3>
                  <p className="text-sm text-gray-500 mb-4">New editors are joining. Are you one?</p>
                  <div className="flex gap-2">
                    <Button asChild className="rounded-xl text-sm bg-[#2979FF] hover:bg-[#1565C0]">
                      <Link to={user ? '/profile' : '/sign-up?as=editor'}>Offer your services</Link>
                    </Button>
                    {!showSamples && <Button variant="outline" className="rounded-xl text-sm" onClick={() => setShowSamples(true)}>Show examples</Button>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {hire && <Suspense fallback={null}><HiringWizard editor={hire} isOpen onClose={() => setHire(null)} /></Suspense>}
    </div>
  );
}
