import { Link } from 'react-router';
import { DollarSign, Star, Eye, Award, Target, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { EmptyState, ErrorState, PageLoading } from '../components/common';
import { useAuth } from '../context/UserContext';
import { supabase, type ProjectStatus } from '../../lib/supabase';
import { money, statusLabels } from '../../lib/format';
import { must } from '../../lib/errors';
import { useAsync } from '../../lib/useAsync';

interface AnalyticsDoc {
  earned_by_month: { month: string; cents: number }[] | null;
  spent_by_month: { month: string; cents: number }[] | null;
  projects_as_client: Partial<Record<ProjectStatus, number>>;
  projects_as_editor: Partial<Record<ProjectStatus, number>>;
  editor: { rating_avg: number; rating_count: number; completed_count: number; profile_views: number } | null;
}

const statusColor: Record<ProjectStatus, string> = {
  awaiting_payment: '#9ca3af', secured: '#9333ea', in_progress: '#2979FF', review: '#f59e0b',
  completed: '#10b981', declined: '#6b7280', cancelled: '#6b7280', disputed: '#ef4444',
};

const tooltipStyle = { backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };

const monthName = (ym: string) => new Date(`${ym}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short' });

export function Analytics() {
  const { user, mode } = useAuth();
  const isEditor = mode === 'editor';
  const data = useAsync(async () => must(await supabase.rpc('my_analytics')) as unknown as AnalyticsDoc | null, [user?.id]);

  if (data.loading && !data.data) return <PageLoading label="Loading analytics" />;
  if (data.error) return <ErrorState message="Couldn't load your analytics." onRetry={data.reload} />;
  const a = data.data;
  if (!a) return <ErrorState message="Sign in again to see your analytics." />;

  const series = ((isEditor ? a.earned_by_month : a.spent_by_month) ?? []).map((m) => ({ month: monthName(m.month), amount: m.cents / 100 }));
  const sixMonthTotal = series.reduce((s, m) => s + m.amount, 0) * 100;
  const byStatus = isEditor ? a.projects_as_editor : a.projects_as_client;
  const statusRows = (Object.entries(byStatus) as [ProjectStatus, number][])
    .map(([status, n]) => ({ status, label: statusLabels[status], n }))
    .sort((x, y) => y.n - x.n);
  const total = statusRows.reduce((s, r) => s + r.n, 0);
  const active = (['secured', 'in_progress', 'review'] as ProjectStatus[]).reduce((s, k) => s + (byStatus[k] ?? 0), 0);
  const completed = byStatus.completed ?? 0;

  if (total === 0 && sixMonthTotal === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <EmptyState icon={<BarChart3 className="w-8 h-8" />} title="Nothing to chart yet"
          text={isEditor ? 'Your earnings and project stats appear here after your first project.' : 'Your spending and project stats appear here after you hire an editor.'}
          action={<Button asChild className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0]"><Link to={isEditor ? '/profile' : '/'}>{isEditor ? 'Polish your profile' : 'Find an editor'}</Link></Button>} />
        {isEditor && a.editor && (
          <p className="text-center text-sm text-gray-500">Profile views so far: <span className="font-semibold">{a.editor.profile_views}</span></p>
        )}
      </div>
    );
  }

  const stats = [
    { label: isEditor ? 'Earned (6 months)' : 'Spent (6 months)', value: money(sixMonthTotal), icon: DollarSign, bg: 'from-blue-500 to-cyan-500' },
    { label: 'Active projects', value: String(active), icon: Target, bg: 'from-purple-500 to-pink-500' },
    { label: 'Completed', value: String(completed), icon: Award, bg: 'from-orange-500 to-red-500' },
    isEditor
      ? { label: a.editor?.rating_count ? `Rating (${a.editor.rating_count} reviews)` : 'Rating', value: a.editor?.rating_count ? Number(a.editor.rating_avg).toFixed(1) : '-', icon: Star, bg: 'from-yellow-500 to-orange-500' }
      : { label: 'All projects', value: String(total), icon: BarChart3, bg: 'from-yellow-500 to-orange-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <p className="text-gray-600">{isEditor ? 'Your earnings and projects as an editor' : 'Your spending and projects as a client'}</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map(({ label, value, icon: Icon, bg }) => (
          <Card key={label} className="border-gray-200 rounded-2xl">
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center mb-4`}><Icon className="w-6 h-6 text-white" /></div>
              <p className="text-sm text-gray-600 mb-1">{label}</p>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-gray-200 rounded-2xl lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{isEditor ? 'Earnings' : 'Spending'}</CardTitle>
              <Badge variant="outline" className="border-gray-200">Last 6 months</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2979FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2979FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" tickFormatter={(v: number) => `$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [money(v * 100), isEditor ? 'Earned' : 'Spent']} />
                <Area type="monotone" dataKey="amount" stroke="#2979FF" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-2xl">
          <CardHeader><CardTitle className="text-xl">{isEditor ? 'Profile' : 'At a glance'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isEditor && a.editor ? (
              <>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                  <div className="w-14 h-14 rounded-full bg-[#2979FF] flex items-center justify-center mx-auto mb-3"><Eye className="w-7 h-7 text-white" /></div>
                  <p className="text-4xl font-bold mb-1">{a.editor.profile_views}</p>
                  <p className="text-sm text-gray-600">Profile views (one per visitor per day)</p>
                </div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Projects completed</span><span className="font-semibold">{a.editor.completed_count}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Reviews</span><span className="font-semibold">{a.editor.rating_count}</span></div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Projects started</span><span className="font-semibold">{total}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Completed</span><span className="font-semibold">{completed}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Average monthly spend</span><span className="font-semibold">{money(sixMonthTotal / 6)}</span></div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 rounded-2xl">
        <CardHeader><CardTitle className="text-xl">Projects by status</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(120, statusRows.length * 44)}>
            <BarChart data={statusRows} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} stroke="#888" />
              <YAxis type="category" dataKey="label" stroke="#888" width={120} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Projects']} />
              <Bar dataKey="n" radius={[0, 8, 8, 0]}>
                {statusRows.map((r) => <Cell key={r.status} fill={statusColor[r.status]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
