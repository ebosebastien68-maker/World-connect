// ============================================================================
// SERVICE WORKER PRODUCTION - WORLD CONNECT
// ============================================================================
// Version: 5.0.2 - Fix IDBRequest Clone Error
// ============================================================================

/// <reference lib="webworker" />
/// <reference lib="webworker.iterable" />

export type {}; // Forcer le module isolé (évite les conflits Window/ServiceWorker)

declare const self: ServiceWorkerGlobalScope;

'use strict';

// ============================================================================
// TYPES
// ============================================================================

type SyncActionType =
  | 'ADD_REACTION'
  | 'REMOVE_REACTION'
  | 'ADD_COMMENT'
  | 'DELETE_COMMENT';

interface ReactionData {
  supabaseUrl: string;
  supabaseKey: string;
  userToken: string;
  articleId: string;
  userId: string;
  reactionType: string;
}

interface RemoveReactionData {
  supabaseUrl: string;
  supabaseKey: string;
  userToken: string;
  reactionId: string;
}

interface CommentData {
  supabaseUrl: string;
  supabaseKey: string;
  userToken: string;
  articleId: string;
  userId: string;
  content: string;
}

interface DeleteCommentData {
  supabaseUrl: string;
  supabaseKey: string;
  userToken: string;
  commentId: string;
}

type ActionData = ReactionData | RemoveReactionData | CommentData | DeleteCommentData;

interface SyncAction {
  type: SyncActionType;
  data: ActionData;
}

interface QueueItem {
  id: string;
  action: SyncAction;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

type SafeQueueItem = QueueItem; // même structure, explicite lors de la sérialisation

interface ClientMessage {
  type: string;
  action?: { type: string; timestamp?: number };
  error?: string;
}

interface SWVersionResponse {
  version: string;
  support: SupportFlags;
  queueLength: number;
}

interface SWSyncQueueResponse {
  queue: SafeQueueItem[];
  processing: boolean;
}

interface SupportFlags {
  notifications: boolean;
  push: boolean;
  cache: boolean;
  backgroundSync: boolean;
  periodicBackgroundSync: boolean;
}

interface NotificationPayload {
  title?: string;
  body?: string;
  message?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  priority?: number;
  actions?: NotificationAction[];
  vibrate?: number[];
  data?: {
    url?: string;
    type?: string;
    articleId?: string;
    [key: string]: unknown;
  };
  notification?: NotificationPayload;
  // champs racine (format alternatif)
  url?: string;
  type?: string;
  articleId?: string;
}

interface ExtendedNotificationOptions extends NotificationOptions {
  requireInteraction?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const VERSION = '5.0.2';
const CACHE_NAME = `worldconnect-v${VERSION}`;
const CACHE_STATIC = `${CACHE_NAME}-static`;
const CACHE_IMAGES = `${CACHE_NAME}-images`;
const CACHE_OFFLINE_DATA = `${CACHE_NAME}-offline-data`;

const STATIC_ASSETS: string[] = [
  '/',
  '/index.html',
  '/manifest.json',
  '/connect_pro.png',
  '/offline.html',
];

const NEVER_CACHE_PATTERNS: RegExp[] = [
  /\/api\//,
  /supabase\.co/,
  /\/auth\//,
  /realtime/,
  /\.json$/,
  /\/notifications/,
  /\/messages/,
  /\/reactions/,
  /\/comments/,
  /\/articles/,
  /timestamp=/,
  /cache-bust=/,
];

const CACHEABLE_PATTERNS: RegExp[] = [
  /\.(png|jpg|jpeg|gif|svg|webp|ico)$/,
  /\.(css|js)$/,
  /fonts\//,
  /\/static\//,
  /cdnjs\.cloudflare\.com/,
  /cdn\.jsdelivr\.net/,
];

const CONFIG = {
  MAX_CACHE_SIZE: 100,
  CACHE_MAX_AGE: 86_400_000, // 24h
  NOTIFICATION_ICON: '/connect_pro.png',
  NETWORK_TIMEOUT: 5000,
  VAPID_PUBLIC_KEY:
    'BH3HWUJHOVhPrzNe-XeKjVTls6_iExezM7hReypIioYDh49bui2j7r60bf_aGBMOtVJ0ReiQVGVfxZDVgELmjCA',
  SYNC_RETRY_INTERVAL: 60_000,
  MAX_SYNC_RETRIES: 5,
} as const;

const SUPPORT: SupportFlags = {
  notifications: 'Notification' in self,
  push: 'PushManager' in self,
  cache: 'caches' in self,
  backgroundSync: 'sync' in self.registration,
  periodicBackgroundSync: 'periodicSync' in (self.registration as ServiceWorkerRegistration),
};

console.log(`🚀 SW v${VERSION} - Support:`, SUPPORT);

// ============================================================================
// SYNC QUEUE
// ============================================================================

class SyncQueue {
  queue: QueueItem[] = [];
  processing = false;

  async add(action: SyncAction): Promise<void> {
    const item: QueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      action,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: CONFIG.MAX_SYNC_RETRIES,
    };

    this.queue.push(item);
    console.log('📥 Action ajoutée à la queue:', action.type);
    await this.saveQueue();

    if (!this.processing) this.processQueue();
  }

  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    console.log(`🔄 Traitement de ${this.queue.length} action(s)...`);

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        await this.executeAction(item.action);
        this.queue.shift();
        console.log('✅ Action synchronisée:', item.action.type);

        await this.notifyClients({ type: 'SYNC_SUCCESS', action: item.action });
      } catch (err) {
        const error = err as Error;
        console.error('❌ Erreur sync:', error);
        item.retries++;

        if (item.retries >= item.maxRetries) {
          this.queue.shift();
          console.warn('⚠️ Action abandonnée après', item.retries, 'tentatives');
          await this.notifyClients({
            type: 'SYNC_FAILED',
            action: item.action,
            error: error.message,
          });
        } else {
          console.log(`🔄 Nouvelle tentative (${item.retries}/${item.maxRetries})`);
          await new Promise<void>((resolve) =>
            setTimeout(resolve, CONFIG.SYNC_RETRY_INTERVAL),
          );
        }
      }

      await this.saveQueue();
    }

    this.processing = false;
    console.log('✅ Queue terminée');
  }

  private async executeAction(action: SyncAction): Promise<unknown> {
    switch (action.type) {
      case 'ADD_REACTION':
        return this.syncReaction(action.data as ReactionData);
      case 'REMOVE_REACTION':
        return this.syncRemoveReaction(action.data as RemoveReactionData);
      case 'ADD_COMMENT':
        return this.syncComment(action.data as CommentData);
      case 'DELETE_COMMENT':
        return this.syncDeleteComment(action.data as DeleteCommentData);
      default:
        throw new Error(`Type d'action inconnu: ${(action as SyncAction).type}`);
    }
  }

  private async syncReaction(data: ReactionData): Promise<unknown> {
    if (!data.userToken) throw new Error("Token d'authentification manquant");

    const response = await fetch(`${data.supabaseUrl}/rest/v1/article_reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: data.supabaseKey,
        Authorization: `Bearer ${data.userToken}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        article_id: data.articleId,
        user_id: data.userId,
        reaction_type: data.reactionType,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return response.json();
  }

  private async syncRemoveReaction(data: RemoveReactionData): Promise<void> {
    if (!data.userToken) throw new Error("Token d'authentification manquant");

    const response = await fetch(
      `${data.supabaseUrl}/rest/v1/article_reactions?reaction_id=eq.${data.reactionId}`,
      {
        method: 'DELETE',
        headers: {
          apikey: data.supabaseKey,
          Authorization: `Bearer ${data.userToken}`,
        },
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  }

  private async syncComment(data: CommentData): Promise<unknown> {
    const response = await fetch(`${data.supabaseUrl}/rest/v1/sessions_commentaires`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: data.supabaseKey,
        Authorization: `Bearer ${data.userToken}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        article_id: data.articleId,
        user_id: data.userId,
        texte: data.content,
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  private async syncDeleteComment(data: DeleteCommentData): Promise<void> {
    const response = await fetch(
      `${data.supabaseUrl}/rest/v1/sessions_commentaires?session_id=eq.${data.commentId}`,
      {
        method: 'DELETE',
        headers: {
          apikey: data.supabaseKey,
          Authorization: `Bearer ${data.userToken}`,
        },
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  }

  // --------------------------------------------------------------------------
  // IndexedDB
  // --------------------------------------------------------------------------

  async saveQueue(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');

      await idbRequest<undefined>(store.clear());

      for (const item of this.queue) {
        const safe: QueueItem = {
          id: item.id,
          action: {
            type: item.action.type,
            data: JSON.parse(JSON.stringify(item.action.data)) as ActionData,
          },
          timestamp: item.timestamp,
          retries: item.retries,
          maxRetries: item.maxRetries,
        };
        await idbRequest<IDBValidKey>(store.add(safe));
      }

      console.log('💾 Queue sauvegardée');
    } catch (err) {
      console.error('❌ Erreur sauvegarde queue:', err);
    }
  }

  async loadQueue(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('syncQueue', 'readonly');
      const store = tx.objectStore('syncQueue');

      const items = await idbRequest<QueueItem[]>(store.getAll());
      this.queue = items ?? [];

      console.log(`📦 ${this.queue.length} action(s) chargée(s)`);
      if (this.queue.length > 0) this.processQueue();
    } catch (err) {
      console.error('❌ Erreur chargement queue:', err);
      this.queue = [];
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('WorldConnectSync', 1);

      request.onerror = () => {
        console.error('❌ Erreur ouverture DB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('✅ DB ouverte');
        resolve(request.result);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
          console.log('📦 Store syncQueue créé');
        }

        if (!db.objectStoreNames.contains('offlineData')) {
          db.createObjectStore('offlineData', { keyPath: 'key' });
          console.log('📦 Store offlineData créé');
        }
      };
    });
  }

  async notifyClients(message: ClientMessage): Promise<void> {
    const clients = await self.clients.matchAll({ type: 'window' });

    const safe = JSON.parse(
      JSON.stringify({
        type: message.type,
        action: message.action
          ? { type: message.action.type, timestamp: message.action.timestamp ?? Date.now() }
          : undefined,
        error: message.error,
      }),
    ) as ClientMessage;

    clients.forEach((client) => {
      try {
        client.postMessage(safe);
      } catch (err) {
        console.error('❌ Erreur postMessage:', err);
      }
    });
  }
}

// Promesse générique autour d'une IDBRequest
function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

const syncQueue = new SyncQueue();

// ============================================================================
// UTILITAIRES DE CACHE
// ============================================================================

const mustUseNetwork = (url: string): boolean =>
  NEVER_CACHE_PATTERNS.some((p) => p.test(url));

const isCacheable = (url: string): boolean =>
  CACHEABLE_PATTERNS.some((p) => p.test(url));

const cleanupCaches = async (): Promise<void> => {
  const names = await caches.keys();
  const current = [CACHE_STATIC, CACHE_IMAGES, CACHE_OFFLINE_DATA];

  await Promise.all(
    names
      .filter((n) => !current.includes(n))
      .map((n) => {
        console.log(`🧹 Suppression cache: ${n}`);
        return caches.delete(n);
      }),
  );
};

const limitCacheSize = async (cacheName: string, max: number): Promise<void> => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > max) {
    const toDelete = keys.slice(0, keys.length - max);
    await Promise.all(toDelete.map((k) => cache.delete(k)));
    console.log(`🧹 ${toDelete.length} images supprimées du cache`);
  }
};

const isCacheValid = (response: Response | undefined): boolean => {
  if (!response) return false;
  const cached = response.headers.get('sw-cached-at');
  if (!cached) return true;
  return Date.now() - parseInt(cached, 10) < CONFIG.CACHE_MAX_AGE;
};

// ============================================================================
// STRATÉGIES DE RÉCUPÉRATION
// ============================================================================

const networkOnly = async (request: Request): Promise<Response> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.NETWORK_TIMEOUT);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch {
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_STATIC);
      const offline = await cache.match('/offline.html');
      if (offline) return offline;
    }
    return new Response('Network Error', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};

const cacheFirst = async (request: Request): Promise<Response> => {
  const cacheName = /\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(request.url)
    ? CACHE_IMAGES
    : CACHE_STATIC;

  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached && isCacheValid(cached)) return cached;

  try {
    const response = await fetch(request);

    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('sw-cached-at', Date.now().toString());

      const toCache = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });

      await cache.put(request, toCache.clone());
      if (cacheName === CACHE_IMAGES) await limitCacheSize(CACHE_IMAGES, CONFIG.MAX_CACHE_SIZE);

      return toCache;
    }

    return response;
  } catch {
    if (cached) return cached;
    throw new Error(`cacheFirst: réseau indisponible pour ${request.url}`);
  }
};

const networkFirstWithCache = async (request: Request): Promise<Response> => {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cache = await caches.open(CACHE_STATIC);
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error(`networkFirstWithCache: réseau indisponible pour ${request.url}`);
  }
};

// ============================================================================
// ÉVÉNEMENTS DU SERVICE WORKER
// ============================================================================

self.addEventListener('install', (event: ExtendableEvent) => {
  console.log(`⚙️ Installation SW v${VERSION}`);

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_STATIC);
        await cache.addAll(STATIC_ASSETS);
        console.log('✅ Assets statiques cachés');
        await self.skipWaiting();
      } catch (err) {
        console.error('❌ Erreur installation:', err);
      }
    })(),
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log(`🚀 Activation SW v${VERSION}`);

  event.waitUntil(
    (async () => {
      try {
        await cleanupCaches();
        await self.clients.claim();
        await syncQueue.loadQueue();

        console.log('✅ SW activé');

        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach((client) => {
          try {
            client.postMessage({ type: 'SW_ACTIVATED', version: VERSION, support: SUPPORT });
          } catch (err) {
            console.error('❌ Erreur postMessage activation:', err);
          }
        });
      } catch (err) {
        console.error('❌ Erreur activation:', err);
      }
    })(),
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (
    url.origin !== self.location.origin &&
    !url.hostname.includes('supabase') &&
    !url.hostname.includes('cdnjs') &&
    !url.hostname.includes('jsdelivr')
  ) return;

  let strategy: Promise<Response>;

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
  self.addEventListener('sync', (event: SyncEvent) => {
    console.log('🔄 Background Sync:', event.tag);

    if (event.tag === 'sync-reactions' || event.tag === 'sync-comments') {
      event.waitUntil(syncQueue.processQueue());
    }
  });
}

if (SUPPORT.periodicBackgroundSync) {
  self.addEventListener('periodicsync', (event: PeriodicSyncEvent) => {
    console.log('🔄 Periodic Sync:', event.tag);

    if (event.tag === 'sync-pending-actions') {
      event.waitUntil(syncQueue.processQueue());
    }
  });
}

// ============================================================================
// NOTIFICATIONS PUSH
// ============================================================================

self.addEventListener('push', (event: PushEvent) => {
  console.log('📩 Notification push reçue');

  if (!SUPPORT.push || !SUPPORT.notifications) {
    console.warn('⚠️ Notifications non supportées');
    return;
  }

  event.waitUntil(
    (async () => {
      try {
        let notifData: ExtendedNotificationOptions & { title: string } = {
          title: 'World Connect',
          body: 'Nouvelle notification',
          icon: CONFIG.NOTIFICATION_ICON,
          badge: CONFIG.NOTIFICATION_ICON,
          tag: `notif-${Date.now()}`,
          data: { url: '/' },
        };

        if (event.data) {
          try {
            const payload = event.data.json() as NotificationPayload;
            console.log('📦 Payload reçu:', JSON.stringify(payload, null, 2));

            const n: NotificationPayload = payload.notification ?? payload;
            console.log('🔍 Notification extraite:', JSON.stringify(n, null, 2));

            notifData = {
              title: n.title ?? payload.title ?? notifData.title,
              body: n.body ?? n.message ?? payload.body ?? payload.message ?? notifData.body as string,
              icon: n.icon ?? payload.icon ?? notifData.icon,
              badge: n.badge ?? payload.badge ?? notifData.badge,
              tag: n.tag ?? payload.tag ?? notifData.tag,
              requireInteraction:
                n.requireInteraction ?? payload.requireInteraction ?? (n.priority !== undefined && n.priority >= 8),
              data: {
                url: n.data?.url ?? payload.url ?? payload.data?.url ?? '/',
                type: n.data?.type ?? payload.type ?? payload.data?.type,
                articleId: n.data?.articleId ?? payload.articleId ?? payload.data?.articleId,
                ...(n.data ?? payload.data ?? {}),
              },
            };

            console.log('✅ Notification finale:', JSON.stringify(notifData, null, 2));

            if ('actions' in Notification.prototype) {
              notifData.actions = n.actions ?? payload.actions ?? [
                { action: 'open',    title: '👀 Voir' },
                { action: 'dismiss', title: '✕ Fermer' },
              ];
            }

            if ('vibrate' in navigator) {
              notifData.vibrate = n.vibrate ?? payload.vibrate ?? [200, 100, 200];
            }
          } catch (parseErr) {
            console.error('❌ Erreur parsing notification:', parseErr);
            try { console.error('Raw data:', event.data?.text()); } catch { /* silencieux */ }
          }
        } else {
          console.warn('⚠️ Aucune donnée dans le push');
        }

        console.log('📤 Affichage notification —', notifData.title, '|', notifData.body);
        await self.registration.showNotification(notifData.title, notifData);
        console.log('✅ Notification affichée');

        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach((client) => {
          try {
            client.postMessage({
              type: 'PLAY_NOTIFICATION_SOUND',
              notification: { title: notifData.title, body: notifData.body },
            });
          } catch (err) {
            console.error('❌ Erreur postMessage son:', err);
          }
        });
      } catch (err) {
        console.error('❌ Erreur affichage notification:', err);
      }
    })(),
  );
});

self.addEventListener('notificationclick', (event: NotificationClickEvent) => {
  console.log('🖱️ Notification cliquée:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') return;

  const { url, articleId } = (event.notification.data ?? {}) as {
    url?: string;
    articleId?: string;
  };

  event.waitUntil(
    (async () => {
      const urlToOpen = articleId ? `/?article=${articleId}` : (url ?? '/');
      const fullUrl = new URL(urlToOpen, self.location.origin).href;

      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of clients) {
        if (client.url === fullUrl && 'focus' in client) {
          return (client as WindowClient).focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(fullUrl);
      }
    })(),
  );
});

// ============================================================================
// MESSAGES DES CLIENTS
// ============================================================================

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { type, payload } = (event.data ?? {}) as { type?: string; payload?: SyncAction };

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        (async () => {
          const names = await caches.keys();
          await Promise.all(names.map((n) => caches.delete(n)));
          console.log('🧹 Tous les caches supprimés');
        })(),
      );
      break;

    case 'GET_VERSION':
      if (event.ports?.[0]) {
        try {
          event.ports[0].postMessage({
            version: VERSION,
            support: SUPPORT,
            queueLength: syncQueue.queue.length,
          } satisfies SWVersionResponse);
        } catch (err) {
          console.error('❌ Erreur postMessage version:', err);
        }
      }
      break;

    case 'SYNC_ACTION':
      if (payload) event.waitUntil(syncQueue.add(payload));
      break;

    case 'FORCE_SYNC':
      event.waitUntil(syncQueue.processQueue());
      break;

    case 'GET_SYNC_QUEUE':
      if (event.ports?.[0]) {
        const safeQueue = syncQueue.queue.map(
          ({ id, action, timestamp, retries, maxRetries }) => ({
            id,
            type: action.type,
            timestamp,
            retries,
            maxRetries,
          }),
        );

        try {
          event.ports[0].postMessage({
            queue: safeQueue,
            processing: syncQueue.processing,
          } satisfies SWSyncQueueResponse);
        } catch (err) {
          console.error('❌ Erreur envoi queue:', err);
        }
      }
      break;
  }
});

// ============================================================================
// GESTION D'ERREURS GLOBALES
// ============================================================================

self.addEventListener('error', (event: ErrorEvent) => {
  console.error('❌ SW Error:', event.error);
});

self.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  console.error('❌ Unhandled Promise:', event.reason);
});

// ============================================================================

console.log(`✅ Service Worker v${VERSION} prêt pour la production!`);
console.log('📱 Notifications Push: ACTIVÉES ET CORRIGÉES');
console.log('🔄 Synchronisation optimiste: ACTIVÉE');
console.log('🔥 Fix IDBRequest Clone: APPLIQUÉ');
