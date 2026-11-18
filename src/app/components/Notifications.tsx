import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { supabase, type Notification } from '../../lib/supabase';
import { timeAgo } from '../../lib/format';

/**
 * The bell's notifications, kept live. Message notifications are cleared by
 * reading the chat (mark_project_read); the rest when the bell is opened.
 */
export function useNotifications(uid: string | null) {
  const [items, setItems] = useState<Notification[]>([]);

  const load = useCallback(async () => {
    if (!uid) return setItems([]);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20);
    setItems(data ?? []);
  }, [uid]);

  useEffect(() => {
    void load();
    if (!uid) return;
    const channel = supabase
      .channel(`notifications:${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [uid, load]);

  const unread = items.filter((n) => !n.read_at);
  return {
    items,
    unreadCount: unread.length,
    /** Chats with unread messages (one notification per chat at most). */
    unreadChats: unread.filter((n) => n.kind === 'message').length,
    reload: load,
  };
}

export function NotificationsMenu({ items, unreadCount, reload }: ReturnType<typeof useNotifications>) {
  const navigate = useNavigate();

  const markSeen = async () => {
    const ids = items.filter((n) => !n.read_at && n.kind !== 'message').map((n) => n.id);
    if (!ids.length) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids);
    void reload();
  };

  const open = (n: Notification) => {
    if (n.kind === 'message' && n.project_id) navigate(`/chat?project=${n.project_id}`);
    else if (n.project_id) navigate(`/projects?open=${n.project_id}`);
  };

  return (
    <DropdownMenu onOpenChange={(isOpen) => isOpen && void markSeen()}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors" aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}>
          <Bell className="w-5 h-5 text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-xl p-1">
        <DropdownMenuLabel className="text-sm">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-gray-500">Nothing yet. Project updates and messages show up here.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((n) => (
              <DropdownMenuItem key={n.id} onSelect={() => open(n)} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer">
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.read_at ? 'bg-transparent' : 'bg-[#2979FF]'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-gray-900 leading-snug">{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500 truncate">{n.body}</p>}
                  <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/notifications')} className="justify-center text-xs font-medium text-[#2979FF] cursor-pointer rounded-lg">
          See all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
