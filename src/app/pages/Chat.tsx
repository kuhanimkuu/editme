import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, CheckCheck, FileText, MessageSquare, Paperclip, Search, Send, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { EmptyState, ErrorState, PageLoading, Spinner, UserAvatar } from '../components/common';
import { useAuth } from '../context/UserContext';
import { supabase, type Message } from '../../lib/supabase';
import { clockTime, statusLabels, timeAgo } from '../../lib/format';
import { errorMessage, must } from '../../lib/errors';
import { MB, signedUrl, uploadPath } from '../../lib/storage';
import { useAsync } from '../../lib/useAsync';

const PAGE = 200;

export function Chat() {
  const { user } = useAuth();
  const uid = user!.id;
  const [params, setParams] = useSearchParams();
  const selected = params.get('project');
  const [search, setSearch] = useState('');

  const rooms = useAsync(async () => must(await supabase.rpc('my_conversations')), [uid]);

  // A new message anywhere: refresh the list (last message, unread counts).
  useEffect(() => {
    const channel = supabase
      .channel(`inbox:${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => void rooms.reload())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [uid, rooms.reload]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rooms.data ?? []).filter((r) => !q || `${r.other_name} ${r.project_title}`.toLowerCase().includes(q));
  }, [rooms.data, search]);

  const current = rooms.data?.find((r) => r.project_id === selected) ?? null;
  const select = (id: string | null) => setParams(id ? { project: id } : {}, { replace: true });

  if (rooms.loading && !rooms.data) return <PageLoading label="Loading messages" />;
  if (rooms.error) return <ErrorState message="Couldn't load your messages." onRetry={rooms.reload} />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">Messages</h1>
        <p className="text-gray-600">One conversation per project, between you and the other side</p>
      </div>

      {!rooms.data?.length ? (
        <Card className="border-gray-200 rounded-2xl">
          <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="No conversations yet"
            text="A chat opens for every project once it's paid for."
            action={<Button asChild className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0]"><Link to="/projects">Go to projects</Link></Button>} />
        </Card>
      ) : (
        <Card className="border-gray-200 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-240px)] min-h-[520px]">
            {/* List */}
            <div className={`border-r border-gray-200 bg-gray-50 lg:col-span-1 flex flex-col min-h-0 ${current ? 'hidden lg:flex' : 'flex'}`}>
              <div className="p-4 bg-white border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search conversations" className="pl-9 bg-gray-50 border-gray-200 rounded-xl" />
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {list.map((room) => (
                  <button key={room.project_id} onClick={() => select(room.project_id)}
                    className={`w-full text-left p-4 transition-colors hover:bg-white border-l-4 ${selected === room.project_id ? 'bg-white border-[#2979FF]' : 'border-transparent'}`}>
                    <div className="flex items-start gap-3">
                      <UserAvatar name={room.other_name} url={room.other_avatar_url} className="h-11 w-11 border-2 border-white flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h3 className="font-semibold truncate">{room.other_name}</h3>
                          <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo(room.last_message_at)}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1">{room.last_message ?? 'No messages yet'}</p>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 truncate max-w-[75%]">{room.project_title}</Badge>
                          {room.unread_count > 0 && (
                            <span className="bg-[#2979FF] text-white text-xs h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full">{room.unread_count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {list.length === 0 && <p className="p-6 text-center text-sm text-gray-500">No conversations match.</p>}
              </div>
            </div>

            {/* Thread */}
            <div className={`lg:col-span-2 flex-col bg-white min-h-0 ${current ? 'flex' : 'hidden lg:flex'}`}>
              {current ? (
                <Thread key={current.project_id} uid={uid} room={current} onBack={() => select(null)} onRead={rooms.reload} />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="Select a conversation" text="Choose a project chat from the list." />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

type Room = { project_id: string; project_title: string; project_status: keyof typeof statusLabels; other_name: string; other_avatar_url: string | null };

function Thread({ uid, room, onBack, onRead }: { uid: string; room: Room; onBack: () => void; onRead: () => void }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState(false);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const projectId = room.project_id;

  const markRead = useCallback(async () => {
    await supabase.rpc('mark_project_read', { p_project_id: projectId });
    onRead();
  }, [projectId, onRead]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error: e } = await supabase.from('messages').select('*').eq('project_id', projectId)
        .order('created_at', { ascending: false }).limit(PAGE);
      if (!alive) return;
      if (e) return setError(true);
      setMessages((data ?? []).reverse());
      void markRead();
    })();
    const channel = supabase
      .channel(`chat:${projectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${projectId}` }, (payload) => {
        const m = payload.new as Message;
        setMessages((prev) => (prev && !prev.some((x) => x.id === m.id) ? [...prev, m] : prev));
        if (m.sender_id !== uid) void markRead();
      })
      .subscribe();
    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
    // markRead is stable per project
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, uid]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages?.length]);

  const send = async () => {
    const content = text.trim();
    if ((!content && !file) || sending) return;
    setSending(true);
    try {
      let attachment_path: string | undefined;
      if (file) {
        if (file.size > 25 * MB) throw new Error('Attachments can be up to 25 MB.');
        attachment_path = uploadPath(projectId, file);
        const up = await supabase.storage.from('chat-attachments').upload(attachment_path, file, { contentType: file.type || undefined });
        if (up.error) throw up.error;
      }
      const inserted = must(await supabase.from('messages')
        .insert({ project_id: projectId, content, attachment_path })
        .select('*')
        .single());
      setMessages((prev) => (prev && !prev.some((x) => x.id === inserted.id) ? [...prev, inserted] : prev));
      setText('');
      setFile(null);
    } catch (e) {
      toast.error(e instanceof Error && !('code' in e) ? e.message : await errorMessage(e, "Couldn't send. Try again."));
    } finally {
      setSending(false);
    }
  };

  const openAttachment = async (path: string) => {
    const url = await signedUrl('chat-attachments', path);
    if (url) window.open(url, '_blank', 'noopener');
    else toast.error("Couldn't open that file.");
  };

  return (
    <>
      <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3">
        <button onClick={onBack} className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100" aria-label="Back to conversations"><ArrowLeft className="w-5 h-5" /></button>
        <UserAvatar name={room.other_name} url={room.other_avatar_url} className="h-10 w-10 border-2 border-gray-100" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{room.other_name}</h3>
          <Link to={`/projects?open=${projectId}`} className="text-xs text-gray-600 hover:text-[#2979FF] truncate block">
            {room.project_title} · {statusLabels[room.project_status]}
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-gray-50" aria-live="polite">
        {error ? <ErrorState message="Couldn't load this conversation." /> :
         !messages ? <div className="flex justify-center py-10"><Spinner /></div> :
         messages.length === 0 ? <p className="text-center text-sm text-gray-500 py-10">No messages yet. Say hello and share what you need.</p> :
         messages.map((m) => {
          const mine = m.sender_id === uid;
          const name = m.attachment_path?.split('/').pop()?.replace(/^[0-9a-f]{8}-/, '');
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              {!mine && <UserAvatar name={room.other_name} url={room.other_avatar_url} className="h-8 w-8 flex-shrink-0" />}
              <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'} max-w-[75%]`}>
                <div className={`rounded-2xl px-4 py-2.5 ${mine ? 'bg-[#2979FF] text-white rounded-br-md' : 'bg-white border border-gray-200 rounded-bl-md'}`}>
                  {m.content && <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>}
                  {m.attachment_path && (
                    <button onClick={() => openAttachment(m.attachment_path!)}
                      className={`mt-1 p-2 rounded-lg flex items-center gap-2 text-left ${mine ? 'bg-white/15 hover:bg-white/25' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs underline truncate">{name}</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1 px-1">
                  <span className="text-xs text-gray-500">{clockTime(m.created_at)}</span>
                  {mine && <CheckCheck className="w-3 h-3 text-[#2979FF]" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
        {file && (
          <div className="mb-2 flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
            <Paperclip className="w-3.5 h-3.5" /><span className="truncate flex-1">{file.name}</span>
            <button onClick={() => setFile(null)} aria-label="Remove attachment"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex items-end gap-2">
          <Button type="button" variant="ghost" size="sm" className="h-11 w-11 p-0 rounded-full flex-shrink-0" onClick={() => fileInput.current?.click()} aria-label="Attach a file">
            <Paperclip className="w-5 h-5 text-gray-400" />
          </Button>
          <input ref={fileInput} type="file" className="sr-only" onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = ''; }} />
          <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} placeholder="Type your message..."
            aria-label="Message" className="flex-1 bg-gray-50 border-gray-200 rounded-2xl h-11" />
          <Button type="submit" disabled={sending || (!text.trim() && !file)} aria-label="Send"
            className="h-11 w-11 p-0 rounded-full bg-[#2979FF] hover:bg-[#1e5fd8] flex-shrink-0">
            {sending ? <Spinner className="text-white" /> : <Send className="w-5 h-5" />}
          </Button>
        </form>
      </div>
    </>
  );
}
