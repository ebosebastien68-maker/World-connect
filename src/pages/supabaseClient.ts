// ============================================================================
// supabaseClient.ts — Client Supabase central
// ⚠️ Les marqueurs ci-dessous sont remplacés automatiquement par build.js
//    au moment du déploiement Vercel.
// ============================================================================

import { createClient, type SupabaseClient, type User, type Session } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  user_id: string;
  prenom: string;
  nom: string;
  role: 'admin' | 'user' | string;
}

export interface SupabaseClientWrapper {
  supabase: SupabaseClient;
  getCurrentUser(): Promise<User | null>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  signOut(): Promise<void>;
  redirectByRole(): Promise<void>;
  checkAuthAndRedirect(requireAuth?: boolean, requiredRole?: string | null): Promise<boolean>;
  isLoggedIn(): Promise<boolean>;
}

// Augmentation de window pour la compatibilité avec l'existant
declare global {
  interface Window {
    supabaseClient?: SupabaseClientWrapper;
  }
}

// ============================================================================
// CONFIG — remplacée au build par build.js
// ============================================================================

const SUPABASE_URL: string = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY: string = '__SUPABASE_ANON_KEY__';

// ============================================================================
// INITIALISATION (singleton — une seule instance)
// ============================================================================

if (!window.supabaseClient) {

  const supabaseInstance: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --------------------------------------------------------------------------
  // getCurrentUser
  // --------------------------------------------------------------------------

  /**
   * Récupère l'utilisateur actuellement connecté via la session active.
   * @returns L'objet User ou null si non connecté.
   */
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

  /**
   * Récupère le profil complet depuis la table `users_profile`.
   * @param userId — L'UUID de l'utilisateur.
   * @returns L'objet UserProfile ou null en cas d'erreur.
   */
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

  /**
   * Déconnecte l'utilisateur actuel et redirige vers l'accueil.
   */
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

  /**
   * Redirige l'utilisateur vers la page appropriée selon son rôle.
   */
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

  /**
   * Vérifie l'authentification et le rôle, et redirige si nécessaire.
   * @param requireAuth    — Si true, redirige vers connexion.html si non connecté.
   * @param requiredRole   — Si fourni, vérifie que l'utilisateur possède ce rôle.
   * @returns true si toutes les conditions sont remplies, false sinon.
   */
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

  /**
   * Vérifie si un utilisateur est connecté sans effectuer de redirection.
   * @returns true si connecté, false sinon.
   */
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
}

// ============================================================================
// EXPORT (pour import ES module dans les autres fichiers .ts/.tsx)
// ============================================================================

export default window.supabaseClient as SupabaseClientWrapper;
