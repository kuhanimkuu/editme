import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Heart, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { EmptyState, ErrorState, PageLoading, UserAvatar } from '../components/common';
import type { HireTarget } from '../components/HiringWizard';
import { useAuth } from '../context/UserContext';
import { SaveButton, useSaved } from '../context/SavedContext';
import { coverOf } from './Discover';
import { supabase, type EditorCard } from '../../lib/supabase';
import { availabilityDot, availabilityLabels, categoryLabels, money } from '../../lib/format';
import { must } from '../../lib/errors';
import { useAsync } from '../../lib/useAsync';

const HiringWizard = lazy(() => import('../components/HiringWizard').then((m) => ({ default: m.HiringWizard })));

/** The editors this person saved, newest first. */
export function Saved() {
  const { user, mode } = useAuth();
  const uid = user!.id;
  const { ids } = useSaved();
  const [hire, setHire] = useState<HireTarget | null>(null);

  const data = useAsync(async () => {
    const saved = must(await supabase.from('saved_editors').select('editor_id, created_at').eq('user_id', uid).order('created_at', { ascending: false }));
    if (!saved.length) return [] as (EditorCard & { id: string })[];
    const cards = must(await supabase.from('editor_cards').select('*').in('id', saved.map((s) => s.editor_id)));
    const byId = new Map(cards.map((c) => [c.id, c]));
    // Editors who stopped listing themselves drop out of editor_cards.
    return saved.map((s) => byId.get(s.editor_id)).filter((c): c is EditorCard & { id: string } => !!c?.id);
  }, [uid]);

  // Un-saving here hides the card straight away.
  const list = (data.data ?? []).filter((c) => ids.has(c.id));

  if (data.loading && !data.data) return <PageLoading label="Loading saved editors" />;
  if (data.error) return <ErrorState message="Couldn't load your saved editors." onRetry={data.reload} />;

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Saved editors</h1>
        <p className="text-gray-600">Your shortlist. Tap the heart on any editor to add them here.</p>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Heart className="w-8 h-8" />} title="Nothing saved yet"
          text="Save editors you like while browsing, then compare and hire from here."
          action={<Button asChild className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0]"><Link to="/">Browse editors</Link></Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((e, i) => {
            const cover = coverOf(e);
            const name = e.display_name ?? 'Editor';
            return (
              <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 9) * 0.04 }}
                className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all">
                <Link to={`/editors/${e.id}`} className="block aspect-video bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                  {cover.image ? <img src={cover.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                    : cover.video ? <video src={cover.video} muted preload="metadata" className="w-full h-full object-cover" /> : null}
                </Link>
                <SaveButton editorId={e.id} name={name} className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 shadow-sm" />
                <div className="p-4">
                  <Link to={`/editors/${e.id}`} className="flex items-center gap-3 mb-3">
                    <UserAvatar name={name} url={e.avatar_url} className="h-10 w-10" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{name}</h3>
                      <p className="text-xs text-gray-500 truncate">{e.headline || (e.category ? categoryLabels[e.category] : '')}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    {e.category && <Badge variant="outline" className="text-[11px] border-gray-200">{categoryLabels[e.category]}</Badge>}
                    {e.availability && (
                      <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${availabilityDot[e.availability]}`} />{availabilityLabels[e.availability]}</span>
                    )}
                    {(e.rating_count ?? 0) > 0 && (
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{Number(e.rating_avg).toFixed(1)} ({e.rating_count})</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm">{e.starting_price_cents != null ? <>From <span className="font-bold text-gray-900">{money(e.starting_price_cents)}</span></> : ''}</span>
                    {mode === 'client' ? (
                      <Button size="sm" className="rounded-xl h-8 bg-[#2979FF] hover:bg-[#1565C0] text-xs"
                        onClick={() => setHire({ id: e.id, name, avatarUrl: e.avatar_url, categoryLabel: e.category ? categoryLabels[e.category] : '' })}>
                        Hire
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="rounded-xl h-8 text-xs border-gray-200"><Link to={`/editors/${e.id}`}>View</Link></Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      {hire && <Suspense fallback={null}><HiringWizard editor={hire} isOpen onClose={() => setHire(null)} /></Suspense>}
    </div>
  );
}
