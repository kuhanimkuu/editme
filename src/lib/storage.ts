import { supabase } from './supabase';

/** A public file (avatars, portfolio) as a URL; full URLs pass through. */
export function publicUrl(bucket: 'avatars' | 'portfolio', path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** A private file (deliveries, chat attachments): a link valid for 10 minutes. */
export async function signedUrl(bucket: 'deliveries' | 'chat-attachments', path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 600);
  if (error) return null;
  return data.signedUrl;
}

/** Keeps letters, digits, dots, dashes; storage keys must be simple. */
export function safeFileName(name: string): string {
  const cleaned = name.normalize('NFKD').replace(/[^\w.-]+/g, '_').replace(/_+/g, '_');
  return cleaned.slice(-80) || 'file';
}

/** "<folder>/<random>-<name>": unique, so uploads never overwrite. */
export function uploadPath(folder: string, file: File): string {
  return `${folder}/${crypto.randomUUID().slice(0, 8)}-${safeFileName(file.name)}`;
}

export const MB = 1024 * 1024;
