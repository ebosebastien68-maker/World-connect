// ============================================================================
// WORLD CONNECT - PARAMETRE.TSX
// Converti depuis parametre.html — Version 3.0
// Paramètres du compte : profil + suppression sécurisée
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

// ============================================================================
// CSS INLINE
// ============================================================================
const STYLES = `
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --primary:       #6b7c3f;
  --primary-light: #8a9b56;
  --primary-dark:  #556b2f;
  --bg-dark:       #0a0e27;
  --bg-card:       rgba(15,20,40,0.85);
  --text-primary:  #e0e0e0;
  --text-secondary:#a0aec0;
  --border-color:  rgba(107,124,63,0.3);
  --danger:        #ff4757;
  --danger-light:  #ff6b7a;
  --success:       #4ade80;
  --info:          #3b82f6;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: var(--bg-dark);
  color: var(--text-primary);
  padding-top: 70px;
  position: relative;
  min-height: 100vh;
}

#three-canvas {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* ── Navbar ──────────────────────────────────────────────── */
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 70px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
  border-bottom: 3px solid var(--primary-dark);
}

.navbar-left {
  color: #fff;
  font-size: 26px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  letter-spacing: 0.5px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.navbar-left i { color: #f0f0f0; font-size: 24px; }

.navbar-center { display: flex; align-items: center; }

.theme-toggle {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  width: 44px; height: 44px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s ease;
}
.theme-toggle:hover { background: rgba(255,255,255,0.25); transform: scale(1.05) rotate(15deg); }
.theme-toggle i { font-size: 20px; color: #fff; transition: transform 0.3s ease; }

.navbar-right { display: flex; gap: 20px; align-items: center; }

.nav-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  cursor: pointer; color: #fff;
  transition: all 0.3s ease;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 10px;
  min-width: 60px;
  background: none; border: none; font-family: inherit;
}
.nav-item:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px); }
.nav-item i { font-size: 20px; }
.nav-item span { font-size: 12px; font-weight: 500; }

/* ── Page title ──────────────────────────────────────────── */
.page-title {
  position: fixed;
  top: 70px; left: 50%;
  transform: translateX(-50%);
  background: var(--bg-card);
  backdrop-filter: blur(15px);
  padding: 12px 30px;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  z-index: 999;
  font-size: 18px; font-weight: bold;
  color: var(--text-primary);
  max-width: 90%; text-align: center;
  border: 1px solid var(--border-color);
}

/* ── Settings container ──────────────────────────────────── */
.settings-container {
  max-width: 700px;
  margin: 60px auto 40px;
  padding: 24px;
  position: relative;
  z-index: 2;
}

.settings-section {
  background: var(--bg-card);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}
.settings-section:hover { box-shadow: 0 12px 40px rgba(107,124,63,0.2); transform: translateY(-2px); }

.settings-section h2 {
  color: var(--text-primary);
  font-size: 20px;
  margin-bottom: 20px;
  display: flex; align-items: center; gap: 12px;
  padding-bottom: 15px;
  border-bottom: 2px solid var(--border-color);
}
.settings-section h2 i { color: var(--primary-light); font-size: 22px; }

/* ── Form ────────────────────────────────────────────────── */
.form-group { margin-bottom: 20px; }

.form-group label {
  display: block;
  color: var(--text-secondary);
  font-size: 14px; margin-bottom: 8px; font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background: rgba(30,40,60,0.6);
  color: var(--text-primary);
  font-size: 16px;
  transition: all 0.3s ease;
  font-family: inherit;
}
.form-group input:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(138,155,86,0.2);
  background: rgba(30,40,60,0.8);
}
.form-group input::placeholder { color: rgba(160,174,192,0.5); }

/* ── Buttons ─────────────────────────────────────────────── */
.submit-btn {
  width: 100%; padding: 16px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  border: none; border-radius: 12px;
  color: #fff; font-size: 16px; font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(107,124,63,0.4);
  display: flex; align-items: center; justify-content: center; gap: 10px;
  font-family: inherit;
}
.submit-btn:hover {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(107,124,63,0.6);
}
.submit-btn:active { transform: translateY(0); }
.submit-btn i { font-size: 18px; }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.delete-btn {
  background: linear-gradient(135deg, var(--danger) 0%, #e04250 100%) !important;
  box-shadow: 0 4px 15px rgba(255,71,87,0.4) !important;
}
.delete-btn:hover {
  background: linear-gradient(135deg, #e04250 0%, var(--danger) 100%) !important;
  box-shadow: 0 6px 20px rgba(255,71,87,0.6) !important;
}

.verify-btn {
  background: linear-gradient(135deg, var(--info) 0%, #2563eb 100%) !important;
  box-shadow: 0 4px 15px rgba(59,130,246,0.4) !important;
}
.verify-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, var(--info) 100%) !important;
  box-shadow: 0 6px 20px rgba(59,130,246,0.6) !important;
}

/* ── Delete section ──────────────────────────────────────── */
.delete-section {
  border: 2px solid var(--danger) !important;
  background: rgba(255,71,87,0.1) !important;
}
.delete-section h2 { color: var(--danger-light); border-bottom-color: rgba(255,71,87,0.3) !important; }
.delete-section h2 i { color: var(--danger) !important; }

.verification-string {
  background: rgba(30,40,60,0.8);
  padding: 16px;
  border-radius: 12px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: none;
  margin: 15px 0;
  color: var(--text-primary);
  border: 2px solid rgba(255,71,87,0.3);
  font-size: 14px;
  line-height: 1.6;
}

.no-copy-input { user-select: none; }

/* ── Messages ────────────────────────────────────────────── */
.error-message {
  color: var(--danger-light);
  font-size: 14px; margin-top: 10px;
  padding: 10px;
  background: rgba(255,71,87,0.1);
  border-radius: 8px;
  border-left: 3px solid var(--danger);
}

.success-message {
  color: var(--success);
  font-size: 14px; margin-top: 10px;
  padding: 10px;
  background: rgba(74,222,128,0.1);
  border-radius: 8px;
  border-left: 3px solid var(--success);
}

.info-text {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 15px;
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .settings-container { padding: 16px; margin: 50px auto 30px; }
  .settings-section { padding: 20px; }
  .submit-btn { padding: 14px; font-size: 15px; }
  .navbar-left { font-size: 20px; }
  .nav-item span { display: none; }
  .page-title { font-size: 16px; padding: 10px 20px; }
}
`;

// ============================================================================
// CONSTANTE — chaîne de vérification
// ============================================================================
const VERIFICATION_STRING =
  '₽ o hn ₹ ₿₱ ¶v; "(t" ><  æ₿β ϟϛχ ποιι θετψψ ηφσϟνχ ζδσξλππ φδρψη κξγφϛ βνμκ ϡλλπο γφζϛϛφθσ ∩∋∈→8≡⊷ εε∨ ⊥∡⌀∞∞ℝℕ∇ 23ϡ⊗⊙⊖⊕∀789↕↑↔∨∧⌈⌉∡⌀√';

// ============================================================================
// TYPES
// ============================================================================
interface SupabaseUser  { id: string; email: string; }
interface UserProfile   { user_id: string; prenom: string; nom: string; role: string; }

declare global {
  interface Window {
    supabaseClient: {
      supabase: any;
      getCurrentUser:  () => Promise<SupabaseUser | null>;
      getUserProfile:  (id: string) => Promise<UserProfile | null>;
    };
  }
}

// ============================================================================
// PARAMETRE PAGE COMPONENT
// ============================================================================
const ParametrePage: React.FC = () => {

  // ── CSS + title injection ─────────────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement('style');
    s.id = 'parametre-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
    document.title = 'World Connect - Paramètres';
    return () => { document.getElementById('parametre-styles')?.remove(); };
  }, []);

  // ── Three.js ──────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.position.z = 50;

    // Particles
    const pCount = 3000;
    const pPos   = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 150;
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.3, color: 0x4a90e2, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Lines
    const linesGroup = new THREE.Group();
    scene.add(linesGroup);
    for (let i = 0; i < 80; i++) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(6);
      for (let j = 0; j < 6; j++) pos[j] = (Math.random() - 0.5) * 100;
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      linesGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x3a7bc8, transparent: true, opacity: 0.2 })));
    }

    // Sphere
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(8, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x2e5c8a, wireframe: true, transparent: true, opacity: 0.3 })
    );
    scene.add(sphere);

    let t = 0, animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.001;
      particles.rotation.y = t * 0.3; particles.rotation.x = t * 0.2;
      sphere.rotation.y    = t * 0.5; sphere.rotation.x    = t * 0.3;
      linesGroup.rotation.y = t * 0.2; linesGroup.rotation.z = t * 0.1;
      pMat.opacity = 0.5 + Math.sin(t * 2) * 0.3;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); renderer.dispose(); };
  }, []);

  // ── State ─────────────────────────────────────────────────────────────────
  const [prenom,       setPrenom]       = useState('');
  const [nom,          setNom]          = useState('');
  const [curPassword,  setCurPassword]  = useState('');
  const [updateMsg,    setUpdateMsg]    = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [isUpdating,   setIsUpdating]   = useState(false);

  const [verifyInput,  setVerifyInput]  = useState('');
  const [showDelete,   setShowDelete]   = useState(false);
  const [deletePass,   setDeletePass]   = useState('');
  const [deleteMsg,    setDeleteMsg]    = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [isDeleting,   setIsDeleting]   = useState(false);

  const [darkTheme,    setDarkTheme]    = useState(() => localStorage.getItem('theme') === 'dark');

  const sbRef          = useRef<any>(null);
  const currentUserRef = useRef<SupabaseUser | null>(null);
  const profileSubRef  = useRef<any>(null);

  // ── Theme toggle ──────────────────────────────────────────────────────────
  const toggleTheme = () => {
    const next = !darkTheme;
    setDarkTheme(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // ── Supabase init ─────────────────────────────────────────────────────────
  useEffect(() => {
    const tryInit = () => {
      if (window.supabaseClient?.supabase) {
        sbRef.current = window.supabaseClient.supabase;
        initSettings();
      } else {
        setTimeout(tryInit, 100);
      }
    };
    tryInit();

    return () => {
      if (profileSubRef.current && sbRef.current) {
        sbRef.current.removeChannel(profileSubRef.current);
      }
    };
  }, []);

  // ── Get user helpers ──────────────────────────────────────────────────────
  const getCurrentUserSafe = async (): Promise<SupabaseUser | null> => {
    try {
      const u = await window.supabaseClient.getCurrentUser();
      return u;
    } catch {
      const { data, error } = await sbRef.current.auth.getUser();
      if (error) throw error;
      return data.user;
    }
  };

  const getUserProfileSafe = async (userId: string): Promise<UserProfile | null> => {
    try {
      const p = await window.supabaseClient.getUserProfile(userId);
      return p;
    } catch {
      const { data, error } = await sbRef.current
        .from('users_profile').select('user_id,prenom,nom,role').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data;
    }
  };

  const verifyPassword = async (email: string, password: string) => {
    const { data, error } = await sbRef.current.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // ── Realtime profile subscription ─────────────────────────────────────────
  const subscribeToProfile = (userId: string) => {
    if (profileSubRef.current) sbRef.current.removeChannel(profileSubRef.current);
    profileSubRef.current = sbRef.current
      .channel(`profile-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users_profile', filter: `user_id=eq.${userId}` },
        (payload: any) => {
          setPrenom(payload.new.prenom || '');
          setNom(payload.new.nom || '');
        }
      )
      .subscribe();
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  const initSettings = async () => {
    try {
      const user = await getCurrentUserSafe();
      if (!user) { window.location.href = 'connexion.tsx'; return; }
      currentUserRef.current = user;

      const profile = await getUserProfileSafe(user.id);
      if (profile) {
        setPrenom(profile.prenom || '');
        setNom(profile.nom || '');
        subscribeToProfile(user.id);
      }
    } catch (err) {
      console.error('initSettings:', err);
    }
  };

  // ── Update profile ────────────────────────────────────────────────────────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMsg(null);

    const user = currentUserRef.current;
    if (!user) { setUpdateMsg({ text: 'Utilisateur non connecté.', type: 'error' }); return; }
    if (!curPassword) { setUpdateMsg({ text: 'Le mot de passe actuel est obligatoire.', type: 'error' }); return; }

    setIsUpdating(true);
    try {
      await verifyPassword(user.email, curPassword);

      const { error } = await sbRef.current
        .from('users_profile')
        .update({ prenom: prenom.trim(), nom: nom.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      setUpdateMsg({ text: 'Profil mis à jour avec succès.', type: 'success' });
      setCurPassword('');
    } catch (err: any) {
      setUpdateMsg({ text: err.message || 'Une erreur est survenue lors de la mise à jour.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Verify string ─────────────────────────────────────────────────────────
  const handleVerify = () => {
    setDeleteMsg(null);
    if (verifyInput.trim() === VERIFICATION_STRING.trim()) {
      setShowDelete(true);
    } else {
      setDeleteMsg({ text: 'La chaîne ne correspond pas. Veuillez réessayer.', type: 'error' });
    }
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setDeleteMsg(null);
    const user = currentUserRef.current;
    if (!user) { setDeleteMsg({ text: 'Utilisateur non connecté.', type: 'error' }); return; }
    if (!deletePass) { setDeleteMsg({ text: 'Le mot de passe est obligatoire.', type: 'error' }); return; }

    setIsDeleting(true);
    try {
      await verifyPassword(user.email, deletePass);

      const { error: delErr } = await sbRef.current
        .from('users_profile').delete().eq('user_id', user.id);
      if (delErr) throw delErr;

      await sbRef.current.auth.signOut();

      setDeleteMsg({ text: 'Compte supprimé avec succès. Redirection…', type: 'success' });
      setTimeout(() => { window.location.href = 'connexion.tsx'; }, 1500);
    } catch (err: any) {
      setDeleteMsg({ text: err.message || 'Une erreur est survenue lors de la suppression.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <>
      <canvas ref={canvasRef} id="three-canvas" />

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <i className="fas fa-globe" />
          World Connect
        </div>

        <div className="navbar-center">
          <button className="theme-toggle" onClick={toggleTheme} title="Changer le thème">
            <i className={`fas ${darkTheme ? 'fa-sun' : 'fa-moon'}`} />
          </button>
        </div>

        <div className="navbar-right">
          <button className="nav-item" onClick={() => { window.location.href = 'home.tsx'; }}>
            <i className="fas fa-home" />
            <span>Retour</span>
          </button>
        </div>
      </nav>

      {/* Page title */}
      <div className="page-title">Paramètres du compte</div>

      {/* Settings container */}
      <div className="settings-container">

        {/* ── Modifier le profil ── */}
        <div className="settings-section">
          <h2><i className="fas fa-user-edit" /> Modifier le profil</h2>

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label htmlFor="prenom">Prénom</label>
              <input
                type="text" id="prenom"
                placeholder="Votre prénom"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="nom">Nom</label>
              <input
                type="text" id="nom"
                placeholder="Votre nom"
                value={nom}
                onChange={e => setNom(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="current-password">Mot de passe actuel (obligatoire)</label>
              <input
                type="password" id="current-password"
                placeholder="••••••••"
                value={curPassword}
                onChange={e => setCurPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={isUpdating}>
              {isUpdating
                ? <><i className="fas fa-spinner fa-spin" /> Enregistrement…</>
                : <><i className="fas fa-save" /> Enregistrer les modifications</>
              }
            </button>

            {updateMsg && (
              <p className={updateMsg.type === 'error' ? 'error-message' : 'success-message'}>
                {updateMsg.text}
              </p>
            )}
          </form>
        </div>

        {/* ── Zone dangereuse ── */}
        <div className="settings-section delete-section">
          <h2><i className="fas fa-exclamation-triangle" /> Zone dangereuse</h2>

          <p className="info-text">
            La suppression de votre compte est irréversible. Toutes vos données seront définitivement perdues.
          </p>
          <p className="info-text">
            Pour supprimer votre compte, veuillez taper exactement la chaîne suivante (sans copier-coller) :
          </p>

          {/* Chaîne de vérification — non sélectionnable */}
          <div className="verification-string" onCopy={e => e.preventDefault()}>
            {VERIFICATION_STRING}
          </div>

          <div className="form-group">
            <label htmlFor="verification-input">Taper la chaîne de vérification :</label>
            <input
              type="text" id="verification-input"
              className="no-copy-input"
              placeholder="Tapez la chaîne ici…"
              value={verifyInput}
              onChange={e => setVerifyInput(e.target.value)}
              onPaste={e => e.preventDefault()}
              onCopy={e => e.preventDefault()}
              required
            />
          </div>

          <button className="submit-btn verify-btn" onClick={handleVerify} type="button">
            <i className="fas fa-check" /> Vérifier la chaîne
          </button>

          {/* Confirmation suppression — visible après vérification */}
          {showDelete && (
            <div style={{ marginTop: 20 }}>
              <div className="form-group">
                <label htmlFor="delete-password">Confirmez avec votre mot de passe :</label>
                <input
                  type="password" id="delete-password"
                  placeholder="••••••••"
                  value={deletePass}
                  onChange={e => setDeletePass(e.target.value)}
                  required
                />
              </div>
              <button
                className="submit-btn delete-btn"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                type="button"
              >
                {isDeleting
                  ? <><i className="fas fa-spinner fa-spin" /> Suppression…</>
                  : <><i className="fas fa-trash" /> Supprimer définitivement mon compte</>
                }
              </button>
            </div>
          )}

          {deleteMsg && (
            <p className={deleteMsg.type === 'error' ? 'error-message' : 'success-message'}>
              {deleteMsg.text}
            </p>
          )}
        </div>

      </div>
    </>
  );
};

export default ParametrePage;
