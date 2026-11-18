import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Briefcase, Clock, DollarSign, MessageSquare, Shield, Calendar, TrendingUp, FileDown, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { EmptyState, ErrorState, PageLoading, UserAvatar, Spinner } from '../components/common';
import { ActionDialog, actionsFor, type ActionKind, type Side } from '../components/ProjectActions';

import { useAuth } from '../context/UserContext';
import { supabase, type Project, type ProjectStatus, type Tables } from '../../lib/supabase';
import { activeStatuses, money, moneyShort, shortDate, statusColors, statusLabels, timeAgo } from '../../lib/format';
import { must } from '../../lib/errors';
import { signedUrl } from '../../lib/storage';
import { useAsync } from '../../lib/useAsync';

type Person = Pick<Tables<'profiles'>, 'id' | 'display_name' | 'avatar_url'>;
type Filter = 'all' | ProjectStatus | 'closed';

const closed: ProjectStatus[] = ['declined', 'cancelled'];

export function Projects() {
  const { user, mode } = useAuth();
  const side: Side = mode;
  const uid = user!.id;
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>('all');
  const [action, setAction] = useState<{ project: Project; kind: ActionKind } | null>(null);
  const openId = params.get('open');

  const data = useAsync(async () => {
    const projects = must(await supabase
      .from('projects')
      .select('*')
      .eq(side === 'client' ? 'client_id' : 'editor_id', uid)
      .order('updated_at', { ascending: false })
      .limit(200));
    const otherIds = [...new Set(projects.map((p) => (side === 'client' ? p.editor_id : p.client_id)).filter((x): x is string => !!x))];
    const [people, reviews] = await Promise.all([
      otherIds.length ? supabase.from('profiles').select('id, display_name, avatar_url').in('id', otherIds) : Promise.resolve({ data: [] as Person[], error: null }),
      side === 'client' ? supabase.from('reviews').select('project_id').eq('client_id', uid) : Promise.resolve({ data: [] as { project_id: string }[], error: null }),
    ]);
    return {
      projects,
      people: new Map(must(people).map((p) => [p.id, p])),
      reviewed: new Set(must(reviews).map((r) => r.project_id)),
    };
  }, [uid, side]);

  // Live: the other side accepting, delivering, approving...
  useEffect(() => {
    const channel = supabase
      .channel(`projects:${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => void data.reload())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [uid, data.reload]);

  // Back from the payment provider's page.
  useEffect(() => {
    const paid = params.get('paid');
    if (paid) {
      toast.success('Payment received. It shows here as soon as the provider confirms it.');
      params.delete('paid');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const projects = useMemo(() => data.data?.projects ?? [], [data.data]);
  const shown = projects.filter((p) =>
    filter === 'all' ? true : filter === 'closed' ? closed.includes(p.status) : p.status === filter);
  const openProject = projects.find((p) => p.id === openId) ?? null;

  const filters: Filter[] = side === 'client'
    ? ['all', 'awaiting_payment', 'secured', 'in_progress', 'review', 'completed', 'disputed', 'closed']
    : ['all', 'secured', 'in_progress', 'review', 'completed', 'disputed', 'closed'];
  const filterLabel = (f: Filter) => (f === 'all' ? 'All' : f === 'closed' ? 'Closed' : statusLabels[f]);

  const count = (s: ProjectStatus[]) => projects.filter((p) => s.includes(p.status)).length;
  const committed = projects.filter((p) => [...activeStatuses, 'completed'].includes(p.status)).reduce((sum, p) => sum + p.price_cents, 0);

  const setOpen = (id: string | null) => {
    if (id) params.set('open', id);
    else params.delete('open');
    setParams(params, { replace: true });
  };

  if (data.loading && !data.data) return <PageLoading label="Loading projects" />;
  if (data.error) return <ErrorState message="Couldn't load your projects." onRetry={data.reload} />;

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{side === 'client' ? 'My Projects' : 'My Work'}</h1>
            <p className="text-gray-600">
              {side === 'client' ? 'Everything you have hired editors for' : 'Projects clients have hired you for'}
            </p>
          </div>
          {side === 'client' && (
            <Button asChild className="bg-[#2979FF] hover:bg-[#1e5fd8] rounded-xl">
              <Link to="/"><Briefcase className="w-4 h-4 mr-2" />Hire an editor</Link>
            </Button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((f) => (
            <Button key={f} onClick={() => setFilter(f)} variant={filter === f ? 'default' : 'outline'} size="sm"
              className={`rounded-full whitespace-nowrap ${filter === f ? 'bg-[#2979FF] hover:bg-[#1e5fd8]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
              {filterLabel(f)}
            </Button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active', value: count(['secured', 'in_progress']), hint: side === 'client' ? 'Paid, being worked on' : 'To accept or work on', icon: TrendingUp, color: 'text-[#2979FF]', bg: 'bg-blue-50' },
          { label: 'In review', value: count(['review']), hint: side === 'client' ? 'Waiting for your approval' : 'Waiting for the client', icon: Clock, color: 'text-[#f59e0b]', bg: 'bg-orange-50' },
          { label: 'Completed', value: count(['completed']), hint: 'Finished and paid', icon: CheckCircle, color: 'text-[#10b981]', bg: 'bg-green-50' },
          { label: side === 'client' ? 'Committed' : 'Booked', value: moneyShort(committed), hint: 'Active and completed', icon: DollarSign, color: 'text-[#9333ea]', bg: 'bg-purple-50' },
        ].map(({ label, value, hint, icon: Icon, color, bg }) => (
          <Card key={label} className="border-gray-200 rounded-2xl bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{label}</span>
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`} /></div>
              </div>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={<Briefcase className="w-8 h-8" />}
          title={projects.length ? 'Nothing here' : 'No projects yet'}
          text={projects.length ? `No projects are ${filterLabel(filter).toLowerCase()}.`
            : side === 'client' ? 'Hire an editor from Discover to start one.' : 'When a client hires you, the project shows up here.'}
          action={!projects.length ? (
            side === 'client'
              ? <Button asChild className="bg-[#2979FF] hover:bg-[#1e5fd8] rounded-xl"><Link to="/">Find an editor</Link></Button>
              : <Button asChild variant="outline" className="rounded-xl"><Link to="/profile">Polish your profile</Link></Button>
          ) : undefined} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {shown.map((project, index) => {
            const otherId = side === 'client' ? project.editor_id : project.client_id;
            const other = otherId ? data.data!.people.get(otherId) : undefined;
            const actions = actionsFor(project, side, data.data!.reviewed.has(project.id));
            const main = actions.find((a) => a.primary);
            return (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.05 }}>
                <Card className="border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={`${statusColors[project.status]} border-none`}>{statusLabels[project.status]}</Badge>
                      {['secured', 'in_progress', 'review', 'disputed'].includes(project.status) && (
                        <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50"><Shield className="w-3 h-3 mr-1" />In escrow</Badge>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">{timeAgo(project.updated_at)}</span>
                    </div>
                    <CardTitle className="text-xl mb-1">{project.title}</CardTitle>
                    {project.description && <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>}
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <UserAvatar name={other?.display_name ?? 'Deleted account'} url={other?.avatar_url} className="h-10 w-10 border-2 border-white" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{other?.display_name ?? 'Deleted account'}</p>
                        <p className="text-xs text-gray-600">{side === 'client' ? 'Editor' : 'Client'} · {project.plan_name}</p>
                      </div>
                      {project.funded_at && (
                        <Button asChild size="sm" variant="outline" className="rounded-lg" aria-label="Messages">
                          <Link to={`/chat?project=${project.id}`}><MessageSquare className="w-4 h-4" /></Link>
                        </Button>
                      )}
                    </div>

                    {['in_progress', 'review', 'completed', 'disputed'].includes(project.status) && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm font-semibold text-[#2979FF]">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><Calendar className="w-4 h-4 text-[#9333ea]" /></div>
                        <div>
                          <p className="text-xs text-gray-500">{project.deadline ? 'Due' : 'Delivery'}</p>
                          <p className="font-semibold">{project.deadline ? shortDate(project.deadline) : `${project.delivery_days} days`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"><DollarSign className="w-4 h-4 text-[#10b981]" /></div>
                        <div><p className="text-xs text-gray-500">Price</p><p className="font-semibold">{money(project.price_cents, project.currency)}</p></div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 mt-auto">
                      <Button variant="outline" className="flex-1 rounded-xl border-gray-200" onClick={() => setOpen(project.id)}>Details</Button>
                      {main && (
                        <Button className="flex-1 bg-[#2979FF] hover:bg-[#1e5fd8] rounded-xl" onClick={() => setAction({ project, kind: main.kind })}>{main.label}</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <ProjectDetails
        project={openProject}
        side={side}
        other={openProject ? data.data!.people.get((side === 'client' ? openProject.editor_id : openProject.client_id) ?? '') : undefined}
        reviewed={openProject ? data.data!.reviewed.has(openProject.id) : false}
        onClose={() => setOpen(null)}
        onAction={(kind) => openProject && setAction({ project: openProject, kind })}
      />
      <ActionDialog key={action ? `${action.project.id}:${action.kind}` : 'none'} project={action?.project ?? null} kind={action?.kind ?? null}
        onClose={() => setAction(null)} onDone={() => void data.reload()} />
    </div>
  );
}

const eventLabels: Record<string, string> = {
  created: 'Project created', funded: 'Paid into escrow', accepted: 'Accepted by the editor', declined: 'Declined by the editor',
  cancelled: 'Cancelled', delivered: 'Work delivered', revision_requested: 'Changes requested', approved: 'Approved, payment released',
  disputed: 'Dispute opened', dispute_resolved: 'Dispute settled by EditMe',
};

function ProjectDetails({
  project, side, other, reviewed, onClose, onAction,
}: {
  project: Project | null; side: Side; other?: Person; reviewed: boolean;
  onClose: () => void; onAction: (kind: ActionKind) => void;
}) {
  const details = useAsync(async () => {
    if (!project) return null;
    const [events, deliveries] = await Promise.all([
      supabase.from('project_events').select('*').eq('project_id', project.id).order('created_at'),
      supabase.from('project_deliveries').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
    ]);
    return { events: must(events), deliveries: must(deliveries) };
  }, [project?.id, project?.status]);

  const [downloading, setDownloading] = useState<string | null>(null);
  const download = async (path: string) => {
    setDownloading(path);
    const url = await signedUrl('deliveries', path);
    setDownloading(null);
    if (url) window.open(url, '_blank', 'noopener');
    else toast.error("Couldn't open that file.");
  };

  const actions = project ? actionsFor(project, side, reviewed) : [];

  return (
    <Dialog open={!!project} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        {project && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${statusColors[project.status]} border-none`}>{statusLabels[project.status]}</Badge>
              </div>
              <DialogTitle className="text-xl">{project.title}</DialogTitle>
              <DialogDescription>
                {side === 'client' ? 'Editor' : 'Client'}: {other?.display_name ?? 'Deleted account'} · {project.plan_name} · {money(project.price_cents, project.currency)}
              </DialogDescription>
            </DialogHeader>

            {project.description && <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-xl p-4">{project.description}</p>}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Delivery</p><p className="font-medium">{project.delivery_days} days</p></div>
              <div><p className="text-xs text-gray-500">Due</p><p className="font-medium">{shortDate(project.deadline)}</p></div>
              <div><p className="text-xs text-gray-500">Revisions</p><p className="font-medium">{project.revisions_allowed === null ? 'Unlimited' : `${project.revisions_used} of ${project.revisions_allowed}`}</p></div>
              <div><p className="text-xs text-gray-500">Progress</p><p className="font-medium">{project.progress}%</p></div>
            </div>

            {details.loading && !details.data ? <div className="flex justify-center py-6"><Spinner /></div> : details.data && (
              <>
                {details.data.deliveries.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Deliveries</h3>
                    <div className="space-y-2">
                      {details.data.deliveries.map((d) => (
                        <div key={d.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400">{shortDate(d.created_at)}</p>
                            {d.note && <p className="text-sm text-gray-700 whitespace-pre-line">{d.note}</p>}
                          </div>
                          {d.file_path && (
                            <Button size="sm" variant="outline" className="rounded-lg gap-1.5 flex-shrink-0" disabled={downloading === d.file_path}
                              onClick={() => download(d.file_path!)}>
                              {downloading === d.file_path ? <Spinner className="w-4 h-4" /> : <FileDown className="w-4 h-4" />}
                              {d.file_path.split('/').pop()?.replace(/^[0-9a-f]{8}-/, '')}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold mb-2">History</h3>
                  <ol className="relative border-l border-gray-200 ml-1.5 space-y-3">
                    {details.data.events.map((e) => (
                      <li key={e.id} className="ml-4">
                        <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-[#2979FF] border-2 border-white" />
                        <p className="text-sm font-medium text-gray-900">{eventLabels[e.kind] ?? e.kind}</p>
                        <p className="text-xs text-gray-400">{new Date(e.created_at).toLocaleString()}</p>
                        {e.note && <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-line">{e.note}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}

            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {actions.map((a) => (
                  <Button key={a.kind} onClick={() => onAction(a.kind)} variant={a.primary ? 'default' : 'outline'}
                    className={`rounded-xl ${a.primary ? 'bg-[#2979FF] hover:bg-[#1e5fd8]' : a.danger ? 'text-red-600 border-red-200 hover:bg-red-50' : 'border-gray-200'}`}>
                    {a.label}
                  </Button>
                ))}
                {project.funded_at && (
                  <Button asChild variant="outline" className="rounded-xl border-gray-200 ml-auto">
                    <Link to={`/chat?project=${project.id}`}><MessageSquare className="w-4 h-4 mr-1.5" />Messages</Link>
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
