import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Bell, CheckCheck, MessageSquare, Briefcase } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { EmptyState, ErrorState, PageLoading } from '../components/common';
import { useAuth } from '../context/UserContext';
import { supabase, type Notification } from '../../lib/supabase';
import { timeAgo } from '../../lib/format';
import { errorMessage, must } from '../../lib/errors';
import { useAsync } from '../../lib/useAsync';

/** Every notification (the bell only shows the latest 20). */
export function NotificationsPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const data = useAsync(async () => must(await supabase
    .from('notifications').select('*').eq('user_id', uid)
    .order('created_at', { ascending: false }).limit(200)), [uid]);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-page:${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` }, () => void data.reload())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [uid, data.reload]);

  const markAll = async () => {
    const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', uid).is('read_at', null);
    if (error) return toast.error(await errorMessage(error));
    void data.reload();
  };

  const open = async (n: Notification) => {
    if (!n.read_at) void supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id);
    if (n.kind === 'message' && n.project_id) navigate(`/chat?project=${n.project_id}`);
    else if (n.project_id) navigate(`/projects?open=${n.project_id}`);
  };

  if (data.loading && !data.data) return <PageLoading label="Loading notifications" />;
  if (data.error) return <ErrorState message="Couldn't load your notifications." onRetry={data.reload} />;
  const all = data.data ?? [];
  const unread = all.filter((n) => !n.read_at).length;
  const shown = unreadOnly ? all.filter((n) => !n.read_at) : all;

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Notifications</h1>
          <p className="text-gray-600">{unread ? `${unread} unread` : 'All caught up'}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-xl border border-gray-200 bg-white p-0.5" role="tablist">
            {[['All', false], ['Unread', true]].map(([label, value]) => (
              <button key={String(label)} role="tab" aria-selected={unreadOnly === value} onClick={() => setUnreadOnly(value as boolean)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${unreadOnly === value ? 'bg-[#2979FF] text-white' : 'text-gray-600'}`}>
                {label as string}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={markAll} disabled={!unread}>
            <CheckCheck className="w-4 h-4" />Mark all read
          </Button>
        </div>
      </div>

      {shown.length === 0 ? (
        <Card className="border-gray-200 rounded-2xl">
          <EmptyState icon={<Bell className="w-8 h-8" />} title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            text="Project updates (payments, deliveries, approvals) and new messages show up here." />
        </Card>
      ) : (
        <Card className="border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
          {shown.map((n) => (
            <button key={n.id} onClick={() => void open(n)}
              className={`w-full text-left flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors ${n.read_at ? '' : 'bg-blue-50/40'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${n.kind === 'message' ? 'bg-blue-50 text-[#2979FF]' : 'bg-purple-50 text-[#9333ea]'}`}>
                {n.kind === 'message' ? <MessageSquare className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.read_at ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>{n.title}</p>
                {n.body && <p className="text-sm text-gray-500 line-clamp-2">{n.body}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
              </div>
              {!n.read_at && <span className="mt-2 w-2 h-2 rounded-full bg-[#2979FF] flex-shrink-0" aria-label="Unread" />}
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
