// ============================================================================
// SERVICE WORKER PRODUCTION - WORLD CONNECT
// Version: 5.1.0 — Adapté pour Vite + Vercel
// ============================================================================

'use strict';

const VERSION = '5.1.0';
const CACHE_NAME = `worldconnect-v${VERSION}`;
const CACHE_STATIC = `${CACHE_NAME}-static`;
const CACHE_IMAGES = `${CACHE_NAME}-images`;

// ✅ VITE ne génère PAS index.html à la racine — on cache seulement /
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/connect_pro.png'
];

// URLs à NE JAMAIS cacher (Supabase, auth, données temps réel)
const NEVER_CACHE_PATTERNS = [
  /supabase\.co/,
  /\/api\//,
  /\/auth\//,
  /realtime/,
  /\.json$/,
  /timestamp=/,
  /cache-bust=/
];

// Ressources cachables
const CACHEABLE_PATTERNS = [
  /\.(png|jpg|jpeg|gif|svg|webp|ico)$/,
  /\.(css|js)$/,
  /fonts\//,
  /\/assets\//,           // ✅ Vite génère les assets dans /assets/
  /cdnjs\.cloudflare\.com/,
  /cdn\.jsdelivr\.net/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/
];

const CONFIG = {
  MAX_CACHE_SIZE: 100,
  CACHE_MAX_AGE: 86400000, // 24h
  NOTIFICATION_ICON: '/connect_pro.png',
  NETWORK_TIMEOUT: 8000,
  VAPID_PUBLIC_KEY: 'BH3HWUJHOVhPrzNe-XeKjVTls6_iExezM7hReypIioYDh49bui2j7r60bf_aGBMOtVJ0ReiQVGVfxZDVgELmjCA',
  SYNC_RETRY_INTERVAL: 60000,
  MAX_SYNC_RETRIES: 5
};

const SUPPORT = {
  notifications: 'Notification' in self,
  push: 'PushManager' in self,
  cache: 'caches' in self,
  backgroundSync: 'sync' in (self.registration || {}),
  periodicBackgroundSync: 'periodicSync' in (self.registration || {})
};

console.log(`🚀 SW v${VERSION} chargé`);

// ============================================================================
// QUEUE DE SYNCHRONISATION
// ============================================================================

class SyncQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  async add(action) {
    this.queue.push({
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: CONFIG.MAX_SYNC_RETRIES
    });
    await this.saveQueue();
    if (!this.processing) this.processQueue();
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];
      try {
        await this.executeAction(item.action);
        this.queue.shift();
        await this.notifyClients({ type: 'SYNC_SUCCESS', action: item.action });
      } catch (error) {
        item.retries++;
        if (item.retries >= item.maxRetries) {
          this.queue.shift();
          await this.notifyClients({ type: 'SYNC_FAILED', action: item.action, error: error.message });
        } else {
          await new Promise(r => setTimeout(r, CONFIG.SYNC_RETRY_INTERVAL));
        }
      }
      await this.saveQueue();
    }
    this.processing = false;
  }

  async executeAction(action) {
    switch (action.type) {
      case 'ADD_REACTION': return await this.syncReaction(action.data);
      case 'REMOVE_REACTION': return await this.syncRemoveReaction(action.data);
      case 'ADD_COMMENT': return await this.syncComment(action.data);
      case 'DELETE_COMMENT': return await this.syncDeleteComment(action.data);
      default: throw new Error(`Type inconnu: ${action.type}`);
    }
  }

  async syncReaction(data) {
    const res = await fetch(`${data.supabaseUrl}/rest/v1/article_reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': data.supabaseKey,
        'Authorization': `Bearer ${data.userToken}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ article_id: data.articleId, user_id: data.userId, reaction_type: data.reactionType })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async syncRemoveReaction(data) {
    const res = await fetch(`${data.supabaseUrl}/rest/v1/article_reactions?reaction_id=eq.${data.reactionId}`, {
      method: 'DELETE',
      headers: { 'apikey': data.supabaseKey, 'Authorization': `Bearer ${data.userToken}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  async syncComment(data) {
    const res = await fetch(`${data.supabaseUrl}/rest/v1/sessions_commentaires`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': data.supabaseKey,
        'Authorization': `Bearer ${data.userToken}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ article_id: data.articleId, user_id: data.userId, texte: data.content })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async syncDeleteComment(data) {
    const res = await fetch(`${data.supabaseUrl}/rest/v1/sessions_commentaires?session_id=eq.${data.commentId}`, {
      method: 'DELETE',
      headers: { 'apikey': data.supabaseKey, 'Authorization': `Bearer ${data.userToken}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  async saveQueue() {
    try {
      const db = await this.openDB();
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      await new Promise((res, rej) => { const r = store.clear(); r.onsuccess = res; r.onerror = () => rej(r.error); });
      for (const item of this.queue) {
        const safe = { id: item.id, action: { type: item.action.type, data: JSON.parse(JSON.stringify(item.action.data)) }, timestamp: item.timestamp, retries: item.retries, maxRetries: item.maxRetries };
        await new Promise((res, rej) => { const r = store.add(safe); r.onsuccess = res; r.onerror = () => rej(r.error); });
      }
    } catch (e) { console.error('❌ Erreur saveQueue:', e); }
  }

  async loadQueue() {
    try {
      const db = await this.openDB();
      const tx = db.transaction('syncQueue', 'readonly');
      const store = tx.objectStore('syncQueue');
      const items = await new Promise((res, rej) => { const r = store.getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
      this.queue = items || [];
      if (this.queue.length > 0) this.processQueue();
    } catch (e) { this.queue = []; }
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('WorldConnectSync', 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('syncQueue')) db.createObjectStore('syncQueue', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('offlineData')) db.createObjectStore('offlineData', { keyPath: 'key' });
      };
    });
  }

  async notifyClients(message) {
    const clients = await self.clients.matchAll({ type: 'window' });
    const safe = JSON.parse(JSON.stringify(message));
    clients.forEach(c => { try { c.postMessage(safe); } catch (e) {} });
  }
}

const syncQueue = new SyncQueue();

// ============================================================================
// UTILITAIRES CACHE
// ============================================================================

const mustUseNetwork = (url) => NEVER_CACHE_PATTERNS.some(p => p.test(url));
const isCacheable = (url) => CACHEABLE_PATTERNS.some(p => p.test(url));

const cleanupCaches = async () => {
  const keys = await caches.keys();
  return Promise.all(keys.filter(k => ![CACHE_STATIC, CACHE_IMAGES].includes(k)).map(k => caches.delete(k)));
};

const limitCacheSize = async (cacheName, max) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)));
};

// ============================================================================
// STRATÉGIES
// ============================================================================

const networkOnly = async (request) => {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), CONFIG.NETWORK_TIMEOUT);
    const res = await fetch(request, { signal: controller.signal });
    clearTimeout(tid);
    return res;
  } catch {
    // ✅ Pour les navigations SPA : retourner / (pas offline.html qui n'existe pas)
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_STATIC);
      const root = await cache.match('/');
      if (root) return root;
    }
    return new Response('Hors ligne', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
};

const cacheFirst = async (request) => {
  const cacheName = /\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(request.url) ? CACHE_IMAGES : CACHE_STATIC;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    if (res.ok) {
      await cache.put(request, res.clone());
      if (cacheName === CACHE_IMAGES) await limitCacheSize(CACHE_IMAGES, CONFIG.MAX_CACHE_SIZE);
    }
    return res;
  } catch {
    if (cached) return cached;
    throw new Error('Ressource indisponible');
  }
};

const networkFirstWithCache = async (request) => {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE_STATIC);
      await cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cache = await caches.open(CACHE_STATIC);
    // ✅ SPA : fallback vers / si la route n'est pas cachée
    return (await cache.match(request)) || (await cache.match('/')) || new Response('Hors ligne', { status: 503 });
  }
};

// ============================================================================
// ÉVÉNEMENTS
// ============================================================================

self.addEventListener('install', (event) => {
  console.log(`⚙️ Installation SW v${VERSION}`);
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_STATIC);
      // ✅ addAll avec gestion d'erreur individuelle (manifest.json peut être absent)
      await Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url).catch(e => console.warn(`⚠️ Impossible de cacher ${url}:`, e))));
      await self.skipWaiting();
      console.log('✅ Installation terminée');
    } catch (e) {
      console.error('❌ Erreur installation:', e);
    }
  })());
});

self.addEventListener('activate', (event) => {
  console.log(`🚀 Activation SW v${VERSION}`);
  event.waitUntil((async () => {
    await cleanupCaches();
    await self.clients.claim();
    await syncQueue.loadQueue();

    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => {
      try { c.postMessage({ type: 'SW_ACTIVATED', version: VERSION, support: SUPPORT }); } catch {}
    });
    console.log('✅ SW activé');
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Ignorer les extensions Chrome et autres protocoles
  if (!url.protocol.startsWith('http')) return;

  // Origines autorisées
  const isLocal = url.origin === location.origin;
  const isAllowedExternal = url.hostname.includes('supabase') || url.hostname.includes('cdnjs') || url.hostname.includes('jsdelivr') || url.hostname.includes('fonts.googleapis') || url.hostname.includes('fonts.gstatic');

  if (!isLocal && !isAllowedExternal) return;

  let strategy;

  if (mustUseNetwork(url.href)) {
    strategy = networkOnly(request);
  } else if (isCacheable(url.href)) {
    strategy = cacheFirst(request);
  } else if (request.mode === 'navigate') {
    strategy = networkFirstWithCache(request);
  } else {
    strategy = networkOnly(request);
  }

  event.respondWith(strategy);
});

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

if (SUPPORT.backgroundSync) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-reactions' || event.tag === 'sync-comments') {
      event.waitUntil(syncQueue.processQueue());
    }
  });
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  if (!SUPPORT.notifications) return;

  event.waitUntil((async () => {
    let data = {
      title: 'World Connect',
      body: 'Nouvelle notification',
      icon: CONFIG.NOTIFICATION_ICON,
      badge: CONFIG.NOTIFICATION_ICON,
      tag: `notif-${Date.now()}`,
      data: { url: '/' }
    };

    if (event.data) {
      try {
        const payload = event.data.json();
        const n = payload.notification || payload;
        data = {
          title: n.title || data.title,
          body: n.body || n.message || data.body,
          icon: n.icon || data.icon,
          badge: n.badge || data.badge,
          tag: n.tag || data.tag,
          requireInteraction: n.requireInteraction || false,
          data: { url: n.data?.url || payload.url || '/', ...(n.data || {}) }
        };
        if ('actions' in Notification.prototype) {
          data.actions = n.actions || [
            { action: 'open', title: '👀 Voir' },
            { action: 'dismiss', title: '✕ Fermer' }
          ];
        }
      } catch (e) { console.error('❌ Erreur parsing push:', e); }
    }

    await self.registration.showNotification(data.title, data);

    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => {
      try { c.postMessage({ type: 'PLAY_NOTIFICATION_SOUND', notification: { title: data.title, body: data.body } }); } catch {}
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const { url, articleId } = event.notification.data || {};
  const urlToOpen = articleId ? `/?article=${articleId}` : (url || '/');
  const fullUrl = new URL(urlToOpen, self.location.origin).href;

  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of clients) {
      if (c.url === fullUrl && 'focus' in c) return c.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(fullUrl);
  })());
});

// ============================================================================
// MESSAGES
// ============================================================================

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  switch (type) {
    case 'SKIP_WAITING': self.skipWaiting(); break;
    case 'CLEAR_CACHE':
      event.waitUntil((async () => { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); })());
      break;
    case 'GET_VERSION':
      if (event.ports?.[0]) {
        try { event.ports[0].postMessage({ version: VERSION, support: SUPPORT, queueLength: syncQueue.queue.length }); } catch {}
      }
      break;
    case 'SYNC_ACTION': event.waitUntil(syncQueue.add(payload)); break;
    case 'FORCE_SYNC': event.waitUntil(syncQueue.processQueue()); break;
  }
});

self.addEventListener('error', (e) => console.error('❌ SW Error:', e.error));
self.addEventListener('unhandledrejection', (e) => console.error('❌ Promise rejetée:', e.reason));

console.log(`✅ SW v${VERSION} prêt`);
