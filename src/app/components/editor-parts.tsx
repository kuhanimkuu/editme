import { useState } from 'react';
import { CheckCircle, Clock, ExternalLink, Play, Star, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { UserAvatar } from './common';
import { money, shortDate } from '../../lib/format';
import { publicUrl } from '../../lib/storage';
import type { PortfolioItem, ServicePlan } from '../../lib/supabase';

export function Stars({ value, size = 'w-3.5 h-3.5' }: { value: number; size?: string }) {
  return (
    <span className="flex gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${size} ${s <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
      ))}
    </span>
  );
}

export function revisionsLabel(revisions: number | null) {
  if (revisions === null) return 'Unlimited revisions';
  return `${revisions} revision${revisions === 1 ? '' : 's'}`;
}

/* ─────────── Plans ─────────── */

export function PlanCards({
  plans, onPick, onEdit, pickLabel = 'Choose',
}: {
  plans: ServicePlan[];
  onPick?: (plan: ServicePlan) => void;
  onEdit?: (plan: ServicePlan) => void;
  pickLabel?: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {plans.map((plan) => {
        const highlight = plan.tier === 'standard';
        return (
          <div key={plan.id}
            className={`relative rounded-2xl border p-5 flex flex-col ${highlight ? 'border-[#2979FF]/40 bg-[#EFF6FF]' : 'border-gray-200 bg-white'} ${plan.is_active ? '' : 'opacity-60'}`}>
            {highlight && plan.is_active && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#2979FF] text-white text-[11px] font-semibold rounded-full">Most Popular</span>
            )}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              {plan.name}{!plan.is_active && ' · hidden'}
            </p>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.description || plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-bold">{money(plan.price_cents)}</span>
              <span className="text-xs text-gray-500">/ project</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mb-4">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#2979FF]" />{plan.delivery_days} day{plan.delivery_days === 1 ? '' : 's'}</span>
              <span>{revisionsLabel(plan.revisions)}</span>
            </div>
            <ul className="space-y-1.5 mb-5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-700">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            {onPick && (
              <Button size="sm" onClick={() => onPick(plan)} className="w-full rounded-xl bg-[#2979FF] hover:bg-[#1565C0] text-xs">{pickLabel}</Button>
            )}
            {onEdit && (
              <Button size="sm" variant="outline" onClick={() => onEdit(plan)} className="w-full rounded-xl border-gray-200 text-xs">Edit package</Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────── Portfolio ─────────── */

type VideoRef = { kind: 'youtube' | 'vimeo'; id: string } | null;

export function parseVideoUrl(url: string | null | undefined): VideoRef {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
    if (host === 'youtu.be') return { kind: 'youtube', id: u.pathname.slice(1).split('/')[0] };
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const id = u.searchParams.get('v') ?? u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{6,})/)?.[1];
      return id ? { kind: 'youtube', id } : null;
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = u.pathname.match(/(\d{5,})/)?.[1];
      return id ? { kind: 'vimeo', id } : null;
    }
  } catch {
    /* not a URL */
  }
  return null;
}

const isVideoFile = (path: string | null) => !!path && /\.(mp4|mov|webm)$/i.test(path);

/** What a portfolio card shows as its picture. */
export function portfolioThumb(item: Pick<PortfolioItem, 'thumbnail_path' | 'media_path' | 'video_url'>): string | undefined {
  if (item.thumbnail_path) return publicUrl('portfolio', item.thumbnail_path);
  if (item.media_path && !isVideoFile(item.media_path)) return publicUrl('portfolio', item.media_path);
  const ref = parseVideoUrl(item.video_url);
  if (ref?.kind === 'youtube') return `https://i.ytimg.com/vi/${ref.id}/hqdefault.jpg`;
  return undefined;
}

export function PortfolioGrid({
  items, onDelete,
}: { items: PortfolioItem[]; onDelete?: (item: PortfolioItem) => void }) {
  const [open, setOpen] = useState<PortfolioItem | null>(null);
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const thumb = portfolioThumb(item);
          return (
            <div key={item.id} className="group relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
              <button onClick={() => setOpen(item)} className="absolute inset-0 w-full h-full" aria-label={`Play ${item.title}`}>
                {thumb ? (
                  <img src={thumb} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : isVideoFile(item.media_path) ? (
                  <video src={publicUrl('portfolio', item.media_path)} muted preload="metadata" className="w-full h-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-4 h-4 text-[#2979FF] fill-[#2979FF] ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 text-left bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white font-semibold text-xs truncate">{item.title}</p>
                </div>
              </button>
              {onDelete && (
                <button onClick={() => onDelete(item)} aria-label={`Remove ${item.title}`}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <PortfolioViewer item={open} onClose={() => setOpen(null)} />
    </>
  );
}

function PortfolioViewer({ item, onClose }: { item: PortfolioItem | null; onClose: () => void }) {
  const ref = parseVideoUrl(item?.video_url);
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl rounded-2xl">
        {item && (
          <>
            <DialogHeader><DialogTitle>{item.title}</DialogTitle></DialogHeader>
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              {ref?.kind === 'youtube' ? (
                <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${ref.id}`} title={item.title}
                  allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
              ) : ref?.kind === 'vimeo' ? (
                <iframe className="w-full h-full" src={`https://player.vimeo.com/video/${ref.id}`} title={item.title}
                  allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
              ) : isVideoFile(item.media_path) ? (
                <video className="w-full h-full" src={publicUrl('portfolio', item.media_path)} controls autoPlay />
              ) : item.media_path ? (
                <img className="w-full h-full object-contain" src={publicUrl('portfolio', item.media_path)} alt={item.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <a href={item.video_url ?? '#'} target="_blank" rel="noopener noreferrer" className="text-white underline flex items-center gap-1.5">
                    Open video <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
            {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((t) => <span key={t} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">{t}</span>)}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─────────── Reviews ─────────── */

export interface ReviewRow {
  project_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  /** The other person: the client (on an editor's page) or the editor. */
  name: string | null;
  avatar_url: string | null;
  project_title?: string | null;
}

export function ReviewList({ reviews }: { reviews: ReviewRow[] }) {
  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.project_id} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-start gap-3">
            <UserAvatar name={r.name} url={r.avatar_url} className="h-9 w-9 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{r.name ?? 'Deleted account'}</span>
                {r.project_title && <span className="text-xs text-gray-400">· {r.project_title}</span>}
                <span className="text-xs text-gray-400 ml-auto">{shortDate(r.created_at)}</span>
              </div>
              <div className="mb-2"><Stars value={r.rating} size="w-3 h-3" /></div>
              {r.comment && <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{r.comment}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
