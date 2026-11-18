import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import {
  MapPin, Globe, Star, Briefcase, Edit, Upload, CheckCircle, Camera,
  DollarSign, Users, Eye, ExternalLink, MessageSquare, Plus,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { EmptyState, ErrorState, PageLoading, Spinner, UserAvatar } from '../components/common';
import { PlanCards, PortfolioGrid, ReviewList } from '../components/editor-parts';
import { EditorSetup, EditProfileDialog, PlanEditDialog } from '../components/ProfileForms';
import { UploadModal } from '../components/UploadModal';
import { useAuth } from '../context/UserContext';
import { loadReviews } from './EditorPage';
import { supabase, type PortfolioItem, type ServicePlan } from '../../lib/supabase';
import { availabilityDot, availabilityLabels, categoryLabels, moneyShort, shortDate, statusColors, statusLabels } from '../../lib/format';
import { errorMessage, must } from '../../lib/errors';
import { MB, uploadPath } from '../../lib/storage';
import { useAsync } from '../../lib/useAsync';

type EditorTab = 'portfolio' | 'services' | 'reviews' | 'about';
type ClientTab = 'projects' | 'editors' | 'reviews';

export function Profile() {
  const { user, profile, editorProfile, mode, refreshProfile, ready } = useAuth();
  if (!ready || !profile) return <PageLoading />;
  if (mode === 'editor' && !editorProfile) return <EditorSetup uid={user!.id} onDone={refreshProfile} />;
  return mode === 'editor' ? <EditorView /> : <ClientView />;
}

/** Avatar with a camera button: uploads to avatars/<uid>/ and saves the path. */
function AvatarEditor({ className }: { className: string }) {
  const { user, profile, refreshProfile } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file || !user) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast.error('Use a JPG, PNG or WebP picture.');
    if (file.size > 5 * MB) return toast.error('Pictures can be up to 5 MB.');
    setBusy(true);
    try {
      const path = uploadPath(user.id, file);
      const up = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const old = profile?.avatar_url;
      must(await supabase.from('profiles').update({ avatar_url: path }).eq('id', user.id));
      // The previous picture, if it was one of ours.
      if (old && old.startsWith(`${user.id}/`)) void supabase.storage.from('avatars').remove([old]);
      await refreshProfile();
      toast.success('Picture updated');
    } catch (e) {
      toast.error(await errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <UserAvatar name={profile?.display_name} url={profile?.avatar_url} className="w-full h-full rounded-[inherit]" />
      <button onClick={() => input.current?.click()} disabled={busy} aria-label="Change picture"
        className="absolute inset-0 rounded-[inherit] bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
        {busy ? <Spinner className="text-white" /> : <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />}
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
        onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

function Stat({ label, value, icon: Icon, color, bg }: { label: string; value: string; icon: typeof Star; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}><Icon className={`w-[18px] h-[18px] ${color}`} /></div>
      <div>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-[11px] text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function Tabs<T extends string>({ tabs, value, onChange }: { tabs: T[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto" role="tablist">
      {tabs.map((tab) => (
        <button key={tab} role="tab" aria-selected={value === tab} onClick={() => onChange(tab)}
          className={`px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
            value === tab ? 'border-[#2979FF] text-[#2979FF]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
          {tab}
        </button>
      ))}
    </div>
  );
}

function Details() {
  const { profile } = useAuth();
  if (!profile) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
      {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>}
      {profile.website && (
        <a href={profile.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 text-[#2979FF] hover:underline">
          <Globe className="w-3.5 h-3.5" />{profile.website.replace(/^https:\/\//, '')}
        </a>
      )}
      <span>Joined {shortDate(profile.created_at)}</span>
    </div>
  );
}

/* ═════════════ Editor ═════════════ */

function EditorView() {
  const { user, profile, editorProfile, refreshProfile } = useAuth();
  const uid = user!.id;
  const editor = editorProfile!;
  const [tab, setTab] = useState<EditorTab>('portfolio');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<ServicePlan | null>(null);

  const data = useAsync(async () => {
    const [plans, portfolio, reviews, wallet] = await Promise.all([
      supabase.from('service_plans').select('*').eq('editor_id', uid).order('price_cents'),
      supabase.from('portfolio_items').select('*').eq('editor_id', uid).order('created_at', { ascending: false }),
      loadReviews('editor_id', uid),
      supabase.rpc('wallet_summary'),
    ]);
    return { plans: must(plans), portfolio: must(portfolio), reviews, earned: must(wallet)[0]?.total_earned_cents ?? 0 };
  }, [uid]);

  const removeItem = async (item: PortfolioItem) => {
    if (!window.confirm(`Remove "${item.title}" from your portfolio?`)) return;
    try {
      must(await supabase.from('portfolio_items').delete().eq('id', item.id));
      const files = [item.media_path, item.thumbnail_path].filter((p): p is string => !!p && p.startsWith(`${uid}/`));
      if (files.length) void supabase.storage.from('portfolio').remove(files);
      toast.success('Removed');
      void data.reload();
    } catch (e) {
      toast.error(await errorMessage(e));
    }
  };

  if (!profile) return null;

  return (
    <div className="pb-12">
      <div className="relative h-40 bg-gradient-to-br from-[#9333ea]/80 via-[#ec4899]/60 to-[#f97316]/70" />
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative -mt-12 flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
          <div className="w-24 h-24 rounded-2xl p-[3px] bg-gradient-to-br from-[#9333ea] via-[#ec4899] to-[#f97316] shadow-xl flex-shrink-0">
            <AvatarEditor className="w-full h-full rounded-[calc(1rem-3px)]" />
          </div>
          <div className="flex-1 sm:pb-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
              {profile.is_verified && <CheckCircle className="w-5 h-5 fill-[#2979FF] text-white" aria-label="Verified" />}
              <Badge variant="outline" className="text-xs border-gray-200">{categoryLabels[editor.category]}</Badge>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${availabilityDot[editor.availability]}`} />{availabilityLabels[editor.availability]}
              </span>
              {!editor.is_listed && <Badge className="bg-gray-200 text-gray-700 border-none text-xs">Hidden from Discover</Badge>}
            </div>
            <p className="text-gray-500 text-sm mb-1.5">{editor.headline || 'Add a headline so clients know what you do'}</p>
            <Details />
          </div>
          <div className="flex gap-2 sm:pb-1 flex-wrap">
            <Button asChild size="sm" variant="outline" className="rounded-xl border-gray-200 gap-1.5 h-9 text-xs">
              <Link to={`/editors/${uid}`}><ExternalLink className="w-3.5 h-3.5" />View as client</Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="rounded-xl border-gray-200 gap-1.5 h-9 text-xs">
              <Edit className="w-3.5 h-3.5" />Edit profile
            </Button>
            <Button size="sm" onClick={() => setUploadOpen(true)} className="bg-[#2979FF] hover:bg-[#1565C0] rounded-xl h-9 gap-1.5 text-xs shadow-sm">
              <Upload className="w-3.5 h-3.5" />Add work
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Projects done" value={String(editor.completed_count)} icon={Briefcase} color="text-[#2979FF]" bg="bg-blue-50" />
          <Stat label={editor.rating_count ? `${editor.rating_count} reviews` : 'No reviews yet'} value={editor.rating_count ? Number(editor.rating_avg).toFixed(1) : '-'} icon={Star} color="text-amber-500" bg="bg-amber-50" />
          <Stat label="Total earned" value={data.data ? moneyShort(data.data.earned) : '...'} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" />
          <Stat label="Profile views" value={String(editor.profile_views)} icon={Eye} color="text-purple-600" bg="bg-purple-50" />
        </div>

        <Tabs tabs={['portfolio', 'services', 'reviews', 'about'] as EditorTab[]} value={tab} onChange={setTab} />

        {data.loading && !data.data ? <PageLoading /> : data.error ? <ErrorState message="Couldn't load your profile." onRetry={data.reload} /> : data.data && (
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {tab === 'portfolio' && (
              <>
                {data.data.portfolio.length > 0 && <div className="mb-5"><PortfolioGrid items={data.data.portfolio} onDelete={removeItem} /></div>}
                <button onClick={() => setUploadOpen(true)}
                  className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center hover:border-[#2979FF] hover:bg-blue-50/30 transition-all group">
                  <Upload className="w-7 h-7 text-gray-400 group-hover:text-[#2979FF] mb-2 transition-colors" />
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                    {data.data.portfolio.length ? 'Add more work' : 'Add your first piece: clients hire from portfolios'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Upload a video or picture, or paste a YouTube / Vimeo link</p>
                </button>
              </>
            )}
            {tab === 'services' && <PlanCards plans={data.data.plans} onEdit={setEditPlan} />}
            {tab === 'reviews' && (data.data.reviews.length
              ? <ReviewList reviews={data.data.reviews} />
              : <EmptyState icon={<Star className="w-8 h-8" />} title="No reviews yet" text="Clients can review you after a completed project." />)}
            {tab === 'about' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">About me</h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{profile.bio || 'Tell clients about your experience and style: Edit profile → About.'}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">Skills</h3>
                  {editor.skills.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {editor.skills.map((k) => <span key={k} className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-700">{k}</span>)}
                    </div>
                  ) : <p className="text-sm text-gray-500">None listed yet.</p>}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} onAdded={() => void data.reload()} editorId={uid} defaultCategory={editor.category} />
      {editOpen && (
        <EditProfileDialog open onClose={() => setEditOpen(false)} onSaved={refreshProfile} profile={profile} editor={editor} isEditor />
      )}
      <PlanEditDialog plan={editPlan} onClose={() => setEditPlan(null)} onSaved={() => void data.reload()} />
    </div>
  );
}

/* ═════════════ Client ═════════════ */

function ClientView() {
  const { user, profile, refreshProfile } = useAuth();
  const uid = user!.id;
  const [tab, setTab] = useState<ClientTab>('projects');
  const [editOpen, setEditOpen] = useState(false);

  const data = useAsync(async () => {
    const [projects, reviews, wallet] = await Promise.all([
      supabase.from('projects').select('*').eq('client_id', uid).order('created_at', { ascending: false }).limit(100),
      loadReviews('client_id', uid),
      supabase.rpc('wallet_summary'),
    ]);
    const list = must(projects);
    const hiredIds = [...new Set(list.filter((p) => p.funded_at).map((p) => p.editor_id).filter((x): x is string => !!x))];
    const editors = hiredIds.length ? must(await supabase.from('editor_cards').select('*').in('id', hiredIds)) : [];
    const people = hiredIds.length ? must(await supabase.from('profiles').select('id, display_name, avatar_url').in('id', hiredIds)) : [];
    return { projects: list, reviews, editors, people, spent: must(wallet)[0]?.total_spent_cents ?? 0, hiredCount: hiredIds.length };
  }, [uid]);

  if (!profile) return null;
  const nameOf = (id: string | null) => data.data?.people.find((p) => p.id === id)?.display_name ?? 'Editor';

  return (
    <div className="pb-12">
      <div className="relative h-40 bg-gradient-to-r from-[#2979FF] to-[#1565C0]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative -mt-12 flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
          <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl bg-white overflow-hidden flex-shrink-0">
            <AvatarEditor className="w-full h-full rounded-xl" />
          </div>
          <div className="flex-1 sm:pb-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
              {profile.is_verified && <CheckCircle className="w-5 h-5 fill-[#2979FF] text-white" aria-label="Verified" />}
            </div>
            {(profile.company_name || profile.bio) && <p className="text-gray-500 text-sm mb-1.5 line-clamp-2">{profile.company_name || profile.bio}</p>}
            <Details />
          </div>
          <div className="flex gap-2 sm:pb-1">
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="rounded-xl border-gray-200 gap-1.5 h-9 text-xs"><Edit className="w-3.5 h-3.5" />Edit profile</Button>
            <Button asChild size="sm" className="bg-[#2979FF] hover:bg-[#1565C0] rounded-xl h-9 gap-1.5 text-xs shadow-sm"><Link to="/"><Plus className="w-3.5 h-3.5" />New project</Link></Button>
          </div>
        </div>

        {data.loading && !data.data ? <PageLoading /> : data.error ? <ErrorState message="Couldn't load your profile." onRetry={data.reload} /> : data.data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Stat label="Projects" value={String(data.data.projects.length)} icon={Briefcase} color="text-[#2979FF]" bg="bg-blue-50" />
              <Stat label="Editors hired" value={String(data.data.hiredCount)} icon={Users} color="text-purple-600" bg="bg-purple-50" />
              <Stat label="Paid to editors" value={moneyShort(data.data.spent)} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" />
              <Stat label="Reviews given" value={String(data.data.reviews.length)} icon={Star} color="text-amber-500" bg="bg-amber-50" />
            </div>

            <Tabs tabs={['projects', 'editors', 'reviews'] as ClientTab[]} value={tab} onChange={setTab} />

            <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {tab === 'projects' && (data.data.projects.length ? (
                <div className="space-y-3">
                  {data.data.projects.slice(0, 10).map((p) => (
                    <Link key={p.id} to={`/projects?open=${p.id}`}
                      className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:border-gray-200 hover:shadow-md transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{p.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${statusColors[p.status]}`}>{statusLabels[p.status]}</span>
                        </div>
                        <p className="text-xs text-gray-500">{nameOf(p.editor_id)} · {shortDate(p.created_at)} · {moneyShort(p.price_cents)}</p>
                      </div>
                      <div className="text-right flex-shrink-0 w-20">
                        <div className="text-sm font-bold text-gray-900 mb-1">{p.progress}%</div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#2979FF] rounded-full" style={{ width: `${p.progress}%` }} /></div>
                      </div>
                    </Link>
                  ))}
                  {data.data.projects.length > 10 && <Link to="/projects" className="block text-center text-sm text-[#2979FF] hover:underline py-2">See all projects</Link>}
                </div>
              ) : <EmptyState icon={<Briefcase className="w-8 h-8" />} title="No projects yet" text="Hire an editor from Discover to start one."
                    action={<Button asChild className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0]"><Link to="/">Find an editor</Link></Button>} />)}

              {tab === 'editors' && (data.data.editors.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.data.editors.map((e) => (
                    <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                      <UserAvatar name={e.display_name} url={e.avatar_url} className="h-12 w-12 border-2 border-white shadow-sm flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{e.display_name}</h3>
                        <p className="text-xs text-gray-500">{e.category ? categoryLabels[e.category] : ''}</p>
                        {(e.rating_count ?? 0) > 0 && (
                          <p className="flex items-center gap-1 mt-1 text-xs"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="font-semibold">{Number(e.rating_avg).toFixed(1)}</span><span className="text-gray-400">({e.rating_count})</span></p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Button asChild size="sm" className="bg-[#2979FF] hover:bg-[#1565C0] rounded-xl h-7 px-3 text-[11px]"><Link to={`/editors/${e.id}`}>Hire again</Link></Button>
                        <Button asChild size="sm" variant="outline" className="rounded-xl h-7 px-3 text-[11px] border-gray-200 gap-1">
                          <Link to={`/chat?project=${data.data!.projects.find((p) => p.editor_id === e.id && p.funded_at)?.id ?? ''}`}><MessageSquare className="w-3 h-3" />Message</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon={<Users className="w-8 h-8" />} title="No editors hired yet" text="Editors you've worked with appear here." />)}

              {tab === 'reviews' && (data.data.reviews.length
                ? <ReviewList reviews={data.data.reviews} />
                : <EmptyState icon={<Star className="w-8 h-8" />} title="No reviews given" text="After a completed project you can review the editor." />)}
            </motion.div>
          </>
        )}
      </div>
      {editOpen && (
        <EditProfileDialog open onClose={() => setEditOpen(false)} onSaved={refreshProfile} profile={profile} editor={null} isEditor={false} />
      )}
    </div>
  );
}
