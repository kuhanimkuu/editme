import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownLeft, Shield, Lock, Clock, Wallet as WalletIcon, Banknote } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { EmptyState, ErrorState, PageLoading, Spinner } from '../components/common';
import { useAuth } from '../context/UserContext';
import { supabase, type WalletTransaction } from '../../lib/supabase';
import { money, shortDate } from '../../lib/format';
import { errorMessage, must } from '../../lib/errors';
import { useAsync } from '../../lib/useAsync';

const typeLabels: Record<WalletTransaction['type'], string> = {
  escrow: 'Escrow payment', payment: 'Payment received', refund: 'Refund', withdrawal: 'Withdrawal',
};
const statusStyle: Record<WalletTransaction['status'], string> = {
  pending: 'bg-[#f59e0b] text-white', in_escrow: 'bg-[#9333ea] text-white', released: 'bg-gray-500 text-white',
  refunded: 'bg-gray-400 text-white', completed: 'bg-[#10b981] text-white', failed: 'bg-red-500 text-white',
};
const statusText: Record<WalletTransaction['status'], string> = {
  pending: 'Processing', in_escrow: 'In escrow', released: 'Released to editor', refunded: 'Refunded', completed: 'Done', failed: 'Failed',
};
/** Money coming to this person (green, +). */
const incoming = (t: WalletTransaction) => t.type === 'payment' || t.type === 'refund';

export function Wallet() {
  const { user, mode } = useAuth();
  const uid = user!.id;
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const data = useAsync(async () => {
    const [summary, txns, config] = await Promise.all([
      supabase.rpc('wallet_summary'),
      supabase.from('wallet_transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(100),
      supabase.from('app_config').select('min_withdrawal_cents').maybeSingle(),
    ]);
    return {
      summary: must(summary)[0] ?? null,
      txns: must(txns),
      minWithdrawal: config.data?.min_withdrawal_cents ?? 1000,
    };
  }, [uid]);

  if (data.loading && !data.data) return <PageLoading label="Loading wallet" />;
  if (data.error || !data.data) return <ErrorState message="Couldn't load your wallet." onRetry={data.reload} />;
  const { summary, txns, minWithdrawal } = data.data;
  const s = summary ?? { available_cents: 0, in_escrow_cents: 0, incoming_cents: 0, pending_withdrawal_cents: 0, total_earned_cents: 0, total_spent_cents: 0 };
  const isEditor = mode === 'editor';

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Wallet</h1>
        <p className="text-gray-600">{isEditor ? 'What you have earned, and paying it out' : 'Money you have put into escrow, and refunds'}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
        <Card className="border-0 rounded-3xl bg-gradient-to-br from-[#9333ea] via-[#ec4899] to-[#f97316] text-white shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2"><Shield className="w-5 h-5" /><span className="text-sm font-medium opacity-90">Held by EditMe</span></div>
                <p className="text-5xl font-bold mb-1">{money(isEditor ? s.available_cents : s.in_escrow_cents)}</p>
                <p className="text-sm opacity-80">{isEditor ? 'Available to withdraw' : 'In escrow for your projects'}</p>
              </div>
              {isEditor && (
                <Button onClick={() => setWithdrawOpen(true)} disabled={s.available_cents < minWithdrawal}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white rounded-xl self-start">
                  <ArrowUpRight className="w-4 h-4 mr-1" />Withdraw
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(isEditor ? [
                { label: 'Coming to you', value: s.incoming_cents, hint: 'In escrow on your active projects', icon: Lock },
                { label: 'Withdrawals in progress', value: s.pending_withdrawal_cents, hint: 'Being sent to your payout method', icon: Clock },
              ] : [
                { label: 'Paid to editors', value: s.total_spent_cents, hint: 'Released after you approved', icon: ArrowUpRight },
                { label: 'Refunds', value: txns.filter((t) => t.type === 'refund' && t.status !== 'failed').reduce((a, t) => a + t.amount_cents, 0), hint: 'Returned to your payment method', icon: ArrowDownLeft },
              ]).map(({ label, value, hint, icon: Icon }) => (
                <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2"><span className="text-sm opacity-80">{label}</span><Icon className="w-4 h-4 opacity-60" /></div>
                  <p className="text-2xl font-bold">{money(value)}</p>
                  <p className="text-xs opacity-70 mt-1">{hint}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-gray-200 rounded-2xl lg:col-span-2">
          <CardHeader><CardTitle className="text-xl">Transactions</CardTitle></CardHeader>
          <CardContent>
            {txns.length === 0 ? (
              <EmptyState icon={<WalletIcon className="w-8 h-8" />} title="No transactions yet"
                text={isEditor ? 'Payments appear here when clients approve your work.' : 'Escrow payments appear here when you hire an editor.'}
                action={!isEditor ? <Button asChild className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0]"><Link to="/">Find an editor</Link></Button> : undefined} />
            ) : (
              <ul className="divide-y divide-gray-100">
                {txns.map((t) => {
                  const plus = incoming(t);
                  return (
                    <li key={t.id} className="flex items-center gap-4 py-3.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${plus ? 'bg-green-50' : t.status === 'in_escrow' ? 'bg-purple-50' : 'bg-gray-100'}`}>
                        {plus ? <ArrowDownLeft className="w-5 h-5 text-[#10b981]" /> : <ArrowUpRight className={`w-5 h-5 ${t.status === 'in_escrow' ? 'text-[#9333ea]' : 'text-gray-600'}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{t.description}</p>
                        <p className="text-sm text-gray-500">{typeLabels[t.type]} · {shortDate(t.created_at)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold ${plus ? 'text-[#10b981]' : 'text-gray-900'}`}>{plus ? '+' : '-'}{money(t.amount_cents, t.currency)}</p>
                        <Badge className={`${statusStyle[t.status]} border-none text-xs mt-1`}>{statusText[t.status]}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-gray-200 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#9333ea] flex items-center justify-center"><Shield className="w-6 h-6 text-white" /></div>
                <h3 className="font-semibold">How escrow works</h3>
              </div>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>The client pays when hiring; EditMe holds the money.</li>
                <li>The editor accepts, works and delivers.</li>
                <li>The client approves and the editor is paid, or asks for changes.</li>
                <li>Declined or cancelled before work starts: full refund.</li>
                <li>Problems: either side opens a dispute and EditMe decides.</li>
              </ol>
            </CardContent>
          </Card>
          {isEditor && (
            <Card className="border-gray-200 rounded-2xl">
              <CardContent className="p-6 text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-900 flex items-center gap-2"><Banknote className="w-4 h-4" />Lifetime earnings</p>
                <p className="text-2xl font-bold text-gray-900">{money(s.total_earned_cents)}</p>
                <p>Minimum withdrawal: {money(minWithdrawal)}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <WithdrawDialog open={withdrawOpen} available={s.available_cents} min={minWithdrawal}
        onClose={() => setWithdrawOpen(false)} onDone={() => void data.reload()} />
    </div>
  );
}

function WithdrawDialog({ open, available, min, onClose, onDone }: {
  open: boolean; available: number; min: number; onClose: () => void; onDone: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cents = Math.round(Number(amount) * 100);
  const valid = Number.isFinite(cents) && cents >= min && cents <= available;

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.rpc('request_withdrawal', { p_amount_cents: cents });
    setBusy(false);
    if (e) return setError(await errorMessage(e));
    toast.success(`Withdrawal of ${money(cents)} requested`);
    setAmount('');
    onClose();
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Withdraw earnings</DialogTitle>
          <DialogDescription>Available: {money(available)}. Minimum {money(min)}. It's sent to your payout method.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            placeholder="0.00" aria-label="Amount in dollars" className="pl-7 rounded-xl h-11 text-lg" />
        </div>
        <button className="text-xs text-[#2979FF] hover:underline text-left" onClick={() => setAmount((available / 100).toFixed(2))}>Withdraw everything</button>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0]" onClick={submit} disabled={!valid || busy}>
            {busy ? <Spinner className="text-white" /> : `Withdraw ${valid ? money(cents) : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
