import type { Availability, EditorCategory, ProjectStatus } from './supabase';

export const categoryLabels: Record<EditorCategory, string> = {
  video_editor: 'Video Editor',
  motion_designer: 'Motion Designer',
  animator: 'Animator',
  colorist: 'Colorist',
  vfx_artist: 'VFX Artist',
  youtube_editor: 'YouTube Editor',
};
export const categories = Object.keys(categoryLabels) as EditorCategory[];

export const availabilityLabels: Record<Availability, string> = {
  available: 'Available',
  busy: 'Busy',
  offline: 'Offline',
};
export const availabilityDot: Record<Availability, string> = {
  available: 'bg-emerald-500',
  busy: 'bg-amber-500',
  offline: 'bg-gray-400',
};

export const statusLabels: Record<ProjectStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  secured: 'Funds secured',
  in_progress: 'In progress',
  review: 'In review',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};
export const statusColors: Record<ProjectStatus, string> = {
  awaiting_payment: 'bg-gray-200 text-gray-700',
  secured: 'bg-[#9333ea] text-white',
  in_progress: 'bg-[#2979FF] text-white',
  review: 'bg-[#f59e0b] text-white',
  completed: 'bg-[#10b981] text-white',
  declined: 'bg-gray-400 text-white',
  cancelled: 'bg-gray-400 text-white',
  disputed: 'bg-red-500 text-white',
};
/** Projects still moving (not finished or closed). */
export const activeStatuses: ProjectStatus[] = ['secured', 'in_progress', 'review', 'disputed'];

/** 12345 -> "$123.45"; whole dollars drop the cents. */
export function money(cents: number | null | undefined, currency = 'usd'): string {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** 125000 -> "$1.3K" for tight spaces. */
export function moneyShort(cents: number | null | undefined): string {
  const value = (cents ?? 0) / 100;
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  return money(cents);
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return shortDate(iso);
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
