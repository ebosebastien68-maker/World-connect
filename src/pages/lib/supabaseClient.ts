// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

// ── Helpers ────────────────────────────────────────────────────────────────

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users_profile')
    .select('prenom, nom, role')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function isLoggedIn(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
