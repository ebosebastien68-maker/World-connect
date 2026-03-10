// ============================================================================ // supabaseClient.ts — Client Supabase central (mis à jour pour Vercel) // ============================================================================

import { createClient, type SupabaseClient, type User, type Session } from '@supabase/supabase-js';

// ============================================================================ // TYPES // ============================================================================

export interface UserProfile { user_id: string; prenom: string; nom: string; role: 'admin' | 'user' | string; }

export interface SupabaseClientWrapper { supabase: SupabaseClient; getCurrentUser(): Promise<User | null>; getUserProfile(userId: string): Promise<UserProfile | null>; signOut(): Promise<void>; redirectByRole(): Promise<void>; checkAuthAndRedirect(requireAuth?: boolean, requiredRole?: string | null): Promise<boolean>; isLoggedIn(): Promise<boolean>; }

// Augmentation de window pour la compatibilité avec l'existant declare global { interface Window { supabaseClient?: SupabaseClientWrapper; } }

// ============================================================================ // CONFIG — récupérée depuis les variables d'environnement (Vercel) // - Définir dans le dashboard Vercel : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY // ============================================================================

const SUPABASE_URL: string = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''; const SUPABASE_ANON_KEY: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// ============================================================================ // INITIALISATION (singleton — une seule instance côté client) // ============================================================================

// IMPORTANT : Ne toucher au "window" que si on est bien côté navigateur. if (typeof window !== 'undefined') { if (!window.supabaseClient) { if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { console.warn( '⚠️ Supabase : variables d'environnement manquantes (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Vérifie le dashboard Vercel.' ); }

const supabaseInstance: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --------------------------------------------------------------------------
// getCurrentUser
// --------------------------------------------------------------------------
async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session }, error } = await supabaseInstance.auth.getSession();
    if (error) throw error;
    return (session as Session | null)?.user ?? null;
  } catch (err) {
    console.error('Erreur lors de la récupération de la session:', (err as Error).message);
    return null;
  }
}

// --------------------------------------------------------------------------
// getUserProfile
// --------------------------------------------------------------------------
async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.error('getUserProfile a été appelé sans userId.');
    return null;
  }

  try {
    const { data, error, status } = await supabaseInstance
      .from('users_profile')
      .select('user_id, prenom, nom, role')
      .eq('user_id', userId)
      .single();

    if (error && status !== 406) throw error;

    return data as UserProfile | null;
  } catch (err) {
    console.error('Erreur lors de la récupération du profil:', (err as Error).message);
    return null;
  }
}

// --------------------------------------------------------------------------
// signOut
// --------------------------------------------------------------------------
async function signOut(): Promise<void> {
  const { error } = await supabaseInstance.auth.signOut();
  if (error) {
    console.error('Erreur lors de la déconnexion:', error.message);
  }
  window.location.href = '/';
}

// --------------------------------------------------------------------------
// redirectByRole
// --------------------------------------------------------------------------
async function redirectByRole(): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    console.log('Redirection annulée : utilisateur non connecté.');
    return;
  }

  const profile = await getUserProfile(user.id);

  if (!profile) {
    console.warn('Profil utilisateur introuvable. Redirection vers index.html par défaut.');
    window.location.href = 'index.html';
    return;
  }

  window.location.href = profile.role === 'admin' ? 'publier.html' : 'index.html';
}

// --------------------------------------------------------------------------
// checkAuthAndRedirect
// --------------------------------------------------------------------------
async function checkAuthAndRedirect(
  requireAuth = false,
  requiredRole: string | null = null,
): Promise<boolean> {
  const user = await getCurrentUser();

  if (requireAuth && !user) {
    console.log('Authentification requise. Redirection vers connexion.html');
    window.location.href = 'connexion.html';
    return false;
  }

  if (user && requiredRole) {
    const profile = await getUserProfile(user.id);

    if (!profile) {
      console.warn('Profil introuvable. Déconnexion et redirection.');
      await signOut();
      return false;
    }

    if (profile.role !== requiredRole) {
      console.warn(`Rôle insuffisant. Requis : ${requiredRole}, Actuel : ${profile.role}`);
      window.location.href = profile.role === 'admin' ? 'publier.html' : 'index.html';
      return false;
    }
  }

  return true;
}

// --------------------------------------------------------------------------
// isLoggedIn
// --------------------------------------------------------------------------
async function isLoggedIn(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// --------------------------------------------------------------------------
// Exposition sur window
// --------------------------------------------------------------------------
window.supabaseClient = {
  supabase: supabaseInstance,
  getCurrentUser,
  getUserProfile,
  signOut,
  redirectByRole,
  checkAuthAndRedirect,
  isLoggedIn,
};

console.log('✅ Supabase Client initialisé avec succès');

} }

// ============================================================================ // EXPORT (pour import ES module dans les autres fichiers .ts/.tsx) // Note : côté serveur (SSR) window n'existe pas — on retourne un cast pour garder // la compatibilité avec l'API existante côté client. // ============================================================================

export default (typeof window !== 'undefined' && window.supabaseClient) ? (window.supabaseClient as SupabaseClientWrapper) : (null as unknown as SupabaseClientWrapper);
