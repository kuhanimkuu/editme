import { useState } from 'react';
import { toast } from 'sonner';
import { Upload, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Spinner } from './common';
import { supabase, type Project } from '../../lib/supabase';
import { errorMessage, must } from '../../lib/errors';
import { MB, uploadPath } from '../../lib/storage';
import { money } from '../../lib/format';

export type Side = 'client' | 'editor';

export type ActionKind =
  | 'pay' | 'cancel' | 'accept' | 'decline' | 'progress' | 'deliver'
  | 'approve' | 'revision' | 'dispute' | 'review';

interface ActionDef {
  kind: ActionKind;
  label: string;
  primary?: boolean;
  danger?: boolean;
}

/** What this person can do with this project right now (the database checks again). */
export function actionsFor(p: Project, side: Side, reviewed: boolean): ActionDef[] {
  if (side === 'client') {
    switch (p.status) {
      case 'awaiting_payment': return [{ kind: 'pay', label: 'Pay into escrow', primary: true }, { kind: 'cancel', label: 'Cancel', danger: true }];
      case 'secured': return [{ kind: 'cancel', label: 'Cancel and refund', danger: true }];
      case 'in_progress': return [{ kind: 'dispute', label: 'Report a problem', danger: true }];
      case 'review': return [
        { kind: 'approve', label: 'Approve and pay', primary: true },
        { kind: 'revision', label: 'Request changes' },
        { kind: 'dispute', label: 'Report a problem', danger: true },
      ];
      case 'completed': return reviewed ? [] : [{ kind: 'review', label: 'Leave a review', primary: true }];
      default: return [];
    }
  }
  switch (p.status) {
    case 'secured': return [{ kind: 'accept', label: 'Accept project', primary: true }, { kind: 'decline', label: 'Decline', danger: true }];
    case 'in_progress': return [
      { kind: 'deliver', label: 'Deliver work', primary: true },
      { kind: 'progress', label: 'Update progress' },
      { kind: 'dispute', label: 'Report a problem', danger: true },
    ];
    case 'review': return [{ kind: 'dispute', label: 'Report a problem', danger: true }];
    default: return [];
  }
}

const copy: Record<ActionKind, { title: string; text: (p: Project) => string; confirm: string; note?: 'optional' | 'required'; notePlaceholder?: string }> = {
  pay: { title: 'Pay into escrow', confirm: 'Pay now', text: (p) => `${money(p.price_cents)} is held by EditMe and released to the editor only when you approve the delivery.` },
  cancel: { title: 'Cancel this project?', confirm: 'Cancel project', note: 'optional', notePlaceholder: 'Why are you cancelling? (optional)',
    text: (p) => (p.status === 'secured' ? `The editor hasn't started yet, so your ${money(p.price_cents)} will be refunded.` : 'Nothing has been paid, so nothing is refunded.') },
  accept: { title: 'Accept this project?', confirm: 'Accept', note: 'optional', notePlaceholder: 'A note for the client (optional)',
    text: (p) => `The ${p.delivery_days}-day delivery time starts now. The ${money(p.price_cents)} stays in escrow until the client approves.` },
  decline: { title: 'Decline this project?', confirm: 'Decline', note: 'optional', notePlaceholder: 'Let the client know why (optional)',
    text: () => 'The client is refunded in full.' },
  progress: { title: 'Update progress', confirm: 'Save', text: () => 'Let the client see how far along you are. Delivering sets it to 100%.' },
  deliver: { title: 'Deliver your work', confirm: 'Deliver', note: 'optional', notePlaceholder: 'What you delivered, links, notes for the client...',
    text: () => 'The client reviews it, then approves (you get paid) or asks for changes. Attach a file, add a note, or both.' },
  approve: { title: 'Approve and release payment?', confirm: 'Approve and pay',
    text: (p) => `${money(p.price_cents)} is released from escrow to the editor. This can't be undone.` },
  revision: { title: 'Request changes', confirm: 'Send request', note: 'required', notePlaceholder: 'What should change?',
    text: (p) => (p.revisions_allowed === null
      ? 'Your plan includes unlimited revisions.'
      : `Revisions used: ${p.revisions_used} of ${p.revisions_allowed}.`) },
  dispute: { title: 'Report a problem', confirm: 'Open dispute', note: 'required', notePlaceholder: 'Describe the problem (at least 10 characters)',
    text: () => 'The project is paused and EditMe staff will review it. The money stays in escrow until they decide.' },
  review: { title: 'Review the editor', confirm: 'Post review', note: 'optional', notePlaceholder: 'How was working with them? (optional)',
    text: () => 'Your review is public on their profile.' },
};

export function ActionDialog({
  project, kind, onClose, onDone,
}: { project: Project | null; kind: ActionKind | null; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(5);
  const [progress, setProgress] = useState<number>(project?.progress ?? 0);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!project || !kind) return null;
  const c = copy[kind];

  const close = () => {
    if (busy) return;
    setNote('');
    setRating(5);
    setFile(null);
    setError(null);
    onClose();
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    const id = project.id;
    const n = note.trim() || undefined;
    try {
      switch (kind) {
        case 'pay': {
          const { data, error: e } = await supabase.functions.invoke<{ status: string; checkoutUrl?: string }>('escrow-fund', { body: { projectId: id } });
          if (e) {
            if ((e as { context?: Response }).context?.status === 501) throw new Error("Online payments aren't switched on yet. Nothing was charged.");
            throw e;
          }
          if (data?.status === 'redirect' && data.checkoutUrl) {
            window.location.assign(data.checkoutUrl);
            return;
          }
          toast.success('Funds secured in escrow');
          break;
        }
        case 'cancel': must(await supabase.rpc('client_cancel', { p_project_id: id, p_note: n })); toast.success('Project cancelled'); break;
        case 'accept': must(await supabase.rpc('editor_respond', { p_project_id: id, p_accept: true, p_note: n })); toast.success('Project accepted'); break;
        case 'decline': must(await supabase.rpc('editor_respond', { p_project_id: id, p_accept: false, p_note: n })); toast.success('Project declined; the client is refunded'); break;
        case 'progress': must(await supabase.rpc('update_progress', { p_project_id: id, p_progress: progress })); toast.success('Progress updated'); break;
        case 'deliver': {
          let path: string | undefined;
          if (file) {
            if (file.size > 50 * MB) throw new Error('Files can be up to 50 MB. For bigger files, share a link in the note.');
            path = uploadPath(id, file);
            const up = await supabase.storage.from('deliveries').upload(path, file, { contentType: file.type || undefined });
            if (up.error) throw up.error;
          }
          if (!path && !n) throw new Error('Attach a file or describe the delivery.');
          must(await supabase.rpc('submit_delivery', { p_project_id: id, p_note: n, p_file_path: path }));
          toast.success('Delivered. The client has been notified.');
          break;
        }
        case 'approve': must(await supabase.rpc('approve_delivery', { p_project_id: id })); toast.success('Approved. The editor has been paid.'); break;
        case 'revision': must(await supabase.rpc('request_revision', { p_project_id: id, p_note: note.trim() })); toast.success('Change request sent'); break;
        case 'dispute': must(await supabase.rpc('open_dispute', { p_project_id: id, p_reason: note.trim() })); toast.success('Dispute opened. EditMe will be in touch.'); break;
        case 'review': must(await supabase.rpc('leave_review', { p_project_id: id, p_rating: rating, p_comment: n })); toast.success('Thanks for your review'); break;
      }
      setBusy(false);
      close();
      onDone();
    } catch (e) {
      setError(e instanceof Error && !('code' in e) ? e.message : await errorMessage(e));
      setBusy(false);
    }
  };

  const noteOk = c.note !== 'required' || (kind === 'dispute' ? note.trim().length >= 10 : note.trim().length > 0);

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.text(project)}</DialogDescription>
        </DialogHeader>

        {kind === 'review' && (
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" role="radio" aria-checked={rating === s} aria-label={`${s} star${s > 1 ? 's' : ''}`} onClick={() => setRating(s)}>
                <Star className={`w-8 h-8 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
              </button>
            ))}
          </div>
        )}

        {kind === 'progress' && (
          <div className="py-2">
            <div className="flex justify-between text-sm mb-3"><span className="text-gray-600">Progress</span><span className="font-semibold text-[#2979FF]">{progress}%</span></div>
            <Slider value={[progress]} min={0} max={99} step={1} onValueChange={([v]) => setProgress(v)} aria-label="Progress" />
          </div>
        )}

        {kind === 'deliver' && (
          <label className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-[#2979FF] hover:bg-blue-50/30 transition-all cursor-pointer block">
            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700 truncate">{file ? file.name : 'Choose a file'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{file ? `${(file.size / MB).toFixed(1)} MB` : 'Up to 50 MB. Bigger files: put a link in the note.'}</p>
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        )}

        {c.note && (
          <textarea rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={c.notePlaceholder}
            aria-label={c.notePlaceholder}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2979FF]/20 focus:border-[#2979FF] resize-none" />
        )}

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={close} disabled={busy} className="rounded-xl">Back</Button>
          <Button onClick={run} disabled={busy || !noteOk}
            className={`rounded-xl ${['cancel', 'decline', 'dispute'].includes(kind) ? 'bg-red-600 hover:bg-red-700' : 'bg-[#2979FF] hover:bg-[#1565C0]'}`}>
            {busy ? <Spinner className="text-white" /> : c.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
