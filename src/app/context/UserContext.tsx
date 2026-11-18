import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type EditorProfile, type Profile } from '../../lib/supabase';

/** Which side of the marketplace the person is using right now. */
export type Mode = 'client' | 'editor';

interface AuthState {
  /** false until the saved sign-in (if any) has been read. */
  ready: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Their editor profile, once they've set one up. */
  editorProfile: EditorProfile | null;
  /** Signed in with a password, but their two-step code is still needed. */
  mfaPending: boolean;
  /** Re-reads the two-step state (after entering a code or enrolling). */
  refreshMfa: () => Promise<void>;
  mode: Mode;
  setMode: (mode: Mode) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const modeKey = (uid: string) => `editme.mode.${uid}`;

function readMode(uid: string): Mode | null {
  try {
    const v = localStorage.getItem(modeKey(uid));
    return v === 'client' || v === 'editor' ? v : null;
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editorProfile, setEditorProfile] = useState<EditorProfile | null>(null);
  const [mode, setModeState] = useState<Mode>('client');
  const [mfaPending, setMfaPending] = useState(false);
  const user = session?.user ?? null;
  const uid = user?.id ?? null;

  const loadProfile = useCallback(async (id: string) => {
    const [p, e] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('editor_profiles').select('*').eq('user_id', id).maybeSingle(),
    ]);
    setProfile(p.data ?? null);
    setEditorProfile(e.data ?? null);
    setModeState(readMode(id) ?? (p.data?.primary_role === 'editor' ? 'editor' : 'client'));
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      if (!data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setProfile(null);
        setEditorProfile(null);
        setReady(true);
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refreshMfa = useCallback(async () => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setMfaPending(!!data && data.nextLevel === 'aal2' && data.currentLevel !== 'aal2');
  }, []);

  // Read from the session token, so it's cheap to do on every change.
  useEffect(() => {
    if (!session) {
      setMfaPending(false);
      return;
    }
    void refreshMfa();
  }, [session, refreshMfa]);

  // Profile follows the signed-in person (not every token refresh).
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    loadProfile(uid).finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [uid, loadProfile]);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    if (uid) {
      try {
        localStorage.setItem(modeKey(uid), next);
      } catch {
        /* private window: fine, it just won't be remembered */
      }
    }
  }, [uid]);

  const refreshProfile = useCallback(async () => {
    if (uid) await loadProfile(uid);
  }, [uid, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthState>(() => ({
    ready, session, user, profile, editorProfile, mfaPending, refreshMfa, mode, setMode, refreshProfile, signOut,
  }), [ready, session, user, profile, editorProfile, mfaPending, refreshMfa, mode, setMode, refreshProfile, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within a UserProvider');
  return context;
}

/** The current side (client / editor) and a switch between them. */
export function useUser() {
  const { mode, setMode } = useAuth();
  return {
    userRole: mode,
    toggleRole: () => setMode(mode === 'client' ? 'editor' : 'client'),
  };
}
