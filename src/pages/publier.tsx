// pages/publier.tsx
// ✅ Pages Router — pas de 'use client'
// ✅ useRouter de 'next/router'
// ✅ supabase importé depuis @/lib/supabaseClient
// ✅ window.location.href → router.push()
// ✅ window.supabaseClient supprimé

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/lib/supabaseClient';

// ============================================================================
// CSS INLINE
// ============================================================================
const STYLES = `
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --primary:      #667eea;
  --primary-dark: #5568d3;
  --secondary:    #764ba2;
  --success:      #06d6a0;
  --danger:       #ef476f;
  --warning:      #ffd166;
  --info:         #2563eb;
  --dark:         #1a1a2e;
  --light:        #f5f7fa;
  --white:        #ffffff;
  --shadow:    0 4px 20px rgba(0,0,0,0.08);
  --shadow-lg: 0 10px 40px rgba(0,0,0,0.12);
  --radius:    16px;
  --radius-sm: 12px;
  --transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  min-height: 100vh;
  color: var(--dark);
  line-height: 1.6;
}

.navbar {
  position: fixed; top: 0; left: 0; right: 0;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 2px 20px rgba(0,0,0,0.08);
  padding: 16px 40px;
  display: flex; justify-content: space-between; align-items: center;
  z-index: 1000;
  border-bottom: 1px solid rgba(102,126,234,0.1);
}

.navbar-brand {
  display: flex; align-items: center; gap: 12px;
  font-size: 24px; font-weight: 700;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.navbar-brand i {
  font-size: 28px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}

.navbar-right { display: flex; gap: 12px; align-items: center; }

.icon-btn {
  position: relative; background: var(--light); border: none;
  width: 44px; height: 44px; border-radius: 12px; font-size: 18px;
  color: var(--dark); cursor: pointer; transition: var(--transition);
  display: flex; align-items: center; justify-content: center;
}
.icon-btn:hover { background: var(--primary); color: var(--white); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102,126,234,0.3); }

.admin-btn {
  background: linear-gradient(135deg, var(--info) 0%, #1e40af 100%);
  color: white; border: none; padding: 12px 24px; border-radius: var(--radius-sm);
  cursor: pointer; font-weight: 600; font-size: 14px;
  display: flex; align-items: center; gap: 8px; transition: var(--transition);
  box-shadow: 0 4px 15px rgba(37,99,235,0.3); font-family: inherit;
}
.admin-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.4); background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%); }

.logout-btn {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white; border: none; padding: 12px 24px; border-radius: var(--radius-sm);
  cursor: pointer; font-weight: 600; font-size: 14px;
  display: flex; align-items: center; gap: 8px; transition: var(--transition);
  box-shadow: 0 4px 15px rgba(102,126,234,0.3); font-family: inherit;
}
.logout-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102,126,234,0.4); }

.container { max-width: 1200px; margin: 100px auto 40px; padding: 0 20px; }

.page-header { text-align: center; margin-bottom: 40px; animation: fadeInDown 0.6s ease; }
.page-header h1 {
  font-size: 42px; font-weight: 800;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 12px;
}
.page-header p { font-size: 18px; color: #666; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap: 20px; margin-bottom: 30px; }

.stat-card {
  background: white; padding: 24px; border-radius: var(--radius-sm); box-shadow: var(--shadow);
  display: flex; align-items: center; gap: 20px; transition: var(--transition);
}
.stat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }

.stat-icon {
  width: 60px; height: 60px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 28px; color: white;
}
.stat-icon.warning { background: linear-gradient(135deg, var(--warning) 0%, #f77f00 100%); }

.stat-content h3 { font-size: 32px; font-weight: 800; color: var(--dark); margin-bottom: 4px; }
.stat-content p { font-size: 14px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

.tabs-container {
  display: flex; gap: 12px; margin-bottom: 30px;
  background: white; padding: 8px; border-radius: var(--radius); box-shadow: var(--shadow);
  animation: fadeInUp 0.6s ease;
}

.tab-btn {
  flex: 1; padding: 16px 24px; background: transparent; border: none;
  border-radius: var(--radius-sm); cursor: pointer; font-weight: 600; color: #666;
  transition: var(--transition); display: flex; align-items: center; justify-content: center;
  gap: 10px; font-size: 15px; position: relative; overflow: hidden; font-family: inherit;
}
.tab-btn::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  opacity: 0; transition: var(--transition); z-index: -1;
}
.tab-btn:hover { color: var(--primary); transform: translateY(-2px); }
.tab-btn.active { color: white; }
.tab-btn.active::before { opacity: 1; }
.tab-btn i { font-size: 18px; }

.tab-content { display: none; animation: fadeIn 0.4s ease; }
.tab-content.active { display: block; }

.card {
  background: white; border-radius: var(--radius); padding: 40px;
  box-shadow: var(--shadow); margin-bottom: 20px; transition: var(--transition);
}
.card:hover { box-shadow: var(--shadow-lg); }

.card-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 30px;
  padding-bottom: 20px; border-bottom: 2px solid var(--light);
}
.card-header i {
  font-size: 28px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.card-header h2 { font-size: 24px; font-weight: 700; color: var(--dark); }

.form-group { margin-bottom: 28px; }

label {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px; color: var(--dark); font-weight: 600;
  font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;
}
label i { color: var(--primary); }
.required { color: var(--danger); margin-left: 4px; }

textarea, input[type="text"], input[type="url"], select {
  width: 100%; padding: 14px 18px;
  border: 2px solid #e8e8e8; border-radius: var(--radius-sm);
  font-size: 15px; font-family: inherit; transition: var(--transition);
  background: var(--light);
}
textarea { min-height: 180px; resize: vertical; line-height: 1.6; }
textarea:focus, input:focus, select:focus {
  outline: none; border-color: var(--primary); background: white;
  box-shadow: 0 0 0 4px rgba(102,126,234,0.1);
}

.upload-section { margin-bottom: 28px; }
.upload-tabs { display: flex; gap: 12px; margin-bottom: 20px; }

.upload-tab {
  flex: 1; padding: 12px; background: var(--light);
  border: 2px solid transparent; border-radius: var(--radius-sm);
  cursor: pointer; text-align: center; transition: var(--transition);
  font-weight: 600; color: #666; font-family: inherit;
}
.upload-tab:hover { border-color: var(--primary); background: white; }
.upload-tab.active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white; border-color: var(--primary);
}
.upload-tab i { display: block; font-size: 24px; margin-bottom: 8px; }

.upload-content { display: none; }
.upload-content.active { display: block; }

.file-upload {
  border: 3px dashed #d0d0d0; border-radius: var(--radius); padding: 50px 30px;
  text-align: center; cursor: pointer; transition: var(--transition);
  background: var(--light); position: relative; overflow: hidden;
}
.file-upload::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%);
  opacity: 0; transition: var(--transition);
}
.file-upload:hover { border-color: var(--primary); transform: translateY(-4px); box-shadow: var(--shadow); }
.file-upload:hover::before { opacity: 1; }
.file-upload.drag-over { border-color: var(--primary); background: rgba(102,126,234,0.05); }

.upload-icon {
  font-size: 64px; display: block; margin-bottom: 16px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.upload-text h3 { font-size: 20px; font-weight: 700; color: var(--dark); margin-bottom: 8px; }
.upload-text p { color: #666; font-size: 14px; }
.upload-limit { margin-top: 12px; font-size: 12px; color: #999; font-weight: 500; }

.preview-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 16px; margin-top: 20px; }

.preview-item {
  position: relative; border-radius: var(--radius-sm); overflow: hidden;
  aspect-ratio: 1; background: var(--light); box-shadow: var(--shadow); transition: var(--transition);
}
.preview-item:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
.preview-item img, .preview-item video { width: 100%; height: 100%; object-fit: cover; }

.preview-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 50%, rgba(0,0,0,0.7) 100%);
  opacity: 0; transition: var(--transition);
  display: flex; align-items: center; justify-content: center;
}
.preview-item:hover .preview-overlay { opacity: 1; }

.remove-btn {
  position: absolute; top: 8px; right: 8px;
  background: var(--danger); color: white; border: none;
  border-radius: 50%; width: 32px; height: 32px;
  cursor: pointer; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  z-index: 10; transition: var(--transition); box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}
.remove-btn:hover { background: #d63447; transform: rotate(90deg) scale(1.1); }

.preview-info {
  position: absolute; bottom: 8px; left: 8px; right: 8px;
  background: rgba(0,0,0,0.8); color: white; padding: 8px;
  border-radius: 8px; font-size: 11px; display: flex; align-items: center; gap: 8px;
}
.preview-info i { color: var(--primary); }

.video-play-icon {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 60px; height: 60px; background: rgba(255,255,255,0.9); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; color: var(--primary); box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.url-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px,1fr)); gap: 20px; margin-bottom: 28px; }

.url-card {
  background: var(--light); padding: 20px; border-radius: var(--radius-sm);
  border: 2px solid transparent; transition: var(--transition);
}
.url-card:hover { border-color: var(--primary); background: white; box-shadow: var(--shadow); }
.url-card label { margin-bottom: 12px; }
.url-card input { background: white; }

.btn-group { display: flex; gap: 12px; margin-top: 30px; }

.submit-btn {
  flex: 1; padding: 18px 32px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white; border: none; border-radius: var(--radius-sm);
  font-size: 16px; font-weight: 700; cursor: pointer; transition: var(--transition);
  display: flex; align-items: center; justify-content: center; gap: 12px;
  box-shadow: 0 6px 20px rgba(102,126,234,0.3); text-transform: uppercase; letter-spacing: 0.5px;
  font-family: inherit;
}
.submit-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(102,126,234,0.4); }
.submit-btn:active:not(:disabled) { transform: translateY(-1px); }
.submit-btn:disabled { background: linear-gradient(135deg,#ccc 0%,#999 100%); cursor: not-allowed; transform: none; box-shadow: none; }
.submit-btn i { font-size: 18px; }

.btn-secondary {
  padding: 18px 32px; background: white; color: var(--dark);
  border: 2px solid var(--primary); border-radius: var(--radius-sm);
  font-size: 16px; font-weight: 700; cursor: pointer; transition: var(--transition);
  display: flex; align-items: center; justify-content: center; gap: 12px; font-family: inherit;
}
.btn-secondary:hover { background: var(--primary); color: white; transform: translateY(-3px); box-shadow: 0 10px 30px rgba(102,126,234,0.3); }

.message {
  padding: 20px 24px; border-radius: var(--radius-sm); margin-bottom: 24px;
  display: none; align-items: center; gap: 12px; font-weight: 600;
  animation: slideInDown 0.4s ease;
}
.message.show { display: flex; }
.message i { font-size: 24px; }
.message.success { background: linear-gradient(135deg,rgba(6,214,160,0.1),rgba(6,214,160,0.05)); color: #059669; border-left: 4px solid var(--success); }
.message.error   { background: linear-gradient(135deg,rgba(239,71,111,0.1),rgba(239,71,111,0.05)); color: #dc2626; border-left: 4px solid var(--danger); }
.message.info    { background: linear-gradient(135deg,rgba(102,126,234,0.1),rgba(102,126,234,0.05)); color: var(--primary); border-left: 4px solid var(--primary); }

.loader {
  display: none; position: fixed; inset: 0;
  background: rgba(255,255,255,0.95); backdrop-filter: blur(10px);
  z-index: 9999; align-items: center; justify-content: center; flex-direction: column;
}
.loader.show { display: flex; }

.spinner-container { position: relative; width: 80px; height: 80px; }
.spinner {
  position: absolute; width: 100%; height: 100%;
  border: 4px solid rgba(102,126,234,0.1); border-top: 4px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.68,-0.55,0.265,1.55) infinite;
}
.spinner:nth-child(2) { border-top-color: var(--secondary); animation-delay: -0.3s; }
@keyframes spin { to { transform: rotate(360deg); } }

.loader-text { margin-top: 24px; font-size: 18px; font-weight: 600; color: var(--dark); }

@keyframes fadeIn       { from { opacity: 0; }                                 to { opacity: 1; } }
@keyframes fadeInUp     { from { opacity: 0; transform: translateY(30px); }   to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInDown   { from { opacity: 0; transform: translateY(-30px); }  to { opacity: 1; transform: translateY(0); } }
@keyframes slideInDown  { from { opacity: 0; transform: translateY(-20px); }  to { opacity: 1; transform: translateY(0); } }

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: var(--light); }
::-webkit-scrollbar-thumb { background: linear-gradient(135deg,var(--primary) 0%,var(--secondary) 100%); border-radius: 10px; }

@media (max-width: 768px) {
  .navbar { padding: 12px 20px; }
  .navbar-brand { font-size: 20px; }
  .navbar-right { gap: 8px; }
  .logout-btn span, .admin-btn span { display: none; }
  .container { margin-top: 80px; padding: 0 16px; }
  .page-header h1 { font-size: 32px; }
  .card { padding: 24px; }
  .tabs-container { flex-direction: column; }
  .tab-btn { padding: 14px; }
  .url-grid { grid-template-columns: 1fr; }
  .btn-group { flex-direction: column; }
  .preview-container { grid-template-columns: repeat(auto-fill, minmax(120px,1fr)); }
}
`;

// ============================================================================
// TYPES
// ============================================================================
interface SupabaseUser { id: string; email: string; }
interface UserOption   { user_id: string; prenom: string; nom: string; }

type TabType    = 'article' | 'notification';
type UploadTab  = 'images' | 'video';
type MsgType    = 'success' | 'error' | 'info';

interface PreviewItem { file: File; dataUrl: string; }
interface Banner      { text: string; type: MsgType; }

// ============================================================================
// HELPER
// ============================================================================
function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
const PublierPage: React.FC = () => {
  const router = useRouter();

  // ── CSS ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement('style');
    s.id = 'publier-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
    document.title = 'Publier - Administration';
    return () => { document.getElementById('publier-styles')?.remove(); };
  }, []);

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab,   setActiveTab]   = useState<TabType>('article');
  const [uploadTab,   setUploadTab]   = useState<UploadTab>('images');
  const [dragOver,    setDragOver]    = useState(false);
  const [texte,       setTexte]       = useState('');
  const [texteUrl,    setTexteUrl]    = useState('');
  const [venteUrl,    setVenteUrl]    = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [selImages,   setSelImages]   = useState<PreviewItem[]>([]);
  const [selVideo,    setSelVideo]    = useState<PreviewItem | null>(null);
  const [notifUser,   setNotifUser]   = useState('all');
  const [notifTexte,  setNotifTexte]  = useState('');
  const [users,       setUsers]       = useState<UserOption[]>([]);
  const [banner,      setBanner]      = useState<Banner | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [statNotifs,  setStatNotifs]  = useState(0);
  const [refreshAnim, setRefreshAnim] = useState(false);

  const currentUserRef  = useRef<SupabaseUser | null>(null);
  const autoSaveRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Banner ────────────────────────────────────────────────────────────────
  const showBanner = useCallback((text: string, type: MsgType) => {
    setBanner({ text, type });
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => setBanner(null), 5000);
  }, []);

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('users_profile').select('user_id,prenom,nom').order('prenom');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) { console.error('loadUsers:', err); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const { count } = await supabase.from('notifications').select('notification_id', { count: 'exact', head: true });
      setStatNotifs(count || 0);
    } catch (err) { console.error('loadStats:', err); }
  }, []);

  const refreshStats = async () => {
    setRefreshAnim(true);
    await loadStats();
    setTimeout(() => setRefreshAnim(false), 1000);
  };

  const restoreDraft = () => {
    const raw = localStorage.getItem('article_draft');
    if (!raw) return;
    try {
      const { texte: saved, timestamp } = JSON.parse(raw);
      const hoursDiff = (Date.now() - new Date(timestamp).getTime()) / 3_600_000;
      if (hoursDiff < 24 && confirm('Un brouillon a été trouvé. Voulez-vous le restaurer ?')) {
        setTexte(saved);
        showBanner('Brouillon restauré avec succès', 'info');
      }
    } catch { /* ignore */ }
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const initApp = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        // ✅ router.push remplace window.location.href
        if (!user) { router.push('/connexion'); return; }

        const { data: profile } = await supabase.from('users_profile').select('role').eq('user_id', user.id).single();
        if (!profile || (profile as { role: string }).role !== 'admin') {
          showBanner('Accès refusé. Réservé aux administrateurs.', 'error');
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        currentUserRef.current = { id: user.id, email: user.email || '' };
        await Promise.all([loadUsers(), loadStats()]);
        restoreDraft();
      } catch (err) {
        console.error('initApp:', err);
        router.push('/connexion');
      }
    };
    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Ctrl+S shortcut ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (texte) {
          localStorage.setItem('article_draft', JSON.stringify({ texte, timestamp: new Date().toISOString() }));
          showBanner('Brouillon sauvegardé', 'info');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [texte, showBanner]);

  // ── Auto-save ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!texte) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      localStorage.setItem('article_draft', JSON.stringify({ texte, timestamp: new Date().toISOString() }));
    }, 2000);
  }, [texte]);

  // ── Images ────────────────────────────────────────────────────────────────
  const processImageFiles = (files: File[]) => {
    if (selImages.length + files.length > 5) { showBanner('Maximum 5 images autorisées', 'error'); return; }
    const valid: File[] = [];
    for (const f of files) {
      if (!f.type.startsWith('image/')) { showBanner(`${f.name} n'est pas une image valide`, 'error'); continue; }
      if (f.size > 5 * 1024 * 1024)    { showBanner(`${f.name} dépasse 5MB`, 'error'); continue; }
      valid.push(f);
    }
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setSelImages(prev => [...prev, { file: f, dataUrl: e.target!.result as string }]);
      reader.readAsDataURL(f);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    processImageFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  };

  const handleVideoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('video/'))  { showBanner('Le fichier doit être une vidéo', 'error'); return; }
    if (f.size > 50 * 1024 * 1024)    { showBanner('La vidéo ne doit pas dépasser 50MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => setSelVideo({ file: f, dataUrl: ev.target!.result as string });
    reader.readAsDataURL(f);
  };

  // ── Article submit ────────────────────────────────────────────────────────
  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = currentUserRef.current;
    if (!user) return;
    setLoading(true);
    try {
      const { data: article, error: artErr } = await supabase
        .from('articles')
        .insert({ user_id: user.id, texte: texte.trim(), texte_url: texteUrl.trim() || null, vente_url: venteUrl.trim() || null, whatsapp_url: whatsappUrl.trim() || null })
        .select().single();
      if (artErr) throw artErr;

      // Upload images
      for (const img of selImages) {
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2,9)}_${img.file.name}`;
        const { error: upErr } = await supabase.storage.from('articles-images').upload(fileName, img.file, { cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('articles-images').getPublicUrl(fileName);
        await supabase.from('article_images').insert({ article_id: (article as { article_id: string }).article_id, image_url: publicUrl });
      }

      // Upload video
      if (selVideo) {
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2,9)}_${selVideo.file.name}`;
        const { error: upErr } = await supabase.storage.from('videos').upload(fileName, selVideo.file, { cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName);
        await supabase.from('article_videos').insert({ article_id: (article as { article_id: string }).article_id, video_url: publicUrl });
      }

      showBanner('🎉 Article publié avec succès !', 'success');
      resetArticleForm();
      localStorage.removeItem('article_draft');
      await loadStats();
      // ✅ router.push remplace window.location.href
      setTimeout(() => router.push('/'), 2000);
    } catch (err: unknown) {
      console.error('handleArticleSubmit:', err);
      showBanner('❌ Erreur : ' + (err instanceof Error ? err.message : ''), 'error');
    } finally { setLoading(false); }
  };

  // ── Notification submit ───────────────────────────────────────────────────
  const handleNotifSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const texteNotif = notifTexte.trim();
      if (notifUser === 'all') {
        const { data: allUsers, error: usrErr } = await supabase.from('users_profile').select('user_id');
        if (usrErr) throw usrErr;
        const { error: nErr } = await supabase.from('notifications').insert(
          (allUsers || []).map((u: { user_id: string }) => ({ user_id: u.user_id, texte: texteNotif }))
        );
        if (nErr) throw nErr;
        showBanner(`🔔 Notification envoyée à ${allUsers?.length || 0} utilisateur(s) !`, 'success');
      } else {
        const { error: nErr } = await supabase.from('notifications').insert({ user_id: notifUser, texte: texteNotif });
        if (nErr) throw nErr;
        showBanner('🔔 Notification envoyée avec succès !', 'success');
      }
      setNotifTexte(''); setNotifUser('all');
      await loadStats();
    } catch (err: unknown) {
      showBanner("❌ Erreur : " + (err instanceof Error ? err.message : ''), 'error');
    } finally { setLoading(false); }
  };

  const resetArticleForm = () => {
    setTexte(''); setTexteUrl(''); setVenteUrl(''); setWhatsappUrl('');
    setSelImages([]); setSelVideo(null);
  };

  const handleLogout = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) return;
    try {
      await supabase.auth.signOut();
      // ✅ router.push remplace window.location.href
      router.push('/connexion');
    } catch { showBanner('Erreur lors de la déconnexion', 'error'); }
  };

  const bannerIcon = banner?.type === 'success' ? 'fas fa-check-circle'
                   : banner?.type === 'error'   ? 'fas fa-exclamation-circle'
                   : 'fas fa-info-circle';

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
      <div className={`loader${loading ? ' show' : ''}`}>
        <div className="spinner-container">
          <div className="spinner" /><div className="spinner" />
        </div>
        <p className="loader-text">Traitement en cours…</p>
      </div>

      <nav className="navbar">
        <div className="navbar-brand">
          <i className="fas fa-crown" /><span>Administration</span>
        </div>
        <div className="navbar-right">
          {/* ✅ router.push remplace window.location.href */}
          <button className="icon-btn" title="Accueil"    onClick={() => router.push('/')}><i className="fas fa-home" /></button>
          <button className="icon-btn" title="Messages"   onClick={() => router.push('/messages')}><i className="fas fa-envelope" /></button>
          <button className="icon-btn" title="Actualiser"
            style={refreshAnim ? { animation: 'spin 1s linear' } : {}}
            onClick={refreshStats}>
            <i className="fas fa-sync-alt" />
          </button>
          <button className="admin-btn" onClick={() => router.push('/usereact')}>
            <i className="fas fa-cog" /><span>Admin</span>
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" /><span>Déconnexion</span>
          </button>
        </div>
      </nav>

      <div className="container">
        <div className="page-header">
          <h1>✨ Panneau d'Administration</h1>
          <p>Gérez vos publications et notifications en toute simplicité</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon warning"><i className="fas fa-bell" /></div>
            <div className="stat-content">
              <h3>{statNotifs}</h3>
              <p>Notifications envoyées</p>
            </div>
          </div>
        </div>

        {banner && (
          <div className={`message ${banner.type} show`}>
            <i className={bannerIcon} /><span>{banner.text}</span>
          </div>
        )}

        <div className="tabs-container">
          {(['article', 'notification'] as TabType[]).map(t => (
            <button key={t} className={`tab-btn${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
              <i className={t === 'article' ? 'fas fa-newspaper' : 'fas fa-bell'} />
              <span>{t === 'article' ? 'Publier un article' : 'Envoyer une notification'}</span>
            </button>
          ))}
        </div>

        {/* ── Article tab ── */}
        <div className={`tab-content${activeTab === 'article' ? ' active' : ''}`}>
          <div className="card">
            <div className="card-header">
              <i className="fas fa-pen-fancy" /><h2>Créer un nouvel article</h2>
            </div>
            <form onSubmit={handleArticleSubmit}>
              <div className="form-group">
                <label><i className="fas fa-align-left" /> Contenu <span className="required">*</span></label>
                <textarea value={texte} onChange={e => setTexte(e.target.value)}
                  placeholder="Rédigez votre article ici... ✨" required />
              </div>

              <div className="upload-section">
                <label><i className="fas fa-photo-video" /> Médias</label>
                <div className="upload-tabs">
                  {(['images', 'video'] as UploadTab[]).map(t => (
                    <button key={t} type="button"
                      className={`upload-tab${uploadTab === t ? ' active' : ''}`}
                      onClick={() => setUploadTab(t)}>
                      <i className={t === 'images' ? 'fas fa-images' : 'fas fa-video'} />
                      <span>{t === 'images' ? 'Images' : 'Vidéo'}</span>
                      <small>{t === 'images' ? '(Max 5)' : '(Max 1)'}</small>
                    </button>
                  ))}
                </div>

                <div className={`upload-content${uploadTab === 'images' ? ' active' : ''}`}>
                  <div className={`file-upload${dragOver ? ' drag-over' : ''}`}
                    onClick={() => document.getElementById('images-input')?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}>
                    <i className="fas fa-cloud-upload-alt upload-icon" />
                    <div className="upload-text">
                      <h3>Glissez vos images ici</h3>
                      <p>ou cliquez pour parcourir</p>
                      <div className="upload-limit"><i className="fas fa-info-circle" /> JPG, PNG, GIF • Max 5MB</div>
                    </div>
                    <input id="images-input" type="file" accept="image/*" multiple style={{ display: 'none' }}
                      onChange={e => processImageFiles(Array.from(e.target.files || []))} />
                  </div>
                  {selImages.length > 0 && (
                    <div className="preview-container">
                      {selImages.map((item, i) => (
                        <div key={i} className="preview-item">
                          <img src={item.dataUrl} alt={`preview-${i}`} />
                          <div className="preview-overlay" />
                          <button type="button" className="remove-btn" onClick={() => setSelImages(p => p.filter((_,j) => j !== i))}>
                            <i className="fas fa-trash-alt" />
                          </button>
                          <div className="preview-info"><i className="fas fa-image" /><span>{formatFileSize(item.file.size)}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`upload-content${uploadTab === 'video' ? ' active' : ''}`}>
                  <div className="file-upload" onClick={() => document.getElementById('video-input')?.click()}>
                    <i className="fas fa-film upload-icon" />
                    <div className="upload-text">
                      <h3>Ajoutez votre vidéo</h3>
                      <p>ou cliquez pour sélectionner</p>
                      <div className="upload-limit"><i className="fas fa-info-circle" /> MP4, MOV, AVI • Max 50MB</div>
                    </div>
                    <input id="video-input" type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoInput} />
                  </div>
                  {selVideo && (
                    <div className="preview-container">
                      <div className="preview-item">
                        <video src={selVideo.dataUrl} />
                        <div className="video-play-icon"><i className="fas fa-play" /></div>
                        <div className="preview-overlay" />
                        <button type="button" className="remove-btn" onClick={() => setSelVideo(null)}>
                          <i className="fas fa-trash-alt" />
                        </button>
                        <div className="preview-info"><i className="fas fa-video" /><span>{formatFileSize(selVideo.file.size)}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label><i className="fas fa-link" /> Liens supplémentaires</label>
                <div className="url-grid">
                  <div className="url-card">
                    <label htmlFor="texte_url"><i className="fas fa-external-link-alt" /> Lien externe</label>
                    <input type="url" id="texte_url" placeholder="https://exemple.com" value={texteUrl} onChange={e => setTexteUrl(e.target.value)} />
                  </div>
                  <div className="url-card">
                    <label htmlFor="vente_url"><i className="fas fa-shopping-cart" /> Lien de vente</label>
                    <input type="url" id="vente_url" placeholder="https://boutique.com" value={venteUrl} onChange={e => setVenteUrl(e.target.value)} />
                  </div>
                  <div className="url-card">
                    <label htmlFor="whatsapp_url"><i className="fab fa-whatsapp" /> Lien WhatsApp</label>
                    <input type="url" id="whatsapp_url" placeholder="https://wa.me/..." value={whatsappUrl} onChange={e => setWhatsappUrl(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="btn-group">
                <button type="button" className="btn-secondary" onClick={resetArticleForm}>
                  <i className="fas fa-redo" /> Réinitialiser
                </button>
                <button type="submit" className="submit-btn" disabled={loading || !texte.trim()}>
                  <i className="fas fa-rocket" /> Publier l'article
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Notification tab ── */}
        <div className={`tab-content${activeTab === 'notification' ? ' active' : ''}`}>
          <div className="card">
            <div className="card-header">
              <i className="fas fa-bullhorn" /><h2>Envoyer une notification</h2>
            </div>
            <form onSubmit={handleNotifSubmit}>
              <div className="form-group">
                <label htmlFor="notif-user"><i className="fas fa-user-check" /> Destinataire</label>
                <select id="notif-user" value={notifUser} onChange={e => setNotifUser(e.target.value)}>
                  <option value="all">📢 Tous les utilisateurs</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>{u.prenom} {u.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="notif-texte"><i className="fas fa-comment-dots" /> Message <span className="required">*</span></label>
                <textarea id="notif-texte" rows={6} placeholder="Rédigez votre notification..."
                  value={notifTexte} onChange={e => setNotifTexte(e.target.value)} required />
              </div>
              <div className="btn-group">
                <button type="button" className="btn-secondary" onClick={() => { setNotifTexte(''); setNotifUser('all'); }}>
                  <i className="fas fa-times" /> Annuler
                </button>
                <button type="submit" className="submit-btn" disabled={loading || !notifTexte.trim()}>
                  <i className="fas fa-paper-plane" /> Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublierPage;
