// ============================================================================
// WORLD CONNECT - NOTIFICATIONS.TSX
// Converti depuis notifications.html — Version 3.0
// Système de notifications avec Three.js + Supabase
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

// ============================================================================
// CSS INLINE
// ============================================================================
const STYLES = `
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --primary:       #6b7c4a;
  --primary-light: #8a9d5f;
  --bg-dark:       #0a0e27;
  --text-primary:   #ffffff;
  --text-secondary: rgba(255,255,255,0.7);
  --text-muted:     rgba(255,255,255,0.5);
  --card-bg:    rgba(255,255,255,0.08);
  --card-hover: rgba(255,255,255,0.12);
  --border:     rgba(255,255,255,0.1);
  --danger:  #dc3545;
  --success: #32cd32;
  --warning: #ffd700;
  --info:    #ff69b4;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-dark);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

#threejs-canvas {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  padding: 0 20px;
}

/* ── Header ─────────────────────────────────────────────── */
.header {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  padding: 0 40px;
  height: 80px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.header h1 {
  color: var(--text-primary);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.header h1 i { font-size: 28px; }

.mark-all-btn {
  background: rgba(255,255,255,0.15);
  color: var(--text-primary);
  border: 2px solid rgba(255,255,255,0.3);
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 14px;
  backdrop-filter: blur(10px);
  font-family: inherit;
}
.mark-all-btn:hover {
  background: rgba(255,255,255,0.25);
  border-color: rgba(255,255,255,0.5);
  transform: translateY(-2px);
}

/* ── Content ─────────────────────────────────────────────── */
.content-wrapper { padding: 40px 0; }

.tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  background: rgba(255,255,255,0.05);
  padding: 8px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.tab {
  flex: 1;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  transition: all 0.3s ease;
  font-size: 14px;
  font-family: inherit;
}
.tab:hover { color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.08); }
.tab.active { background: rgba(107,124,74,0.4); color: var(--text-primary); }

.filter-info {
  background: var(--card-bg);
  padding: 20px 28px;
  border-radius: 12px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
}
.filter-info span { color: var(--text-secondary); font-weight: 600; font-size: 15px; }

.count-badge {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: var(--text-primary);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
}

/* ── Notification cards ─────────────────────────────────── */
.notifications-list { display: flex; flex-direction: column; gap: 16px; }

.notification-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
  backdrop-filter: blur(10px);
}

.notification-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: transparent;
  transition: all 0.3s;
}

.notification-card.unread {
  background: rgba(107,124,74,0.15);
  border-color: rgba(107,124,74,0.3);
}
.notification-card.unread::before {
  background: linear-gradient(to bottom, var(--primary), var(--primary-light));
}

.notification-card:hover {
  background: var(--card-hover);
  transform: translateX(8px);
  border-color: rgba(107,124,74,0.5);
}

.notif-icon {
  width: 50px; height: 50px;
  border-radius: 12px;
  background: rgba(107,124,74,0.3);
  display: flex; align-items: center; justify-content: center;
  color: var(--primary-light);
  font-size: 22px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}
.notification-card:hover .notif-icon { transform: scale(1.1); background: rgba(107,124,74,0.5); }
.notif-icon.reaction { background: rgba(255,20,147,0.2); color: var(--info); }
.notif-icon.comment  { background: rgba(50,205,50,0.2);  color: var(--success); }
.notif-icon.reply    { background: rgba(255,215,0,0.2);  color: var(--warning); }

.notif-content { flex: 1; }

.notif-text {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 12px;
  font-size: 15px;
}

.notif-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: var(--text-muted);
}

.notif-time { display: flex; align-items: center; gap: 6px; }

.notif-badge {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.delete-btn {
  background: rgba(220,53,69,0.2);
  border: none;
  color: var(--danger);
  cursor: pointer;
  font-size: 18px;
  padding: 10px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}
.delete-btn:hover { background: rgba(220,53,69,0.3); transform: scale(1.1); }

/* ── Loader / Empty ─────────────────────────────────────── */
.loader { text-align: center; padding: 80px 20px; color: var(--text-secondary); }

.spinner {
  border: 3px solid rgba(107,124,74,0.2);
  border-top: 3px solid var(--primary-light);
  border-radius: 50%;
  width: 50px; height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 100px 20px; color: var(--text-muted); }
.empty-state i { font-size: 80px; margin-bottom: 25px; color: rgba(107,124,74,0.4); display: block; }
.empty-state h3 { color: var(--text-secondary); margin-bottom: 15px; font-size: 24px; font-weight: 700; }
.empty-state p  { font-size: 16px; color: var(--text-muted); }

/* ── Responsive ─────────────────────────────────────────── */
@media (max-width: 768px) {
  .header { padding: 0 20px; height: 70px; }
  .header h1 { font-size: 20px; }
  .tabs { flex-direction: column; }
  .notification-card { padding: 18px; }
  .notif-icon { width: 45px; height: 45px; font-size: 20px; }
}
`;

// ============================================================================
// TYPES
// ============================================================================

interface Notification {
  notification_id: string;
  user_id: string;
  texte: string;
  read_status: boolean;
  date_created: string;
}

interface SupabaseUser { id: string; }

declare global {
  interface Window {
    supabaseClient: {
      supabase: any;
      getCurrentUser: () => Promise<SupabaseUser | null>;
    };
  }
}

type FilterType = 'all' | 'unread' | 'read';

// ============================================================================
// HELPERS
// ============================================================================

function escapeHtml(text: string): string {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function formatTimeAgo(dateString: string): string {
  const diff    = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);

  if (days    > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  if (hours   > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  return "À l'instant";
}

function getNotifIcon(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('réaction'))                        return 'fas fa-heart';
  if (t.includes('commentaire'))                     return 'fas fa-comment';
  if (t.includes('réponse'))                         return 'fas fa-reply';
  if (t.includes('article') || t.includes('publication')) return 'fas fa-newspaper';
  if (t.includes('message'))                         return 'fas fa-envelope';
  return 'fas fa-bell';
}

function getNotifType(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('réaction'))   return 'reaction';
  if (t.includes('commentaire')) return 'comment';
  if (t.includes('réponse'))    return 'reply';
  return '';
}

// ============================================================================
// NOTIFICATION CARD COMPONENT
// ============================================================================

interface NotifCardProps {
  notif: Notification;
  onRead:   (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const NotifCard: React.FC<NotifCardProps> = ({ notif, onRead, onDelete }) => {
  const iconClass = getNotifIcon(notif.texte);
  const iconType  = getNotifType(notif.texte);
  const timeAgo   = formatTimeAgo(notif.date_created);

  return (
    <div
      className={`notification-card${notif.read_status ? '' : ' unread'}`}
      onClick={() => { if (!notif.read_status) onRead(notif.notification_id); }}
    >
      <div className={`notif-icon${iconType ? ` ${iconType}` : ''}`}>
        <i className={iconClass} />
      </div>

      <div className="notif-content">
        <div
          className="notif-text"
          dangerouslySetInnerHTML={{ __html: escapeHtml(notif.texte) }}
        />
        <div className="notif-meta">
          <div className="notif-time">
            <i className="far fa-clock" />
            <span>{timeAgo}</span>
          </div>
          {!notif.read_status && <span className="notif-badge">Nouveau</span>}
        </div>
      </div>

      <button
        className="delete-btn"
        onClick={e => onDelete(notif.notification_id, e)}
        title="Supprimer"
      >
        <i className="fas fa-trash-alt" />
      </button>
    </div>
  );
};

// ============================================================================
// NOTIFICATIONS PAGE COMPONENT
// ============================================================================

const NotificationsPage: React.FC = () => {

  // ── CSS injection ────────────────────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement('style');
    s.id = 'notifs-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
    document.title = 'World Connect - Notifications';
    return () => { document.getElementById('notifs-styles')?.remove(); };
  }, []);

  // ── Three.js ─────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    camera.position.z = 30;

    // Particles
    const pCount = 2000;
    const pPos   = new Float32Array(pCount * 3);
    const pCol   = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i += 3) {
      pPos[i]   = (Math.random() - 0.5) * 100;
      pPos[i+1] = (Math.random() - 0.5) * 100;
      pPos[i+2] = (Math.random() - 0.5) * 100;
      pCol[i]   = 0.2 + Math.random() * 0.3;
      pCol[i+1] = 0.4 + Math.random() * 0.4;
      pCol[i+2] = 0.8 + Math.random() * 0.2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.3, vertexColors: true, transparent: true,
      opacity: 0.8, blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Text particles
    const textGroup = new THREE.Group();
    [{ yOffset: 2 }, { yOffset: -2 }].forEach(({ yOffset }) => {
      const tPos: number[] = [], tCol: number[] = [];
      for (let i = 0; i < 300; i++) {
        tPos.push((Math.random() - 0.5) * 15, yOffset + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 5);
        tCol.push(0.3, 0.5, 1);
      }
      const tGeo = new THREE.BufferGeometry();
      tGeo.setAttribute('position', new THREE.Float32BufferAttribute(tPos, 3));
      tGeo.setAttribute('color',    new THREE.Float32BufferAttribute(tCol, 3));
      textGroup.add(new THREE.Points(tGeo, new THREE.PointsMaterial({
        size: 0.4, vertexColors: true, transparent: true,
        opacity: 0.9, blending: THREE.AdditiveBlending,
      })));
    });
    scene.add(textGroup);

    let animId = 0;
    const posArr = particles.geometry.attributes.position.array as Float32Array;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      particles.rotation.x  += 0.0005;
      particles.rotation.y  += 0.001;
      textGroup.rotation.y  += 0.002;
      for (let i = 1; i < posArr.length; i += 3) {
        posArr[i] += Math.sin(Date.now() * 0.001 + i) * 0.01;
      }
      particles.geometry.attributes.position.needsUpdate = true;
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

  // ── State ────────────────────────────────────────────────────────────────
  const [allNotifs,     setAllNotifs]     = useState<Notification[]>([]);
  const [filter,        setFilter]        = useState<FilterType>('all');
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState(false);

  const sbRef          = useRef<any>(null);
  const currentUserRef = useRef<SupabaseUser | null>(null);

  // ── Supabase init ────────────────────────────────────────────────────────
  useEffect(() => {
    const tryInit = () => {
      if (window.supabaseClient?.supabase) {
        sbRef.current = window.supabaseClient.supabase;
        initNotifications();
      } else {
        setTimeout(tryInit, 100);
      }
    };
    tryInit();
  }, []);

  const initNotifications = async () => {
    const user = await window.supabaseClient.getCurrentUser();
    if (!user) { window.location.href = 'connexion.tsx'; return; }
    currentUserRef.current = user;
    await loadNotifications(user);

    // Rafraîchissement automatique toutes les 10s
    const interval = setInterval(() => {
      if (currentUserRef.current) loadNotifications(currentUserRef.current);
    }, 10_000);

    return () => clearInterval(interval);
  };

  // ── Load ─────────────────────────────────────────────────────────────────
  const loadNotifications = useCallback(async (user: SupabaseUser | null = currentUserRef.current) => {
    if (!user || !sbRef.current) return;
    try {
      const { data, error } = await sbRef.current
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('date_created', { ascending: false });

      if (error) throw error;
      setAllNotifs(data || []);
      setLoadError(false);
    } catch (err) {
      console.error('loadNotifications:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = (() => {
    if (filter === 'unread') return allNotifs.filter(n => !n.read_status);
    if (filter === 'read')   return allNotifs.filter(n =>  n.read_status);
    return allNotifs;
  })();

  const filterLabel = filter === 'unread' ? 'Notifications non lues'
                    : filter === 'read'   ? 'Notifications lues'
                    : 'Toutes les notifications';

  const hasUnread = allNotifs.some(n => !n.read_status);

  // ── Actions ──────────────────────────────────────────────────────────────
  const markAsRead = async (id: string) => {
    try {
      await sbRef.current.from('notifications').update({ read_status: true }).eq('notification_id', id);
      setAllNotifs(prev => prev.map(n => n.notification_id === id ? { ...n, read_status: true } : n));
    } catch (err) {
      console.error('markAsRead:', err);
    }
  };

  const markAllAsRead = async () => {
    const user = currentUserRef.current;
    if (!user) return;
    try {
      await sbRef.current
        .from('notifications')
        .update({ read_status: true })
        .eq('user_id', user.id)
        .eq('read_status', false);
      setAllNotifs(prev => prev.map(n => ({ ...n, read_status: true })));
    } catch (err) {
      console.error('markAllAsRead:', err);
      alert('Erreur lors de la mise à jour');
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Voulez-vous vraiment supprimer cette notification ?')) return;
    try {
      await sbRef.current.from('notifications').delete().eq('notification_id', id);
      setAllNotifs(prev => prev.filter(n => n.notification_id !== id));
    } catch (err) {
      console.error('deleteNotification:', err);
      alert('Erreur lors de la suppression');
    }
  };

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <>
      <canvas ref={canvasRef} id="threejs-canvas" />

      {/* Header */}
      <div className="header">
        <h1>
          <i className="fas fa-globe" />
          World Connect
        </h1>
        {hasUnread && (
          <button className="mark-all-btn" onClick={markAllAsRead}>
            <i className="fas fa-check-double" /> Tout marquer lu
          </button>
        )}
      </div>

      {/* Content */}
      <div className="container">
        <div className="content-wrapper">

          {/* Tabs */}
          <div className="tabs">
            {(['all', 'unread', 'read'] as FilterType[]).map(f => {
              const labels: Record<FilterType, string> = {
                all:    '<i class="fas fa-list"></i> Toutes',
                unread: '<i class="fas fa-envelope"></i> Non Lues',
                read:   '<i class="fas fa-envelope-open"></i> Lues',
              };
              return (
                <button
                  key={f}
                  className={`tab${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f)}
                  dangerouslySetInnerHTML={{ __html: labels[f] }}
                />
              );
            })}
          </div>

          {/* Filter info */}
          <div className="filter-info">
            <span>{filterLabel}</span>
            <span className="count-badge">{filtered.length}</span>
          </div>

          {/* Loader */}
          {loading && (
            <div className="loader">
              <div className="spinner" />
              <p>Chargement des notifications…</p>
            </div>
          )}

          {/* Error */}
          {!loading && loadError && (
            <div className="loader"><p>Erreur de chargement</p></div>
          )}

          {/* Notifications list */}
          {!loading && !loadError && filtered.length > 0 && (
            <div className="notifications-list">
              {filtered.map(notif => (
                <NotifCard
                  key={notif.notification_id}
                  notif={notif}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !loadError && filtered.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-bell-slash" />
              <h3>Aucune Notification</h3>
              <p>Vous n'avez reçu aucune notification pour le moment</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
