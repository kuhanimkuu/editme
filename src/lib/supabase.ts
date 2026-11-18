import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Both values are public by design (they ship in the page); row level
// security in the database decides what each person can read and write.
// Set them in .env.local (see .env.example).
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill them in.',
  );
}

export const supabase = createClient<Database>(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export type Profile = Tables<'profiles'>;
export type EditorProfile = Tables<'editor_profiles'>;
export type ServicePlan = Tables<'service_plans'>;
export type PortfolioItem = Tables<'portfolio_items'>;
export type Project = Tables<'projects'>;
export type ProjectStatus = Enums<'project_status'>;
export type EditorCategory = Enums<'editor_category'>;
export type Availability = Enums<'availability'>;
export type EditorCard = Views<'editor_cards'>;
export type WalletTransaction = Tables<'wallet_transactions'>;
export type Message = Tables<'messages'>;
export type Notification = Tables<'notifications'>;
export type Review = Tables<'reviews'>;
