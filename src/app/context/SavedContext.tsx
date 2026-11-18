import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import { useAuth } from './UserContext';
import { supabase } from '../../lib/supabase';
import { errorMessage } from '../../lib/errors';

interface SavedState {
  ids: Set<string>;
  isSaved: (editorId: string) => boolean;
  toggle: (editorId: string, name?: string) => Promise<void>;
}

const SavedContext = createContext<SavedState | undefined>(undefined);

/** The signed-in person's shortlist of editors (saved_editors). */
export function SavedProvider({ children }: { children: ReactNode }) {
  const { user, mfaPending } = useAuth();
  const uid = user?.id ?? null;
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!uid || mfaPending) {
      setIds(new Set());
      return;
    }
    let alive = true;
    supabase.from('saved_editors').select('editor_id').eq('user_id', uid).then(({ data }) => {
      if (alive) setIds(new Set((data ?? []).map((r) => r.editor_id)));
    });
    return () => {
      alive = false;
    };
  }, [uid, mfaPending]);

  const toggle = useCallback(async (editorId: string, name?: string) => {
    if (!uid) return;
    const saved = ids.has(editorId);
    // Show the change at once; undo it if the database says no.
    setIds((prev) => {
      const next = new Set(prev);
      if (saved) next.delete(editorId);
      else next.add(editorId);
      return next;
    });
    const { error } = saved
      ? await supabase.from('saved_editors').delete().eq('user_id', uid).eq('editor_id', editorId)
      : await supabase.from('saved_editors').insert({ editor_id: editorId });
    if (error && error.code !== '23505') {
      setIds((prev) => {
        const next = new Set(prev);
        if (saved) next.add(editorId);
        else next.delete(editorId);
        return next;
      });
      toast.error(await errorMessage(error));
      return;
    }
    toast.success(saved ? `Removed ${name ?? 'editor'} from Saved` : `Saved ${name ?? 'editor'}`);
  }, [uid, ids]);

  const value = useMemo<SavedState>(() => ({ ids, isSaved: (id) => ids.has(id), toggle }), [ids, toggle]);
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) throw new Error('useSaved must be used within a SavedProvider');
  return context;
}

/** Heart button: saves / un-saves; signed-out visitors are sent to sign in. */
export function SaveButton({
  editorId, name, className = '', withLabel = false,
}: { editorId: string; name?: string; className?: string; withLabel?: boolean }) {
  const { user } = useAuth();
  const { isSaved, toggle } = useSaved();
  const navigate = useNavigate();
  const location = useLocation();
  const saved = isSaved(editorId);
  if (user?.id === editorId) return null;

  const click = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate(`/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    void toggle(editorId, name);
  };

  return (
    <button type="button" onClick={click} aria-pressed={saved}
      aria-label={saved ? `Remove ${name ?? 'editor'} from saved` : `Save ${name ?? 'editor'}`}
      className={`flex items-center justify-center gap-1.5 transition-all ${className}`}>
      <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
      {withLabel && <span className="text-xs font-medium">{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
