import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, Lock, LogOut, Shield, User, Trash2, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Spinner } from '../components/common';
import { useAuth } from '../context/UserContext';
import { passwordProblem } from './Auth';
import { supabase } from '../../lib/supabase';
import { errorMessage, must } from '../../lib/errors';
import { useAsync } from '../../lib/useAsync';

const fade = (delay: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay } });

export function Settings() {
  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8">
      <motion.div {...fade(0)} className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Your account and security</p>
      </motion.div>
      <div className="space-y-6">
        <motion.div {...fade(0.05)}><AccountCard /></motion.div>
        <motion.div {...fade(0.1)}><SecurityCard /></motion.div>
        <motion.div {...fade(0.15)}><PaymentsCard /></motion.div>
        <motion.div {...fade(0.2)}><DeleteCard /></motion.div>
      </div>
    </div>
  );
}

function AccountCard() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.display_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [busy, setBusy] = useState(false);

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const nameChanged = name.trim() !== (profile?.display_name ?? '');
  const emailChanged = email.trim().toLowerCase() !== (user?.email ?? '').toLowerCase();

  const save = async () => {
    if (!user) return;
    setBusy(true);
    try {
      if (nameChanged) {
        must(await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', user.id));
        await refreshProfile();
      }
      if (emailChanged) {
        const { error } = await supabase.auth.updateUser({ email: email.trim() }, { emailRedirectTo: `${window.location.origin}/settings` });
        if (error) throw error;
        toast.success(`Confirm the change from the link sent to ${email.trim()}`);
      } else {
        toast.success('Saved');
      }
    } catch (e) {
      toast.error(await errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-gray-200 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl"><User className="w-5 h-5 text-[#2979FF]" />Account</CardTitle>
        <CardDescription>Your name shows on your profile, projects and messages. More details are on your Profile page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="settings-name">Name</Label>
          <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-email">Email</Label>
          <Input id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!emailValid} className="rounded-xl" />
          {!emailValid && <p className="text-xs text-red-600">Enter a valid email address</p>}
          {emailChanged && emailValid && <p className="text-xs text-gray-500">We'll send a confirmation link to the new address.</p>}
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={busy || !name.trim() || !emailValid || (!nameChanged && !emailChanged)} className="bg-[#2979FF] hover:bg-[#1565C0] rounded-xl">
            {busy ? <Spinner className="text-white" /> : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityCard() {
  const navigate = useNavigate();
  const { refreshMfa } = useAuth();
  const [pwOpen, setPwOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const factors = useAsync(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    return data.totp.filter((f) => f.status === 'verified');
  }, []);
  const enabled = (factors.data?.length ?? 0) > 0;

  const disable = async () => {
    if (!factors.data?.length) return;
    if (!window.confirm('Turn off two-step sign-in? Your password alone will be enough to sign in.')) return;
    try {
      for (const f of factors.data) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id });
        if (error) throw error;
      }
      await supabase.auth.refreshSession();
      await refreshMfa();
      toast.success('Two-step sign-in is off');
      void factors.reload();
    } catch (e) {
      toast.error(await errorMessage(e));
    }
  };

  const signOutEverywhere = async () => {
    if (!window.confirm('Sign out on every device, including this one?')) return;
    await supabase.auth.signOut({ scope: 'global' });
    navigate('/sign-in');
  };

  return (
    <Card className="border-gray-200 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl"><Shield className="w-5 h-5 text-[#f97316]" />Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Two-step sign-in</p>
            <p className="text-sm text-gray-500">
              {factors.loading ? 'Checking...' : enabled ? 'On: a code from your authenticator app is needed to sign in.' : 'Ask for a code from an authenticator app when you sign in.'}
            </p>
          </div>
          {!factors.loading && (enabled
            ? <Button variant="outline" size="sm" className="rounded-xl" onClick={disable}>Turn off</Button>
            : <Button size="sm" className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0]" onClick={() => setEnrollOpen(true)}><Smartphone className="w-4 h-4 mr-1" />Set up</Button>)}
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4">
          <div><p className="font-medium text-sm">Password</p><p className="text-sm text-gray-500">At least 8 characters, with letters and numbers</p></div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPwOpen(true)}><Lock className="w-4 h-4 mr-1" />Change</Button>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4">
          <div><p className="font-medium text-sm">Sign out everywhere</p><p className="text-sm text-gray-500">If you signed in on a device you no longer use</p></div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={signOutEverywhere}><LogOut className="w-4 h-4 mr-1" />Sign out all</Button>
        </div>
      </CardContent>
      <PasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
      {enrollOpen && <EnrollDialog onClose={() => setEnrollOpen(false)} onDone={() => { void factors.reload(); void refreshMfa(); }} />}
    </Card>
  );
}

function PasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pw, setPw] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const problem = pw ? passwordProblem(pw) : null;

  const save = async () => {
    if (passwordProblem(pw)) return;
    if (pw !== again) return setError("The two passwords don't match");
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (e) return setError(await errorMessage(e));
    toast.success('Password changed');
    setPw(''); setAgain('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle>Change password</DialogTitle><DialogDescription>At least 8 characters, with letters and numbers.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <Input type="password" autoComplete="new-password" placeholder="New password" aria-label="New password" value={pw} onChange={(e) => setPw(e.target.value)} className="rounded-xl" />
          {problem && <p className="text-xs text-red-600">{problem}</p>}
          <Input type="password" autoComplete="new-password" placeholder="New password again" aria-label="Repeat new password" value={again} onChange={(e) => setAgain(e.target.value)} className="rounded-xl" />
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0]" onClick={save} disabled={busy || !pw || !!problem || !again}>
            {busy ? <Spinner className="text-white" /> : 'Change password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Authenticator-app setup: show the QR code, then confirm with a first code. */
function EnrollDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrollment = useAsync(async () => {
    // Leftover unfinished setups would block a new one.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const f of existing?.all ?? []) {
      if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error: e } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}` });
    if (e) throw e;
    return data;
  }, []);

  const verify = async () => {
    if (!enrollment.data) return;
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollment.data.id, code });
    setBusy(false);
    if (e) return setError('That code is wrong or expired. Enter the current one from the app.');
    toast.success('Two-step sign-in is on');
    onDone();
    onClose();
  };

  const cancel = async () => {
    if (enrollment.data) await supabase.auth.mfa.unenroll({ factorId: enrollment.data.id });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && void cancel()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Set up two-step sign-in</DialogTitle>
          <DialogDescription>Scan this with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password...), then enter the 6-digit code it shows.</DialogDescription>
        </DialogHeader>
        {enrollment.loading ? <div className="flex justify-center py-10"><Spinner /></div> :
         enrollment.error || !enrollment.data ? <p className="text-sm text-red-600">Couldn't start the setup. Close this and try again.</p> : (
          <div className="space-y-3">
            <img src={enrollment.data.totp.qr_code} alt="QR code for your authenticator app" className="w-48 h-48 mx-auto bg-white rounded-xl border border-gray-100 p-2" />
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer">Can't scan? Enter this key instead</summary>
              <code className="block mt-1 break-all bg-gray-50 rounded-lg p-2 select-all">{enrollment.data.totp.secret}</code>
            </details>
            <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" aria-label="6-digit code"
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="rounded-xl h-11 text-center text-lg tracking-widest" />
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => void cancel()} disabled={busy}>Cancel</Button>
          <Button className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0]" onClick={verify} disabled={busy || code.length !== 6 || !enrollment.data}>
            {busy ? <Spinner className="text-white" /> : 'Turn on'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentsCard() {
  const { mode } = useAuth();
  return (
    <Card className="border-gray-200 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl"><CreditCard className="w-5 h-5 text-[#10b981]" />{mode === 'client' ? 'Payments' : 'Payouts'}</CardTitle>
        <CardDescription>
          {mode === 'client'
            ? 'You pay for each project when you hire, on a secure checkout page. EditMe never stores card details.'
            : 'Withdrawals are sent to your payout method. You add it the first time you withdraw.'}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function DeleteCard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.functions.invoke('account-delete', { body: {} });
    if (e) {
      setBusy(false);
      return setError(await errorMessage(e));
    }
    await supabase.auth.signOut({ scope: 'local' });
    toast.success('Your account was deleted');
    navigate('/', { replace: true });
  };

  return (
    <Card className="border-red-200 rounded-2xl">
      <CardContent className="p-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-red-600">Delete account</p>
          <p className="text-sm text-gray-500">Projects with money in escrow, or a balance to withdraw, must be settled first.</p>
        </div>
        <Button variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setOpen(true)}>
          <Trash2 className="w-4 h-4 mr-1" />Delete
        </Button>
      </CardContent>
      <Dialog open={open} onOpenChange={(o) => !o && !busy && (setOpen(false), setConfirm(''), setError(null))}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Your profile, pictures and portfolio are removed for good. Finished projects stay on record for the other side, without your name.
              This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
            <Input id="delete-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="rounded-xl" autoComplete="off" />
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)} disabled={busy}>Keep my account</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700" onClick={remove} disabled={busy || confirm !== 'DELETE'}>
              {busy ? <Spinner className="text-white" /> : 'Delete forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
