// pages/connexion.tsx
// ✅ Pages Router — pas de 'use client'
// ✅ useRouter de 'next/router'
// ✅ supabase importé directement depuis @/lib/supabaseClient
// ✅ CSS intégré dans le fichier via injection <style>

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/lib/supabaseClient';

// ============================================================================
// CSS INLINE
// ============================================================================
const STYLES = `
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --primary: #6B8E23;
  --primary-dark: #556B2F;
  --primary-light: #9ACD32;
  --secondary: #8A9A5B;
  --accent: #BDB76B;
  --success: #2E8B57;
  --error: #8B0000;
  --warning: #DAA520;
  --text-primary: #2F4F4F;
  --text-secondary: #696969;
  --border: #D3D3D3;
  --bg-light: #F5F5DC;
  --bg-card: #FFFFFF;
  --shadow-sm: 0 2px 4px rgba(107,142,35,0.1);
  --shadow-md: 0 4px 8px rgba(107,142,35,0.15);
  --shadow-lg: 0 8px 16px rgba(107,142,35,0.2);
  --shadow-xl: 0 12px 24px rgba(107,142,35,0.25);
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #F5F5DC 0%, #F0E68C 100%);
  background-attachment: fixed;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow-x: hidden;
  position: relative;
}

body::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(154,205,50,0.1), transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(139,134,78,0.1), transparent 50%),
    radial-gradient(circle at 40% 20%, rgba(107,142,35,0.1), transparent 50%);
  pointer-events: none;
}

.container {
  background: var(--bg-card);
  border-radius: 20px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  width: 100%;
  max-width: 480px;
  position: relative;
  animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(107,142,35,0.1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.header {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  padding: 30px;
  text-align: center;
  color: white;
}

.logo {
  font-size: 32px; font-weight: 700; margin-bottom: 10px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
}
.logo i { font-size: 36px; }
.tagline { font-size: 14px; opacity: 0.9; font-weight: 400; }

.tabs {
  display: flex;
  background: var(--bg-light);
  border-bottom: 2px solid var(--border);
  position: relative;
}

.tab-indicator {
  position: absolute; bottom: -2px; height: 2px;
  background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  border-radius: 2px 2px 0 0;
  box-shadow: 0 0 8px rgba(107,142,35,0.4);
}

.tab {
  flex: 1; padding: 18px 20px; text-align: center;
  cursor: pointer; font-weight: 600; color: var(--text-secondary);
  transition: all 0.2s ease; font-size: 14px; position: relative;
  background: transparent; z-index: 1; letter-spacing: 0.3px; border: none;
  font-family: inherit;
}
.tab.active { color: var(--primary); background: white; }
.tab:hover:not(.active) { color: var(--text-primary); background: rgba(107,142,35,0.05); }

.form-container { padding: 40px 36px; position: relative; }

.form-content { display: none; animation: fadeIn 0.4s ease-in-out; }
.form-content.active { display: block; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}

h2 {
  color: var(--text-primary); margin-bottom: 8px; text-align: center;
  font-size: 26px; font-weight: 700; letter-spacing: -0.5px;
}

.subtitle {
  text-align: center; color: var(--text-secondary);
  margin-bottom: 28px; font-size: 14px; line-height: 1.5;
}

.oauth-buttons { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }

.oauth-btn {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 12px 18px; border: 1.5px solid var(--border); border-radius: 10px;
  background: white; font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease; color: var(--text-primary);
  position: relative; overflow: hidden; font-family: inherit;
}
.oauth-btn::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(107,142,35,0.05), transparent);
  transition: left 0.4s;
}
.oauth-btn:hover::before { left: 100%; }
.oauth-btn:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
.oauth-btn:active { transform: translateY(0); }
.oauth-btn svg, .oauth-btn i { width: 18px; height: 18px; flex-shrink: 0; }
.oauth-btn.github i { font-size: 18px; color: #24292e; }
.oauth-btn.github:hover { background: linear-gradient(135deg,#f6f8fa,#fff); border-color: #24292e; }
.oauth-btn.discord i { font-size: 18px; color: #5865F2; }
.oauth-btn.discord:hover { background: linear-gradient(135deg,#eef0ff,#fff); border-color: #5865F2; }

.divider {
  display: flex; align-items: center; text-align: center;
  margin: 24px 0; color: var(--text-secondary); font-size: 12px;
  font-weight: 600; letter-spacing: 0.5px;
}
.divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid var(--border); }
.divider span { padding: 0 14px; }

.input-group { margin-bottom: 18px; position: relative; }

label {
  display: block; margin-bottom: 6px; color: var(--text-primary);
  font-weight: 600; font-size: 13px; transition: color 0.3s; letter-spacing: 0.2px;
}

.input-wrapper { position: relative; }

.input-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: var(--text-secondary); transition: color 0.3s;
  pointer-events: none; font-size: 16px;
}

input {
  width: 100%; padding: 12px 14px; padding-left: 42px;
  border: 1.5px solid var(--border); border-radius: 10px;
  font-size: 14px; transition: all 0.2s ease;
  background: white; color: var(--text-primary); font-family: inherit;
}
input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(107,142,35,0.1); }
input.error { border-color: var(--error); animation: shake 0.3s; }
input.success { border-color: var(--success); }
input::placeholder { color: #9ca3af; }

@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%      { transform: translateX(-8px); }
  75%      { transform: translateX(8px); }
}

.password-toggle {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  cursor: pointer; color: var(--text-secondary); transition: color 0.2s; z-index: 2; font-size: 16px;
}
.password-toggle:hover { color: var(--primary); }

.password-strength { margin-top: 6px; display: none; }
.password-strength.show { display: block; }

.strength-bar { height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
.strength-fill { height: 100%; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); border-radius: 2px; }
.strength-text { font-size: 11px; font-weight: 600; }

.strength-weak .strength-fill   { width: 33%; background: var(--error); }
.strength-weak .strength-text   { color: var(--error); }
.strength-medium .strength-fill { width: 66%; background: var(--warning); }
.strength-medium .strength-text { color: var(--warning); }
.strength-strong .strength-fill { width: 100%; background: var(--success); }
.strength-strong .strength-text { color: var(--success); }

.btn {
  width: 100%; padding: 13px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white; border: none; border-radius: 10px;
  font-size: 15px; font-weight: 700; cursor: pointer;
  transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(107,142,35,0.25);
  position: relative; overflow: hidden; letter-spacing: 0.3px; font-family: inherit;
}
.btn::before {
  content: ''; position: absolute; top: 50%; left: 50%;
  width: 0; height: 0; border-radius: 50%; background: rgba(255,255,255,0.15);
  transform: translate(-50%,-50%); transition: width 0.5s, height 0.5s;
}
.btn:hover::before { width: 300px; height: 300px; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(107,142,35,0.35); }
.btn:active { transform: translateY(0); }
.btn:disabled { background: linear-gradient(135deg,#9ca3af,#6b7280); cursor: not-allowed; transform: none; box-shadow: none; }
.btn span { position: relative; z-index: 1; }

.message {
  padding: 12px 14px; border-radius: 10px; margin-bottom: 20px;
  text-align: center; display: none; font-size: 13px; font-weight: 500;
}
.message.error   { background: #fef2f2; color: var(--error);   border: 1.5px solid #fecaca; }
.message.success { background: #f0fdf4; color: var(--success); border: 1.5px solid #bbf7d0; }
.message.info    { background: #eff6ff; color: #2563eb;        border: 1.5px solid #bfdbfe; }
.message.show {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.loader { display: none; text-align: center; padding: 36px 20px; }
.loader.show { display: block; }

.spinner {
  border: 3px solid var(--bg-light); border-top: 3px solid var(--primary);
  border-radius: 50%; width: 44px; height: 44px;
  animation: spin 0.7s linear infinite; margin: 0 auto;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.loader-text { margin-top: 16px; color: var(--text-secondary); font-size: 13px; font-weight: 500; }

.name-group { display: flex; gap: 12px; }
.name-group .input-group { flex: 1; }

.info-text {
  background: var(--bg-light); padding: 14px; border-radius: 10px;
  margin-bottom: 20px; color: var(--text-primary); font-size: 13px;
  line-height: 1.6; border: 1.5px solid var(--border);
  display: flex; align-items: start; gap: 10px;
}
.info-text i { color: var(--primary); margin-top: 2px; flex-shrink: 0; font-size: 16px; }

.action-links { display: flex; justify-content: space-between; margin-top: 20px; flex-wrap: wrap; gap: 10px; }

.action-link {
  color: var(--primary); text-decoration: none; font-weight: 600; font-size: 13px;
  transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 5px;
  padding: 8px 12px; border-radius: 8px; background: rgba(107,142,35,0.05);
  cursor: pointer; border: none; font-family: inherit;
}
.action-link:hover { color: var(--primary-dark); background: rgba(107,142,35,0.1); transform: translateY(-1px); }
.action-link i { font-size: 14px; }

.checkbox-group { display: flex; align-items: start; gap: 10px; margin-bottom: 18px; }
.checkbox-group input[type="checkbox"] { width: 17px; height: 17px; padding: 0; margin-top: 2px; cursor: pointer; accent-color: var(--primary); }
.checkbox-group label { font-size: 12px; font-weight: 400; margin: 0; cursor: pointer; user-select: none; line-height: 1.5; }
.checkbox-group label a { color: var(--primary); text-decoration: none; font-weight: 600; }
.checkbox-group label a:hover { text-decoration: underline; }

.features {
  background: linear-gradient(135deg,rgba(107,142,35,0.04),rgba(85,107,47,0.04));
  padding: 18px; border-radius: 10px; margin-bottom: 20px;
  border: 1px solid rgba(107,142,35,0.1);
}
.features h3 { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
.features h3 i { color: var(--primary); font-size: 16px; }
.feature-list { display: grid; gap: 10px; }
.feature-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-secondary); }
.feature-item i { color: var(--primary); font-size: 15px; flex-shrink: 0; }

.switch-tab { text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
.switch-tab p { color: var(--text-secondary); font-size: 13px; margin-bottom: 8px; }

.btn-secondary {
  background: transparent; border: 2px solid var(--primary); color: var(--primary);
  font-weight: 600; padding: 10px 20px; border-radius: 8px; cursor: pointer;
  transition: all 0.2s ease; font-family: inherit; font-size: 14px;
}
.btn-secondary:hover { background: rgba(107,142,35,0.05); transform: translateY(-2px); }

.user-guide {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--accent) 100%);
  padding: 16px; border-radius: 10px; margin-bottom: 20px; color: white;
}
.user-guide h4 { font-size: 14px; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
.user-guide p { font-size: 12px; line-height: 1.5; opacity: 0.9; }

@media (max-width: 480px) {
  body { padding: 12px; }
  .form-container { padding: 32px 28px; }
  h2 { font-size: 24px; }
  .subtitle { font-size: 13px; }
  .name-group { flex-direction: column; gap: 18px; }
  .oauth-buttons { gap: 8px; }
  .oauth-btn { padding: 11px 16px; font-size: 13px; }
  .tab { padding: 16px 12px; font-size: 13px; }
  input { font-size: 14px; padding: 11px 12px; padding-left: 40px; }
  .btn { padding: 12px; font-size: 14px; }
  .action-links { flex-direction: column; gap: 8px; }
}
`;

// ============================================================================
// TYPES
// ============================================================================

type TabName = 'connexion' | 'inscription' | 'reset';
type MessageType = 'success' | 'error' | 'info';

interface MessageState {
  text: string;
  type: MessageType;
  visible: boolean;
}

interface PasswordStrength {
  level: 'weak' | 'medium' | 'strong' | null;
  text: string;
  show: boolean;
}

// ============================================================================
// SVG GOOGLE ICON
// ============================================================================

const GoogleIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width={18} height={18}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ============================================================================
// SOUS-COMPOSANT — BOUTONS OAUTH
// ============================================================================

const OAuthButtons: React.FC<{
  onSelect: (provider: 'google' | 'github' | 'discord') => void;
}> = ({ onSelect }) => (
  <div className="oauth-buttons">
    <button className="oauth-btn google" onClick={() => onSelect('google')}>
      <GoogleIcon />
      Continuer avec Google
    </button>
    <button className="oauth-btn github" onClick={() => onSelect('github')}>
      <i className="fab fa-github"></i>
      Continuer avec GitHub
    </button>
    <button className="oauth-btn discord" onClick={() => onSelect('discord')}>
      <i className="fab fa-discord"></i>
      Continuer avec Discord
    </button>
  </div>
);

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const ConnexionPage: React.FC = () => {
  const router = useRouter();

  // ── Injection CSS ──────────────────────────────────────────────────────────
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.id = 'connexion-styles';
    styleTag.textContent = STYLES;
    document.head.appendChild(styleTag);
    return () => { document.getElementById('connexion-styles')?.remove(); };
  }, []);

  // ── État ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabName>('connexion');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>({ text: '', type: 'info', visible: false });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signupPrenom, setSignupPrenom] = useState('');
  const [signupNom, setSignupNom] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupEmailStatus, setSignupEmailStatus] = useState<'valid' | 'invalid' | ''>('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ level: null, text: '', show: false });

  const [resetEmail, setResetEmail] = useState('');
  const [tabIndicator, setTabIndicator] = useState({ width: 0, left: 0 });

  const tabsRef = useRef<HTMLDivElement>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);

  // ── Vérif connexion existante ──────────────────────────────────────────────
  useEffect(() => {
    const checkIfLoggedIn = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) router.push('/');
      } catch {}
    };
    checkIfLoggedIn();
  }, [router]);

  // ── Indicateur tab ─────────────────────────────────────────────────────────
  const updateTabIndicator = useCallback(() => {
    if (!tabsRef.current) return;
    const activeEl = tabsRef.current.querySelector<HTMLButtonElement>('.tab.active');
    if (activeEl) setTabIndicator({ width: activeEl.offsetWidth, left: activeEl.offsetLeft });
  }, []);

  useEffect(() => {
    updateTabIndicator();
    window.addEventListener('resize', updateTabIndicator);
    return () => window.removeEventListener('resize', updateTabIndicator);
  }, [activeTab, updateTabIndicator]);

  // ── Messages ───────────────────────────────────────────────────────────────
  const showMessage = useCallback((text: string, type: MessageType, duration = 5000) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    setMessage({ text, type, visible: true });
    if (duration > 0) messageTimerRef.current = setTimeout(() => setMessage((p) => ({ ...p, visible: false })), duration);
  }, []);

  const hideMessage = useCallback(() => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    setMessage((p) => ({ ...p, visible: false }));
  }, []);

  const messageIcons: Record<MessageType, string> = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle',
  };

  // ── Navigation tabs ────────────────────────────────────────────────────────
  const switchTab = useCallback((tab: TabName) => {
    setActiveTab(tab);
    hideMessage();
    if (formContainerRef.current) formContainerRef.current.scrollTop = 0;
  }, [hideMessage]);

  useEffect(() => {
    const tabs: TabName[] = ['connexion', 'inscription', 'reset'];
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveTab((current) => {
          const idx = tabs.indexOf(current);
          return tabs[e.key === 'ArrowLeft' ? (idx - 1 + tabs.length) % tabs.length : (idx + 1) % tabs.length];
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── OAuth ──────────────────────────────────────────────────────────────────
  const signInWithOAuth = useCallback(async (provider: 'google' | 'github' | 'discord') => {
    try {
      hideMessage();
      showMessage(`Connexion avec ${provider} en cours...`, 'info');
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          ...(provider === 'google' ? { queryParams: { access_type: 'offline', prompt: 'consent' } } : {}),
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      showMessage(`Erreur ${provider} : ${err instanceof Error ? err.message : 'Erreur inconnue'}`, 'error');
    }
  }, [hideMessage, showMessage]);

  // ── Connexion ──────────────────────────────────────────────────────────────
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    hideMessage();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) throw error;

      const { data: profile } = await supabase.from('users_profile').select('role').eq('user_id', data.user.id).single();
      if (!profile) throw new Error("Profil introuvable. Contactez l'administrateur.");

      showMessage('✨ Connexion réussie ! Redirection...', 'success');
      // ✅ router.push remplace window.location.href
      setTimeout(() => router.push('/'), 1500);
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      showMessage(msg.includes('Invalid login credentials') ? 'Email ou mot de passe incorrect.' : msg, 'error');
    }
  }, [loginEmail, loginPassword, hideMessage, showMessage, router]);

  // ── Inscription ────────────────────────────────────────────────────────────
  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) { showMessage("Veuillez accepter les conditions d'utilisation", 'error'); return; }
    hideMessage();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: { data: { full_name: `${signupPrenom} ${signupNom}`, first_name: signupPrenom, last_name: signupNom } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Erreur lors de la création du compte');

      await new Promise((r) => setTimeout(r, 1000));

      const { error: profileError } = await supabase.from('users_profile').insert({
        user_id: authData.user.id, prenom: signupPrenom, nom: signupNom, role: 'user',
      });
      if (profileError && (profileError as { code?: string }).code !== '23505') {
        throw new Error(`Erreur profil : ${profileError.message}`);
      }

      showMessage('🎉 Inscription réussie ! Un email de confirmation a été envoyé.', 'success');
      // ✅ router.push remplace window.location.href
      setTimeout(() => router.push('/'), 2500);
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      showMessage(msg.includes('already registered') ? 'Email déjà utilisé. Essayez de vous connecter.' : msg, 'error');
      if (msg.includes('profil')) { try { await supabase.auth.signOut(); } catch {} }
    }
  }, [signupEmail, signupPassword, signupPrenom, signupNom, termsAccepted, hideMessage, showMessage, router]);

  // ── Reset mot de passe ─────────────────────────────────────────────────────
  const handleReset = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    hideMessage();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        // ✅ /auth remplace auth.tsx
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      showMessage('📧 Email envoyé ! Vérifiez votre boîte (et les spams).', 'success');
      setLoading(false);
      setResetEmail('');
    } catch (err: unknown) {
      setLoading(false);
      showMessage(err instanceof Error ? err.message : 'Une erreur est survenue.', 'error');
    }
  }, [resetEmail, hideMessage, showMessage]);

  // ── Validation email / mot de passe ───────────────────────────────────────
  const handleSignupEmailChange = (value: string) => {
    setSignupEmail(value);
    if (!value) { setSignupEmailStatus(''); return; }
    setSignupEmailStatus(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'valid' : 'invalid');
  };

  const handlePasswordChange = (value: string) => {
    setSignupPassword(value);
    if (!value) { setPasswordStrength({ level: null, text: '', show: false }); return; }
    let s = 0;
    if (value.length >= 8) s++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) s++;
    if (/\d/.test(value)) s++;
    if (/[^a-zA-Z\d]/.test(value)) s++;
    if (s <= 1) setPasswordStrength({ level: 'weak',   text: '❌ Faible',  show: true });
    else if (s <= 3) setPasswordStrength({ level: 'medium', text: '⚠️ Moyen',  show: true });
    else setPasswordStrength({ level: 'strong', text: '✅ Fort',   show: true });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container">
      <div className="header">
        <div className="logo">
          <i className="fas fa-globe-americas"></i>
          <span>World Connect</span>
        </div>
        <div className="tagline">Le Monde connecté à l'internet</div>
      </div>

      <div className="tabs" ref={tabsRef}>
        <div className="tab-indicator" style={{ width: tabIndicator.width, left: tabIndicator.left }} />
        {(['connexion', 'inscription', 'reset'] as TabName[]).map((tab) => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => switchTab(tab)}>
            {tab === 'connexion' ? 'Connexion' : tab === 'inscription' ? 'Inscription' : 'Récupération'}
          </button>
        ))}
      </div>

      <div className="form-container" ref={formContainerRef}>
        {message.visible && (
          <div className={`message ${message.type} show`}>
            <i className={`fas ${messageIcons[message.type]}`}></i>
            {message.text}
          </div>
        )}

        {loading && (
          <div className="loader show">
            <div className="spinner"></div>
            <p className="loader-text">Chargement en cours...</p>
          </div>
        )}

        {/* ── CONNEXION ── */}
        <div className={`form-content ${activeTab === 'connexion' && !loading ? 'active' : ''}`}>
          <h2>👋 Bon retour !</h2>
          <p className="subtitle">Connectez-vous pour continuer votre aventure</p>
          <div className="user-guide">
            <h4><i className="fas fa-lightbulb"></i> Conseil rapide</h4>
            <p>Utilisez vos identifiants ou connectez-vous via un réseau social.</p>
          </div>
          <OAuthButtons onSelect={signInWithOAuth} />
          <div className="divider"><span>OU AVEC EMAIL</span></div>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="login-email"><i className="fas fa-envelope"></i> Adresse email</label>
              <div className="input-wrapper">
                <i className="fas fa-envelope input-icon"></i>
                <input type="email" id="login-email" required placeholder="exemple@email.com" autoComplete="email"
                  value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="login-password"><i className="fas fa-lock"></i> Mot de passe</label>
              <div className="input-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input type={showLoginPassword ? 'text' : 'password'} id="login-password" required
                  placeholder="••••••••" autoComplete="current-password"
                  value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                <i className={`fas ${showLoginPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                  onClick={() => setShowLoginPassword((p) => !p)} />
              </div>
            </div>
            <button type="submit" className="btn"><span>Se connecter</span></button>
          </form>
          <div className="action-links">
            <button className="action-link" onClick={() => switchTab('reset')}><i className="fas fa-key"></i> Mot de passe oublié ?</button>
            <button className="action-link" onClick={() => switchTab('inscription')}><i className="fas fa-user-plus"></i> Créer un compte</button>
          </div>
          <div className="switch-tab">
            <p>Nouveau sur World Connect ?</p>
            <button className="btn-secondary" onClick={() => switchTab('inscription')}><i className="fas fa-user-plus"></i> Inscrivez-vous ici</button>
          </div>
        </div>

        {/* ── INSCRIPTION ── */}
        <div className={`form-content ${activeTab === 'inscription' && !loading ? 'active' : ''}`}>
          <h2>🚀 Créer un compte</h2>
          <p className="subtitle">Rejoignez notre communauté en quelques secondes</p>
          <div className="user-guide">
            <h4><i className="fas fa-lightbulb"></i> Guide d'inscription</h4>
            <p>Remplissez les champs ou utilisez une connexion sociale.</p>
          </div>
          <OAuthButtons onSelect={signInWithOAuth} />
          <div className="divider"><span>OU AVEC EMAIL</span></div>
          <form onSubmit={handleSignup}>
            <div className="name-group">
              <div className="input-group">
                <label htmlFor="signup-prenom"><i className="fas fa-user"></i> Prénom</label>
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input type="text" id="signup-prenom" required placeholder="John" autoComplete="given-name"
                    value={signupPrenom} onChange={(e) => setSignupPrenom(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="signup-nom"><i className="fas fa-user-tag"></i> Nom</label>
                <div className="input-wrapper">
                  <i className="fas fa-user-tag input-icon"></i>
                  <input type="text" id="signup-nom" required placeholder="Doe" autoComplete="family-name"
                    value={signupNom} onChange={(e) => setSignupNom(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="signup-email"><i className="fas fa-envelope"></i> Email</label>
              <div className="input-wrapper">
                <i className="fas fa-envelope input-icon"></i>
                <input type="email" id="signup-email" required placeholder="exemple@email.com" autoComplete="email"
                  className={signupEmailStatus === 'valid' ? 'success' : signupEmailStatus === 'invalid' ? 'error' : ''}
                  value={signupEmail} onChange={(e) => handleSignupEmailChange(e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="signup-password"><i className="fas fa-lock"></i> Mot de passe</label>
              <div className="input-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input type={showSignupPassword ? 'text' : 'password'} id="signup-password" required
                  placeholder="••••••••" minLength={6} autoComplete="new-password"
                  value={signupPassword} onChange={(e) => handlePasswordChange(e.target.value)} />
                <i className={`fas ${showSignupPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                  onClick={() => setShowSignupPassword((p) => !p)} />
              </div>
              {passwordStrength.show && (
                <div className={`password-strength show strength-${passwordStrength.level}`}>
                  <div className="strength-bar"><div className="strength-fill"></div></div>
                  <div className="strength-text">{passwordStrength.text}</div>
                </div>
              )}
            </div>
            <div className="checkbox-group">
              <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
              <label htmlFor="terms">
                J'accepte les <a href="#" onClick={(e) => e.preventDefault()}>conditions d'utilisation</a> et la <a href="#" onClick={(e) => e.preventDefault()}>politique de confidentialité</a>
              </label>
            </div>
            <button type="submit" className="btn"><span>Créer mon compte</span></button>
          </form>
          <div className="features">
            <h3><i className="fas fa-star"></i> Pourquoi nous rejoindre ?</h3>
            <div className="feature-list">
              {['Compte 100% gratuit', 'Accès à toutes les fonctionnalités', 'Connexion sécurisée', 'Support 24/7'].map((f) => (
                <div key={f} className="feature-item"><i className="fas fa-check-circle"></i><span>{f}</span></div>
              ))}
            </div>
          </div>
          <div className="switch-tab">
            <p>Vous avez déjà un compte ?</p>
            <button className="btn-secondary" onClick={() => switchTab('connexion')}><i className="fas fa-sign-in-alt"></i> Connectez-vous ici</button>
          </div>
        </div>

        {/* ── RESET ── */}
        <div className={`form-content ${activeTab === 'reset' && !loading ? 'active' : ''}`}>
          <h2>🔐 Récupération</h2>
          <p className="subtitle">Nous allons vous aider à récupérer votre compte</p>
          <div className="user-guide">
            <h4><i className="fas fa-info-circle"></i> Comment ça marche</h4>
            <p>Entrez votre email, nous vous enverrons un lien sécurisé.</p>
          </div>
          <div className="info-text">
            <i className="fas fa-shield-alt"></i>
            <div><strong>Sécurité garantie :</strong> Le lien est valable 24h et ne peut être utilisé qu'une seule fois.</div>
          </div>
          <form onSubmit={handleReset}>
            <div className="input-group">
              <label htmlFor="reset-email"><i className="fas fa-envelope"></i> Email associé à votre compte</label>
              <div className="input-wrapper">
                <i className="fas fa-envelope input-icon"></i>
                <input type="email" id="reset-email" required placeholder="exemple@email.com" autoComplete="email"
                  value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn"><span>Envoyer le lien de réinitialisation</span></button>
          </form>
          <div className="action-links">
            <button className="action-link" onClick={() => switchTab('connexion')}><i className="fas fa-arrow-left"></i> Retour à la connexion</button>
            <button className="action-link" onClick={() => switchTab('inscription')}><i className="fas fa-user-plus"></i> Créer un nouveau compte</button>
          </div>
          <div className="features">
            <h3><i className="fas fa-lightbulb"></i> Conseils de sécurité</h3>
            <div className="feature-list">
              {[
                { icon: 'fa-lock',     text: 'Utilisez un mot de passe unique' },
                { icon: 'fa-sync-alt', text: 'Changez votre mot de passe régulièrement' },
                { icon: 'fa-envelope', text: 'Vérifiez votre boîte spam si vous ne recevez pas l\'email' },
              ].map(({ icon, text }) => (
                <div key={text} className="feature-item"><i className={`fas ${icon}`}></i><span>{text}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnexionPage;
