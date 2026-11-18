import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Briefcase, Mail, Palette } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Spinner, safeNext } from '../components/common';
import { useAuth } from '../context/UserContext';
import { supabase } from '../../lib/supabase';
import { errorMessage } from '../../lib/errors';
import { LogoMark } from '../components/Logo';
import { LEGAL } from '../../lib/legal';
import { continueWithGoogle, googleEnabled, oauthErrorFromUrl } from '../../lib/oauth';

/** The same rule the server enforces: 8+ characters, letters and digits. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return 'Use at least 8 characters';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Use both letters and numbers';
  return null;
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-4 py-10" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <LogoMark className="w-9 h-9" />
          <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>EditMe</span>
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, ...props }: { id: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="rounded-xl h-10" {...props} />
    </div>
  );
}

/** Google's "G", as its sign-in branding guidelines ask. */
function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="w-[18px] h-[18px]" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z" />
    </svg>
  );
}

/**
 * "Continue with Google", shown only once Google sign-in is switched on in
 * Supabase. Signing in this way also creates the account the first time.
 */
function GoogleSection({ next, role = 'client', signUp = false }: { next: string; role?: 'client' | 'editor'; signUp?: boolean }) {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(() => oauthErrorFromUrl());

  useEffect(() => {
    let alive = true;
    void googleEnabled().then((v) => alive && setOn(v));
    return () => { alive = false; };
  }, []);

  const go = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await continueWithGoogle(next, role);
    // On success the browser is already on its way to Google.
    if (err) {
      setBusy(false);
      setError(await errorMessage(err));
    }
  };

  if (!on) return error ? <p className="text-sm text-red-600 mb-4" role="alert">{error}</p> : null;

  return (
    <div className="space-y-3 mb-4">
      <Button type="button" variant="outline" onClick={go} disabled={busy}
        className="w-full rounded-xl h-10 gap-2.5 border-gray-200 bg-white font-medium text-gray-800">
        {busy ? <Spinner /> : <><GoogleG />Continue with Google</>}
      </Button>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <p className="text-[11px] leading-relaxed text-gray-400 text-center">
        {signUp ? '' : 'New to EditMe? This creates your account. '}
        By continuing with Google you confirm you're {LEGAL.minimumAge} or over and agree to the{' '}
        <Link to="/terms" target="_blank" className="underline hover:text-gray-600">Terms</Link>,{' '}
        <Link to="/acceptable-use" target="_blank" className="underline hover:text-gray-600">Acceptable Use Policy</Link> and{' '}
        <Link to="/privacy" target="_blank" className="underline hover:text-gray-600">Privacy Policy</Link>.
      </p>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />or with email<span className="h-px flex-1 bg-gray-200" />
      </div>
    </div>
  );
}

/* ───────────────────────── Sign in ───────────────────────── */

export function SignIn() {
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const navigate = useNavigate();
  const { user, mfaPending, refreshMfa } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user && !mfaPending) return <Navigate to={next} replace />;

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      setError(/confirm/i.test(err.message)
        ? 'Confirm your email first: open the link we sent you.'
        : /invalid/i.test(err.message) ? 'Wrong email or password.' : await errorMessage(err));
      return;
    }
    await refreshMfa();
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;
      const factor = factors.totp.find((f) => f.status === 'verified');
      if (!factor) throw new Error('No authenticator app is set up on this account.');
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() });
      if (verifyError) throw verifyError;
      await refreshMfa();
      navigate(next, { replace: true });
    } catch (err) {
      setError(/invalid|expired/i.test(String((err as Error).message)) ? 'That code is wrong or expired. Try the current one.' : await errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (user && mfaPending) {
    return (
      <AuthShell title="Two-step sign-in" subtitle="Enter the 6-digit code from your authenticator app.">
        <form onSubmit={verify} className="space-y-4">
          <Field id="code" label="Code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <Button type="submit" disabled={busy || code.length !== 6} className="w-full rounded-xl h-10 bg-[#2979FF] hover:bg-[#1565C0]">
            {busy ? <Spinner className="text-white" /> : 'Verify'}
          </Button>
          <button type="button" onClick={() => supabase.auth.signOut()} className="w-full text-sm text-gray-500 hover:text-gray-900">
            Use a different account
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to EditMe.">
      <GoogleSection next={next} />
      <form onSubmit={signIn} className="space-y-4">
        <Field id="email" label="Email" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field id="password" label="Password" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex justify-end -mt-2">
          <Link to="/forgot-password" className="text-xs text-[#2979FF] hover:underline">Forgot password?</Link>
        </div>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full rounded-xl h-10 bg-[#2979FF] hover:bg-[#1565C0]">
          {busy ? <Spinner className="text-white" /> : 'Sign in'}
        </Button>
        <p className="text-sm text-center text-gray-500">
          New to EditMe?{' '}
          <Link to={`/sign-up${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-[#2979FF] font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

/* ───────────────────────── Sign up ───────────────────────── */

export function SignUp() {
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const { user } = useAuth();
  const [role, setRole] = useState<'client' | 'editor'>(params.get('as') === 'editor' ? 'editor' : 'client');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (user) return <Navigate to={role === 'editor' ? '/profile' : next} replace />;

  const pwProblem = password ? passwordProblem(password) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(password);
    if (problem) return setError(problem);
    if (!agreed) return setError(`Please confirm you are ${LEGAL.minimumAge} or over and agree to the Terms and Privacy Policy.`);
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // Which version of the Terms they accepted, kept with the account.
        data: { display_name: name.trim(), role, terms_version: LEGAL.version, terms_accepted_at: new Date().toISOString() },
        emailRedirectTo: `${window.location.origin}${role === 'editor' ? '/profile' : next}`,
      },
    });
    setBusy(false);
    if (err) {
      setError(/registered|exists/i.test(err.message) ? 'There is already an account with this email. Sign in instead.' : await errorMessage(err));
      return;
    }
    // With email confirmation on there's no session yet: they confirm first.
    if (!data.session) setSentTo(email.trim());
  };

  if (sentTo) {
    return (
      <AuthShell title="Check your email">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-[#2979FF]" />
          </div>
          <p className="text-sm text-gray-600">
            We sent a link to <span className="font-semibold text-gray-900">{sentTo}</span>. Open it to finish creating your account.
          </p>
          <p className="text-xs text-gray-400 mt-4">Nothing there? Check spam, or wait a minute and sign up again.</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Hire editors, or get hired. You can do both later.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="I want to">
          {([
            ['client', 'Hire editors', Briefcase],
            ['editor', 'Work as an editor', Palette],
          ] as const).map(([value, label, Icon]) => (
            <button key={value} type="button" role="radio" aria-checked={role === value} onClick={() => setRole(value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                role === value ? 'border-[#2979FF] bg-[#EFF6FF] text-[#2979FF]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
        <GoogleSection next={role === 'editor' ? '/profile' : next} role={role} signUp />
        <Field id="name" label={role === 'client' ? 'Your name or company' : 'Your name'} autoComplete="name" required maxLength={80}
          value={name} onChange={(e) => setName(e.target.value)} />
        <Field id="email" label="Email" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="space-y-1.5">
          <Field id="password" label="Password" type="password" autoComplete="new-password" required
            value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!pwProblem} />
          <p className={`text-xs ${pwProblem ? 'text-red-600' : 'text-gray-400'}`}>
            {pwProblem ?? 'At least 8 characters, with letters and numbers'}
          </p>
        </div>
        <label htmlFor="agree" className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed cursor-pointer">
          <input id="agree" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#2979FF] flex-shrink-0" />
          <span>
            I'm {LEGAL.minimumAge} or over and I agree to the{' '}
            <Link to="/terms" target="_blank" className="text-[#2979FF] hover:underline">Terms of Service</Link>,{' '}
            <Link to="/acceptable-use" target="_blank" className="text-[#2979FF] hover:underline">Acceptable Use Policy</Link> and{' '}
            <Link to="/privacy" target="_blank" className="text-[#2979FF] hover:underline">Privacy Policy</Link>.
          </span>
        </label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <Button type="submit" disabled={busy || !name.trim() || !agreed} className="w-full rounded-xl h-10 bg-[#2979FF] hover:bg-[#1565C0]">
          {busy ? <Spinner className="text-white" /> : 'Create account'}
        </Button>
        <p className="text-sm text-center text-gray-500">
          Have an account?{' '}
          <Link to={`/sign-in${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-[#2979FF] font-medium hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

/* ───────────────────────── Password reset ───────────────────────── */

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    // Same answer whether or not the account exists (no account probing).
    if (err && !/not found/i.test(err.message)) return setError(await errorMessage(err));
    setSent(true);
  };

  return (
    <AuthShell title="Reset your password" subtitle={sent ? undefined : "We'll email you a link to choose a new one."}>
      {sent ? (
        <p className="text-sm text-gray-600 text-center">
          If there's an account for <span className="font-semibold">{email}</span>, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field id="email" label="Email" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full rounded-xl h-10 bg-[#2979FF] hover:bg-[#1565C0]">
            {busy ? <Spinner className="text-white" /> : 'Send reset link'}
          </Button>
        </form>
      )}
      <p className="text-sm text-center text-gray-500 mt-4">
        <Link to="/sign-in" className="text-[#2979FF] hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}

/** Where the reset email lands: the link signs them in, then they choose a password. */
export function ResetPassword() {
  const navigate = useNavigate();
  const { ready, user } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waited, setWaited] = useState(false);

  // The link's token is read from the address on load; give it a moment.
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(password);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(await errorMessage(err));
    toast.success('Password changed');
    navigate('/', { replace: true });
  };

  if (!user) {
    return (
      <AuthShell title="Choose a new password">
        {!ready || !waited ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : (
          <p className="text-sm text-gray-600">
            This reset link is invalid or has expired.{' '}
            <Link to="/forgot-password" className="text-[#2979FF] hover:underline">Send a new one</Link>.
          </p>
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={submit} className="space-y-4">
        <Field id="password" label="New password" type="password" autoComplete="new-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="text-xs text-gray-400 -mt-2">At least 8 characters, with letters and numbers</p>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full rounded-xl h-10 bg-[#2979FF] hover:bg-[#1565C0]">
          {busy ? <Spinner className="text-white" /> : 'Save password'}
        </Button>
      </form>
    </AuthShell>
  );
}
