import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { CheckCircle, Globe, MapPin, Briefcase, Star, Eye, ArrowLeft, Play } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ErrorState, PageLoading, UserAvatar, EmptyState } from '../components/common';
import { PlanCards, PortfolioGrid, ReviewList, Stars, type ReviewRow } from '../components/editor-parts';
import { lazy, Suspense } from 'react';
import type { HireTarget } from '../components/HiringWizard';

// Loaded on the first "Hire" click, not with the page.
const HiringWizard = lazy(() => import('../components/HiringWizard').then((m) => ({ default: m.HiringWizard })));
import { useAuth } from '../context/UserContext';
import { SaveButton } from '../context/SavedContext';
import { supabase, type EditorProfile, type PortfolioItem, type Profile, type ServicePlan, type Tables } from '../../lib/supabase';
import { availabilityDot, availabilityLabels, categoryLabels, shortDate } from '../../lib/format';
import { must } from '../../lib/errors';
import { useAsync } from '../../lib/useAsync';

type Tab = 'portfolio' | 'services' | 'reviews' | 'about';

interface RealEditor {
  kind: 'real';
  profile: Profile;
  editor: EditorProfile;
  plans: ServicePlan[];
  portfolio: PortfolioItem[];
  reviews: ReviewRow[];
}
interface SampleEditor {
  kind: 'sample';
  sample: Tables<'sample_editors'>;
}

/** Reviews with the reviewer's name and picture. */
export async function loadReviews(column: 'editor_id' | 'client_id', id: string): Promise<ReviewRow[]> {
  const rows = must(await supabase.from('reviews').select('*').eq(column, id).order('created_at', { ascending: false }).limit(50));
  const otherIds = [...new Set(rows.map((r) => (column === 'editor_id' ? r.client_id : r.editor_id)).filter((x): x is string => !!x))];
  const people = otherIds.length
    ? must(await supabase.from('profiles').select('id, display_name, avatar_url').in('id', otherIds))
    : [];
  const byId = new Map(people.map((p) => [p.id, p]));
  return rows.map((r) => {
    const other = byId.get((column === 'editor_id' ? r.client_id : r.editor_id) ?? '');
    return {
      project_id: r.project_id, rating: r.rating, comment: r.comment, created_at: r.created_at,
      name: other?.display_name ?? null, avatar_url: other?.avatar_url ?? null,
    };
  });
}

export function EditorPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user, mode } = useAuth();
  const [tab, setTab] = useState<Tab>('portfolio');
  const [hire, setHire] = useState<{ target: HireTarget; planId?: string } | null>(null);

  const page = useAsync(async (): Promise<RealEditor | SampleEditor | null> => {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const [profile, editor] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('editor_profiles').select('*').eq('user_id', id).maybeSingle(),
    ]);
    if (profile.data && editor.data) {
      const [plans, portfolio, reviews] = await Promise.all([
        supabase.from('service_plans').select('*').eq('editor_id', id).eq('is_active', true).order('price_cents'),
        supabase.from('portfolio_items').select('*').eq('editor_id', id).order('created_at', { ascending: false }),
        loadReviews('editor_id', id),
      ]);
      return { kind: 'real', profile: profile.data, editor: editor.data, plans: must(plans), portfolio: must(portfolio), reviews };
    }
    const sample = await supabase.from('sample_editors').select('*').eq('id', id).maybeSingle();
    return sample.data ? { kind: 'sample', sample: sample.data } : null;
  }, [id]);

  // Counted once a day per signed-in visitor (never your own page).
  useEffect(() => {
    if (user && page.data?.kind === 'real' && user.id !== id) {
      void supabase.rpc('record_profile_view', { p_editor_id: id });
    }
  }, [user, id, page.data?.kind]);

  if (page.loading && !page.data) return <PageLoading />;
  if (page.error) return <ErrorState message="Couldn't load this profile." onRetry={page.reload} />;
  if (!page.data) {
    return (
      <EmptyState icon={<Briefcase className="w-8 h-8" />} title="Editor not found"
        text="This profile doesn't exist or isn't listed right now."
        action={<Button asChild className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0]"><Link to="/">Browse editors</Link></Button>} />
    );
  }

  /* ── Sample profile ── */
  if (page.data.kind === 'sample') {
    const s = page.data.sample;
    const reels = Array.isArray(s.portfolio) ? (s.portfolio as { title?: string; image_url?: string; video_url?: string }[]) : [];
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5"><ArrowLeft className="w-4 h-4" />Discover</Link>
        <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
          <Badge className="bg-amber-400 text-amber-950 border-none text-[11px]">Sample</Badge>
          <p className="text-sm text-gray-700">Example profile: shows what an EditMe editor page looks like. This isn't a real editor and can't be hired.</p>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <UserAvatar name={s.display_name} url={s.avatar_url} className="h-20 w-20" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{s.display_name}</h1>
            <p className="text-gray-500 text-sm">{s.headline || categoryLabels[s.category]}</p>
          </div>
        </div>
        {s.bio && <p className="text-sm text-gray-700 leading-relaxed mb-6 whitespace-pre-line">{s.bio}</p>}
        {s.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {s.skills.map((k) => <span key={k} className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600">{k}</span>)}
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {reels.map((r, i) => (
            <a key={i} href={r.video_url ?? undefined} target="_blank" rel="noopener noreferrer"
              className="group relative aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
              {r.image_url && <img src={r.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />}
              {r.video_url && <div className="absolute inset-0 flex items-center justify-center"><Play className="w-8 h-8 text-white drop-shadow" /></div>}
              {r.title && <p className="absolute bottom-0 inset-x-0 p-2 text-xs text-white bg-gradient-to-t from-black/60 to-transparent">{r.title}</p>}
            </a>
          ))}
        </div>
        <Button onClick={() => navigate('/')} className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0]">See real editors</Button>
      </div>
    );
  }

  /* ── Real editor ── */
  const { profile, editor, plans, portfolio, reviews } = page.data;
  const isMe = user?.id === profile.id;
  const canHire = !isMe && (!user || mode === 'client');
  const target: HireTarget = {
    id: profile.id, name: profile.display_name, avatarUrl: profile.avatar_url, categoryLabel: categoryLabels[editor.category],
  };
  const startHire = (planId?: string) => {
    if (!user) return navigate(`/sign-in?next=${encodeURIComponent(`/editors/${id}`)}`);
    setHire({ target, planId });
  };

  return (
    <div className="pb-12">
      <div className="h-36 bg-gradient-to-br from-[#9333ea]/80 via-[#ec4899]/60 to-[#f97316]/70" />
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative -mt-12 flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
          <div className="w-24 h-24 rounded-2xl p-[3px] bg-gradient-to-br from-[#9333ea] via-[#ec4899] to-[#f97316] shadow-xl flex-shrink-0">
            <UserAvatar name={profile.display_name} url={profile.avatar_url} className="w-full h-full rounded-[calc(1rem-3px)]" />
          </div>
          <div className="flex-1 sm:pb-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
              {profile.is_verified && <CheckCircle className="w-5 h-5 fill-[#2979FF] text-white" aria-label="Verified" />}
              <Badge variant="outline" className="text-xs border-gray-200">{categoryLabels[editor.category]}</Badge>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${availabilityDot[editor.availability]}`} />{availabilityLabels[editor.availability]}
              </span>
            </div>
            {editor.headline && <p className="text-gray-500 text-sm mb-1.5">{editor.headline}</p>}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 text-[#2979FF] hover:underline">
                  <Globe className="w-3.5 h-3.5" />{profile.website.replace(/^https:\/\//, '')}
                </a>
              )}
              <span>Member since {shortDate(profile.created_at)}</span>
            </div>
          </div>
          <div className="flex gap-2 sm:pb-1">
            {!isMe && (
              <SaveButton editorId={profile.id} name={profile.display_name} withLabel
                className="h-9 px-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50" />
            )}
            {isMe ? (
              <Button asChild variant="outline" className="rounded-xl border-gray-200"><Link to="/profile">Edit your profile</Link></Button>
            ) : canHire && plans.length > 0 ? (
              <Button onClick={() => startHire()} className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0] shadow-sm">Hire {profile.display_name.split(' ')[0]}</Button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Projects done', value: String(editor.completed_count), icon: Briefcase, color: 'text-[#2979FF]', bg: 'bg-blue-50' },
            { label: editor.rating_count ? `${editor.rating_count} review${editor.rating_count === 1 ? '' : 's'}` : 'No reviews yet',
              value: editor.rating_count ? Number(editor.rating_avg).toFixed(1) : '-', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Portfolio pieces', value: String(portfolio.length), icon: Play, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Profile views', value: String(editor.profile_views), icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}><Icon className={`w-[18px] h-[18px] ${color}`} /></div>
              <div>
                <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
                <p className="text-[11px] text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto" role="tablist">
          {(['portfolio', 'services', 'reviews', 'about'] as Tab[]).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                tab === t ? 'border-[#2979FF] text-[#2979FF]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
              {t}{t === 'reviews' && reviews.length ? ` (${reviews.length})` : ''}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {tab === 'portfolio' && (portfolio.length
            ? <PortfolioGrid items={portfolio} />
            : <EmptyState icon={<Play className="w-8 h-8" />} title="No portfolio yet" text="This editor hasn't added work samples yet." />)}
          {tab === 'services' && (plans.length
            ? <PlanCards plans={plans} onPick={canHire ? (p) => startHire(p.id) : undefined} pickLabel="Hire with this package" />
            : <EmptyState icon={<Briefcase className="w-8 h-8" />} title="No packages available" />)}
          {tab === 'reviews' && (reviews.length ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 mb-4">
                <p className="text-4xl font-bold text-gray-900">{Number(editor.rating_avg).toFixed(1)}</p>
                <div><Stars value={Number(editor.rating_avg)} /><p className="text-xs text-gray-500 mt-1">{editor.rating_count} reviews from finished projects</p></div>
              </div>
              <ReviewList reviews={reviews} />
            </>
          ) : <EmptyState icon={<Star className="w-8 h-8" />} title="No reviews yet" text="Reviews come from clients after a finished project." />)}
          {tab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">About</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{profile.bio || 'No bio yet.'}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Skills</h3>
                {editor.skills.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {editor.skills.map((k) => <span key={k} className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-700">{k}</span>)}
                  </div>
                ) : <p className="text-sm text-gray-500">None listed.</p>}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {hire && <Suspense fallback={null}><HiringWizard editor={hire.target} planId={hire.planId} isOpen onClose={() => setHire(null)} /></Suspense>}
    </div>
  );
}
