import { useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Spinner } from './common';
import { supabase, type Availability, type EditorCategory, type EditorProfile, type Profile, type ServicePlan } from '../../lib/supabase';
import { availabilityLabels, categories, categoryLabels } from '../../lib/format';
import { errorMessage, must } from '../../lib/errors';

const inputCls = 'rounded-xl';
const textareaCls = 'w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2979FF]/20 focus:border-[#2979FF] resize-none';
const selectCls = 'w-full h-9 px-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2979FF]/20';

function Row({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

/** "Premiere Pro, After Effects" -> ["Premiere Pro", "After Effects"] (max 20, 40 chars each). */
const parseSkills = (s: string) => [...new Set(s.split(',').map((x) => x.trim().slice(0, 40)).filter(Boolean))].slice(0, 20);

/* ─────────── First-time editor setup ─────────── */

export function EditorSetup({ uid, onDone }: { uid: string; onDone: () => void }) {
  const [category, setCategory] = useState<EditorCategory>('video_editor');
  const [headline, setHeadline] = useState('');
  const [skills, setSkills] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      must(await supabase.from('editor_profiles').insert({
        user_id: uid, category, headline: headline.trim() || null, skills: parseSkills(skills),
      }));
      toast.success('Your editor profile is live. Three starter packages were added; adjust them under Services.');
      onDone();
    } catch (err) {
      setError(await errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4"><Palette className="w-6 h-6 text-[#9333ea]" /></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Set up your editor profile</h1>
        <p className="text-sm text-gray-500 mb-6">Clients find you on Discover. You can change all of this later.</p>
        <form onSubmit={submit} className="space-y-4">
          <Row id="setup-cat" label="What do you do?">
            <select id="setup-cat" className={selectCls} value={category} onChange={(e) => setCategory(e.target.value as EditorCategory)}>
              {categories.map((c) => <option key={c} value={c}>{categoryLabels[c]}</option>)}
            </select>
          </Row>
          <Row id="setup-headline" label="Headline" hint="One line clients see on your card">
            <Input id="setup-headline" className={inputCls} maxLength={160} placeholder="e.g. Cinematic brand films and product launches"
              value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </Row>
          <Row id="setup-skills" label="Skills and software" hint="Separate with commas">
            <Input id="setup-skills" className={inputCls} placeholder="Premiere Pro, DaVinci Resolve, Color grading"
              value={skills} onChange={(e) => setSkills(e.target.value)} />
          </Row>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full rounded-xl bg-[#2979FF] hover:bg-[#1565C0]">
            {busy ? <Spinner className="text-white" /> : 'Create editor profile'}
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ─────────── Edit profile ─────────── */

export function EditProfileDialog({
  open, onClose, onSaved, profile, editor, isEditor,
}: {
  open: boolean; onClose: () => void; onSaved: () => void;
  profile: Profile; editor: EditorProfile | null; isEditor: boolean;
}) {
  const [name, setName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [location, setLocation] = useState(profile.location ?? '');
  const [website, setWebsite] = useState(profile.website ?? '');
  const [company, setCompany] = useState(profile.company_name ?? '');
  const [category, setCategory] = useState<EditorCategory>(editor?.category ?? 'video_editor');
  const [headline, setHeadline] = useState(editor?.headline ?? '');
  const [rate, setRate] = useState(editor?.hourly_rate_cents != null ? String(editor.hourly_rate_cents / 100) : '');
  const [skills, setSkills] = useState(editor?.skills.join(', ') ?? '');
  const [availability, setAvailability] = useState<Availability>(editor?.availability ?? 'available');
  const [listed, setListed] = useState(editor?.is_listed ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const site = website.trim();
  const userOk = !username || /^[a-z0-9_]{3,30}$/.test(username);
  const siteOk = !site || (/^https:\/\/[^\s]+\.[^\s]+$/.test(site) && site.length <= 200);
  const valid = name.trim().length > 0 && userOk && siteOk;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const p = await supabase.from('profiles').update({
        display_name: name.trim(), username: username || null, bio: bio.trim() || null,
        location: location.trim() || null, website: site || null, company_name: company.trim() || null,
      }).eq('id', profile.id);
      if (p.error) {
        if (p.error.code === '23505') throw new Error('That username is taken.');
        throw p.error;
      }
      if (isEditor && editor) {
        must(await supabase.from('editor_profiles').update({
          category, headline: headline.trim() || null,
          hourly_rate_cents: rate ? Math.round(Number(rate) * 100) : null,
          skills: parseSkills(skills), availability, is_listed: listed,
        }).eq('user_id', profile.id));
      }
      toast.success('Profile saved');
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error && !('code' in e) ? e.message : await errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>{isEditor ? 'What clients see on your page and Discover card.' : 'What editors see about you.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Row id="ep-name" label={isEditor ? 'Name' : 'Name or company'}>
            <Input id="ep-name" className={inputCls} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </Row>
          <Row id="ep-username" label="Username" hint={userOk ? '3-30 lowercase letters, numbers or _' : 'Use 3-30 lowercase letters, numbers or _'}>
            <Input id="ep-username" className={inputCls} maxLength={30} value={username} aria-invalid={!userOk}
              onChange={(e) => setUsername(e.target.value.toLowerCase())} />
          </Row>
          {!isEditor && (
            <Row id="ep-company" label="Company (optional)">
              <Input id="ep-company" className={inputCls} maxLength={100} value={company} onChange={(e) => setCompany(e.target.value)} />
            </Row>
          )}
          {isEditor && editor && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Row id="ep-cat" label="Specialization">
                  <select id="ep-cat" className={selectCls} value={category} onChange={(e) => setCategory(e.target.value as EditorCategory)}>
                    {categories.map((c) => <option key={c} value={c}>{categoryLabels[c]}</option>)}
                  </select>
                </Row>
                <Row id="ep-avail" label="Availability">
                  <select id="ep-avail" className={selectCls} value={availability} onChange={(e) => setAvailability(e.target.value as Availability)}>
                    {(Object.keys(availabilityLabels) as Availability[]).map((a) => <option key={a} value={a}>{availabilityLabels[a]}</option>)}
                  </select>
                </Row>
              </div>
              <Row id="ep-headline" label="Headline">
                <Input id="ep-headline" className={inputCls} maxLength={160} value={headline} onChange={(e) => setHeadline(e.target.value)} />
              </Row>
              <Row id="ep-skills" label="Skills" hint="Separate with commas (up to 20)">
                <Input id="ep-skills" className={inputCls} value={skills} onChange={(e) => setSkills(e.target.value)} />
              </Row>
              <Row id="ep-rate" label="Hourly rate in USD (optional)" hint="Packages are what clients actually buy; this is a guide.">
                <Input id="ep-rate" className={inputCls} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ''))} />
              </Row>
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50">
                <div>
                  <Label htmlFor="ep-listed">Show me on Discover</Label>
                  <p className="text-xs text-gray-500">Turn off while you're away. Current projects carry on.</p>
                </div>
                <Switch id="ep-listed" checked={listed} onCheckedChange={setListed} />
              </div>
            </>
          )}
          <Row id="ep-bio" label="About">
            <textarea id="ep-bio" rows={4} maxLength={1000} className={textareaCls} value={bio} onChange={(e) => setBio(e.target.value)} />
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <Row id="ep-loc" label="Location">
              <Input id="ep-loc" className={inputCls} maxLength={100} value={location} onChange={(e) => setLocation(e.target.value)} />
            </Row>
            <Row id="ep-site" label="Website" hint={siteOk ? undefined : 'Use a full https:// address'}>
              <Input id="ep-site" className={inputCls} placeholder="https://" value={website} aria-invalid={!siteOk} onChange={(e) => setWebsite(e.target.value)} />
            </Row>
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0]" onClick={save} disabled={!valid || busy}>
            {busy ? <Spinner className="text-white" /> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────── Edit a package ─────────── */

export function PlanEditDialog({ plan, onClose, onSaved }: { plan: ServicePlan | null; onClose: () => void; onSaved: () => void }) {
  return (
    <Dialog open={!!plan} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        {plan && <PlanForm key={plan.id} plan={plan} onClose={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function PlanForm({ plan, onClose, onSaved }: { plan: ServicePlan; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description ?? '');
  const [price, setPrice] = useState(String(plan.price_cents / 100));
  const [days, setDays] = useState(String(plan.delivery_days));
  const [unlimited, setUnlimited] = useState(plan.revisions === null);
  const [revisions, setRevisions] = useState(String(plan.revisions ?? 2));
  const [features, setFeatures] = useState(plan.features.join('\n'));
  const [active, setActive] = useState(plan.is_active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cents = Math.round(Number(price) * 100);
  const d = Number(days);
  const r = Number(revisions);
  const valid = name.trim() && cents >= 500 && cents <= 10000000 && Number.isInteger(d) && d >= 1 && d <= 90
    && (unlimited || (Number.isInteger(r) && r >= 0 && r <= 50));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      must(await supabase.from('service_plans').update({
        name: name.trim(), description: description.trim() || null, price_cents: cents, delivery_days: d,
        revisions: unlimited ? null : r,
        features: features.split('\n').map((f) => f.trim().slice(0, 80)).filter(Boolean).slice(0, 10),
        is_active: active,
      }).eq('id', plan.id));
      toast.success('Package saved. New hires use the new price.');
      onSaved();
      onClose();
    } catch (e) {
      setError(await errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit {plan.tier} package</DialogTitle>
        <DialogDescription>Projects already hired keep the price they were hired at.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Row id="pl-name" label="Name"><Input id="pl-name" className={inputCls} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} /></Row>
          <Row id="pl-desc" label="Short title"><Input id="pl-desc" className={inputCls} maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} /></Row>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Row id="pl-price" label="Price (USD)" hint="At least $5">
            <Input id="pl-price" className={inputCls} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))} />
          </Row>
          <Row id="pl-days" label="Delivery (days)" hint="1 to 90">
            <Input id="pl-days" className={inputCls} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} />
          </Row>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Row id="pl-rev" label="Revisions">
              <Input id="pl-rev" className={inputCls} inputMode="numeric" disabled={unlimited} value={unlimited ? '' : revisions}
                onChange={(e) => setRevisions(e.target.value.replace(/\D/g, ''))} />
            </Row>
          </div>
          <label className="flex items-center gap-2 text-sm pb-2"><Switch checked={unlimited} onCheckedChange={setUnlimited} />Unlimited</label>
        </div>
        <Row id="pl-features" label="What's included" hint="One per line, up to 10">
          <textarea id="pl-features" rows={5} className={textareaCls} value={features} onChange={(e) => setFeatures(e.target.value)} />
        </Row>
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50">
          <div><Label htmlFor="pl-active">Offer this package</Label><p className="text-xs text-gray-500">Hidden packages can't be hired.</p></div>
          <Switch id="pl-active" checked={active} onCheckedChange={setActive} />
        </div>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button className="rounded-xl bg-[#2979FF] hover:bg-[#1565C0]" onClick={save} disabled={!valid || busy}>
          {busy ? <Spinner className="text-white" /> : 'Save package'}
        </Button>
      </DialogFooter>
    </>
  );
}
