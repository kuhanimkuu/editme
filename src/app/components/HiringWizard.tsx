import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Check, ChevronRight, ChevronLeft, Shield, Clock, CheckCircle, Info } from 'lucide-react';
import { PageLoading, Spinner, UserAvatar, ErrorState } from './common';
import { revisionsLabel } from './editor-parts';
import { supabase, type ServicePlan } from '../../lib/supabase';
import { errorMessage, must } from '../../lib/errors';
import { money } from '../../lib/format';
import { useAsync } from '../../lib/useAsync';

export interface HireTarget {
  id: string;
  name: string;
  avatarUrl: string | null;
  categoryLabel: string;
}

interface HiringWizardProps {
  editor: HireTarget | null;
  isOpen: boolean;
  onClose: () => void;
  /** Pre-select a plan (from the editor's page). */
  planId?: string;
}

const STEPS = ['Service', 'Details', 'Review', 'Done'];

type Outcome =
  | { kind: 'secured' }
  | { kind: 'not_set_up' };

export function HiringWizard({ editor, isOpen, onClose, planId }: HiringWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(planId ?? null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Kept once created, so "try again" pays for the same project, not a new one.
  const [projectId, setProjectId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const plans = useAsync(async () => {
    if (!editor || !isOpen) return [] as ServicePlan[];
    return must(await supabase
      .from('service_plans')
      .select('*')
      .eq('editor_id', editor.id)
      .eq('is_active', true)
      .order('price_cents'));
  }, [editor?.id, isOpen]);

  useEffect(() => {
    const list = plans.data;
    if (!list?.length) return;
    setSelectedPlan((current) =>
      current && list.some((p) => p.id === current)
        ? current
        : (list.find((p) => p.tier === 'standard') ?? list[0]).id);
  }, [plans.data]);

  useEffect(() => {
    if (planId) setSelectedPlan(planId);
  }, [planId]);

  const plan = plans.data?.find((p) => p.id === selectedPlan) ?? null;

  const reset = () => {
    setStep(0);
    setSelectedPlan(planId ?? null);
    setTitle('');
    setDescription('');
    setError(null);
    setProjectId(null);
    setOutcome(null);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const fund = async () => {
    if (!plan) return;
    setBusy(true);
    setError(null);
    try {
      let id = projectId;
      if (!id) {
        id = must(await supabase.rpc('create_project', {
          p_plan_id: plan.id,
          p_title: title.trim(),
          p_description: description.trim(),
        }));
        setProjectId(id);
      }
      const { data, error: payError } = await supabase.functions.invoke<{ status: string; checkoutUrl?: string }>(
        'escrow-fund', { body: { projectId: id } });
      if (payError) {
        const status = (payError as { context?: Response }).context?.status;
        if (status === 501) {
          setOutcome({ kind: 'not_set_up' });
          setStep(3);
          return;
        }
        throw payError;
      }
      if (data?.status === 'redirect' && data.checkoutUrl) {
        // The provider's own page; it sends them back to /projects.
        window.location.assign(data.checkoutUrl);
        return;
      }
      setOutcome({ kind: 'secured' });
      setStep(3);
    } catch (e) {
      setError(await errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!editor) return null;

  const canContinue =
    (step === 0 && !!plan) ||
    (step === 1 && title.trim().length >= 3) ||
    step === 2;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl gap-0">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 mb-0">Hire {editor.name}</DialogTitle>
            <DialogDescription className="sr-only">Choose a package, describe the project and pay into escrow.</DialogDescription>
          </DialogHeader>
          <ol className="flex items-center gap-2 mt-4 overflow-x-auto">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all ${
                  i < step ? 'bg-[#2979FF] text-white' :
                  i === step ? 'bg-[#2979FF] text-white ring-4 ring-blue-100' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-[#2979FF]' : 'bg-gray-200'}`} />}
              </li>
            ))}
          </ol>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {/* ── Step 0: package ── */}
          {step === 0 && (
            plans.loading ? <PageLoading label="Loading packages" /> :
            plans.error ? <ErrorState message="Couldn't load this editor's packages." onRetry={plans.reload} /> :
            !plans.data?.length ? <p className="text-sm text-gray-600 text-center py-8">This editor has no packages available right now.</p> : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                <UserAvatar name={editor.name} url={editor.avatarUrl} className="h-10 w-10" />
                <div>
                  <p className="font-semibold text-sm">{editor.name}</p>
                  <p className="text-xs text-gray-500">{editor.categoryLabel}</p>
                </div>
              </div>
              {plans.data.map((p) => (
                <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedPlan === p.id ? 'border-[#2979FF] bg-[#EFF6FF]' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
                        {p.description && <span className="text-gray-500 text-xs">· {p.description}</span>}
                        {p.tier === 'standard' && <Badge className="bg-[#2979FF] text-white border-none text-[10px] h-4 px-1.5">Popular</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.delivery_days} days</span>
                        <span>{revisionsLabel(p.revisions)}</span>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-gray-900 flex-shrink-0">{money(p.price_cents)}</span>
                  </div>
                  {p.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.features.map((f) => (
                        <span key={f} className="text-[11px] text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ))}

          {/* ── Step 1: details ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="hire-title" className="block text-sm font-medium text-gray-700 mb-1.5">Project title *</label>
                <Input id="hire-title" placeholder="e.g. Brand launch promo video" value={title} maxLength={120}
                  onChange={(e) => setTitle(e.target.value)} className="rounded-xl border-gray-200 bg-gray-50 focus:bg-white" />
              </div>
              <div>
                <label htmlFor="hire-desc" className="block text-sm font-medium text-gray-700 mb-1.5">Describe your project</label>
                <textarea id="hire-desc" rows={5} maxLength={5000}
                  placeholder="Your vision, style references, tone, audience, links to footage or examples..."
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2979FF]/20 focus:border-[#2979FF] resize-none placeholder:text-gray-400" />
              </div>
              <p className="flex items-start gap-2 text-xs text-gray-500">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                Once the project is paid for, you can send footage and files in its chat.
              </p>
            </div>
          )}

          {/* ── Step 2: review & pay ── */}
          {step === 2 && plan && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm text-gray-900">Order summary</h3>
                <div className="flex items-center gap-3">
                  <UserAvatar name={editor.name} url={editor.avatarUrl} className="h-8 w-8" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{editor.name}</p>
                    <p className="text-xs text-gray-500">{plan.name}{plan.description ? ` · ${plan.description}` : ''}</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-200 text-sm">
                  <div className="flex justify-between gap-4"><span className="text-gray-600">Project</span><span className="font-medium truncate max-w-[60%]">{title}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span className="font-medium">{plan.delivery_days} days after the editor accepts</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Revisions</span><span className="font-medium">{revisionsLabel(plan.revisions)}</span></div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                    <span>Total</span><span className="text-[#2979FF]">{money(plan.price_cents)} USD</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="w-9 h-9 rounded-xl bg-[#9333ea] flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Held in escrow</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Your {money(plan.price_cents)} is held by EditMe and only released to {editor.name} when you approve the delivery.
                    If they decline, or you cancel before they start, it's refunded.
                  </p>
                </div>
              </div>
              {error && <p className="text-sm text-red-600 text-center" role="alert">{error}</p>}
            </div>
          )}

          {/* ── Step 3: done ── */}
          {step === 3 && outcome && (
            <div className="text-center py-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl ${
                outcome.kind === 'secured' ? 'bg-gradient-to-br from-[#2979FF] to-[#9333ea] shadow-blue-200' : 'bg-amber-100 shadow-amber-100'
              }`}>
                {outcome.kind === 'secured' ? <CheckCircle className="w-10 h-10 text-white" /> : <Info className="w-10 h-10 text-amber-600" />}
              </div>
              {outcome.kind === 'secured' ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Funds secured</h2>
                  <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
                    <span className="font-semibold">{editor.name}</span> has been notified and can now accept your project.
                    Your {plan && money(plan.price_cents)} is held in escrow.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Project saved</h2>
                  <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
                    Online payments aren't switched on yet, so nothing was charged. Your project is waiting for payment in Projects;
                    you can pay or cancel it there.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {step < 3 ? (
            <>
              <Button variant="outline" disabled={busy}
                onClick={step === 0 ? handleClose : () => setStep((s) => s - 1)} className="rounded-xl border-gray-200 gap-1.5">
                {step === 0 ? 'Cancel' : <><ChevronLeft className="w-4 h-4" />Back</>}
              </Button>
              <Button
                onClick={() => (step === 2 ? void fund() : setStep((s) => s + 1))}
                disabled={!canContinue || busy}
                className={`rounded-xl gap-1.5 shadow-sm px-6 text-white ${
                  step === 2 ? 'bg-gradient-to-r from-[#9333ea] via-[#ec4899] to-[#f97316] hover:opacity-90' : 'bg-[#2979FF] hover:bg-[#1565C0]'
                }`}
              >
                {busy ? <Spinner className="text-white" /> : (
                  <>
                    {step === 0 && <>Continue <ChevronRight className="w-4 h-4" /></>}
                    {step === 1 && <>Next <ChevronRight className="w-4 h-4" /></>}
                    {step === 2 && plan && <><Shield className="w-4 h-4" /> Pay into escrow · {money(plan.price_cents)}</>}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                const id = projectId;
                handleClose();
                if (id) navigate(`/projects?open=${id}`);
              }}
              className="w-full bg-[#2979FF] hover:bg-[#1565C0] rounded-xl h-10 shadow-sm"
            >
              View project
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
