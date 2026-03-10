// src/pages/supabaseClient.ts
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  user_id: string;
  prenom: string;
  nom: string;
  role: 'admin' | 'user' | string;
}

// ============================================================================
// CONFIG — variables Vite (préfixe VITE_ obligatoire)
// À définir dans Vercel : Settings → Environment Variables
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '❌ supabaseClient introuvable : variables VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquantes.\n' +
    'Vérifiez le dashboard Vercel → Settings → Environment Variables.'
  );
}

// ============================================================================
// INSTANCE SINGLETON
// ============================================================================

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// HELPERS
// ============================================================================

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session?.user ?? null;
  } catch (err) {
    console.error('Erreur session:', err);
    return null;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  try {
    const { data, error, status } = await supabase
      .from('users_profile')
      .select('user_id, prenom, nom, role')
      .eq('user_id', userId)
      .single();
    if (error && status !== 406) throw error;
    return data as UserProfile | null;
  } catch (err) {
    console.error('Erreur profil:', err);
    return null;
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default supabase;
