// ============================================================================
// OPTIMISTIC SYNC PRODUCTION - WORLD CONNECT
// ============================================================================
// Version: 5.0.0 - Production Ready
// ============================================================================

'use strict';

// ============================================================================
// TYPES
// ============================================================================

type SyncActionType =
  | 'ADD_REACTION'
  | 'REMOVE_REACTION'
  | 'ADD_COMMENT'
  | 'DELETE_COMMENT';

type ReactionAction = 'add' | 'remove';

interface AddReactionPayload {
  articleId: string;
  userId: string;
  reactionType: string;
}

interface RemoveReactionPayload {
  articleId: string;
  reactionId: string;
  userId: string;
  reactionType: string;
}

interface AddCommentPayload {
  articleId: string;
  userId: string;
  content: string;
  tempId: string;
}

interface DeleteCommentPayload {
  commentId: string;
  articleId: string;
  userId: string;
}

type SyncPayloadData =
  | AddReactionPayload
  | RemoveReactionPayload
  | AddCommentPayload
  | DeleteCommentPayload;

interface SyncAction {
  type: SyncActionType;
  data: SyncPayloadData;
}

interface QueueItem {
  id: string;
  type: string;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

interface SWMessageSyncSuccess {
  type: 'SYNC_SUCCESS';
  action: SyncAction;
}

interface SWMessageSyncFailed {
  type: 'SYNC_FAILED';
  action: SyncAction;
  error: string;
}

interface SWMessageActivated {
  type: 'SW_ACTIVATED';
  version: string;
}

interface SWMessageSound {
  type: 'PLAY_NOTIFICATION_SOUND';
}

interface SWMessageQueueResponse {
  queue: QueueItem[];
  processing: boolean;
}

type SWIncomingMessage =
  | SWMessageSyncSuccess
  | SWMessageSyncFailed
  | SWMessageActivated
  | SWMessageSound;

interface OptimisticUser {
  id: string;
  token?: string;
  session?: { access_token: string };
}

interface PendingComment {
  id: string;
  article_id: string;
  texte: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  date_created: string;
  pending: boolean;
}

interface OptimisticManagers {
  sync: OptimisticSyncManager | null;
  reactions: OptimisticReactionManager | null;
  comments: OptimisticCommentManager | null;
}

interface OptimisticSyncNamespace {
  init: typeof initOptimisticSync;
  getManagers: typeof getOptimisticManagers;
  forceSync: typeof forceSyncQueue;
  checkQueue: typeof checkSyncQueueStatus;
  OptimisticSyncManager: typeof OptimisticSyncManager;
  OptimisticReactionManager: typeof OptimisticReactionManager;
  OptimisticCommentManager: typeof OptimisticCommentManager;
}

// Augmentation de window
declare global {
  interface Window {
    OptimisticSync?: OptimisticSyncNamespace;
    supabaseClient?: {
      supabase: {
        auth: {
          getSession(): Promise<{ data: { session: { access_token: string } | null } }>;
        };
        supabaseUrl?: string;
        supabaseKey?: string;
      };
      getCurrentUser(): Promise<OptimisticUser | null>;
    };
    ToastManager?: {
      error(title: string, message: string): void;
      success(title: string, message: string): void;
    };
  }
}

// ============================================================================
// OPTIMISTIC SYNC MANAGER
// ============================================================================

class OptimisticSyncManager {
  private supabaseUrl: string | null = null;
  private supabaseKey: string | null = null;
  private currentUser: OptimisticUser | null = null;
  public swReady = false;
  private pendingActions = new Map<string, SyncAction>();
  private retryQueue: Array<{ actionType: SyncActionType; data: SyncPayloadData }> = [];

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    console.log('🔄 Initialisation OptimisticSync v5.0.0...');

    if (!('serviceWorker' in navigator)) return;

    try {
      await navigator.serviceWorker.ready;
      this.swReady = true;
      console.log('✅ Service Worker prêt');
      this.listenToServiceWorker();
      await this.checkSyncQueue();
    } catch (err) {
      console.warn('⚠️ Service Worker non disponible:', err);
      this.swReady = false;
    }
  }

  configure(supabaseUrl: string, supabaseKey: string, currentUser: OptimisticUser): void {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.currentUser = currentUser;
    console.log('✅ OptimisticSync configuré pour:', currentUser?.id);
  }

  listenToServiceWorker(): void {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.addEventListener('message', (event: MessageEvent<SWIncomingMessage>) => {
      const msg = event.data;

      switch (msg.type) {
        case 'SYNC_SUCCESS':
          this.handleSyncSuccess(msg.action);
          break;

        case 'SYNC_FAILED':
          this.handleSyncFailure(msg.action, msg.error);
          break;

        case 'SW_ACTIVATED':
          console.log('🚀 Service Worker activé:', msg.version);
          this.swReady = true;
          break;

        case 'PLAY_NOTIFICATION_SOUND':
          this.playNotificationSound();
          break;
      }
    });
  }

  async checkSyncQueue(): Promise<QueueItem[]> {
    if (!this.swReady || !navigator.serviceWorker.controller) return [];

    const channel = new MessageChannel();

    return new Promise<QueueItem[]>((resolve) => {
      channel.port1.onmessage = (event: MessageEvent<SWMessageQueueResponse>) => {
        const { queue, processing } = event.data;
        console.log(`📊 Queue: ${queue.length} action(s), processing: ${processing}`);
        resolve(queue);
      };

      navigator.serviceWorker.controller!.postMessage(
        { type: 'GET_SYNC_QUEUE' },
        [channel.port2],
      );
    });
  }

  async sendToServiceWorker(actionType: SyncActionType, data: SyncPayloadData): Promise<boolean> {
    if (!this.swReady || !navigator.serviceWorker.controller) {
      console.warn('⚠️ SW non disponible, ajout à la queue locale');
      this.retryQueue.push({ actionType, data });
      return false;
    }

    let userToken: string | undefined =
      this.currentUser?.token ??
      this.currentUser?.session?.access_token;

    if (!userToken && window.supabaseClient) {
      try {
        const { data: { session } } = await window.supabaseClient.supabase.auth.getSession();
        if (session) userToken = session.access_token;
      } catch (err) {
        console.error('❌ Erreur récupération token:', err);
      }
    }

    if (!userToken) {
      console.error('❌ Token manquant');
      return false;
    }

    try {
      navigator.serviceWorker.controller!.postMessage({
        type: 'SYNC_ACTION',
        payload: {
          type: actionType,
          data: {
            supabaseUrl: this.supabaseUrl,
            supabaseKey: this.supabaseKey,
            userToken,
            ...data,
          },
        },
      });

      console.log('📤 Action envoyée au SW:', actionType);
      return true;
    } catch (err) {
      console.error('❌ Erreur envoi au SW:', err);
      return false;
    }
  }

  handleSyncSuccess(action: SyncAction): void {
    console.log('✅ Synchronisation réussie:', action.type);

    const payload = action.data as Partial<AddReactionPayload>;
    const pendingKey = `${action.type}_${payload.articleId ?? ''}_${Date.now()}`;
    this.pendingActions.delete(pendingKey);

    window.dispatchEvent(new CustomEvent('optimistic-sync-success', { detail: { action } }));
  }

  handleSyncFailure(action: SyncAction, error: string): void {
    console.error('❌ Échec synchronisation:', action.type, error);

    this.revertOptimisticUpdate(action);

    window.dispatchEvent(new CustomEvent('optimistic-sync-failed', { detail: { action, error } }));

    window.ToastManager?.error('Synchronisation échouée', 'Vérifiez votre connexion');
  }

  private revertOptimisticUpdate(action: SyncAction): void {
    const data = action.data as Partial<AddReactionPayload & RemoveReactionPayload & AddCommentPayload>;

    switch (action.type) {
      case 'ADD_REACTION':
        this.revertReaction(data.articleId!, data.reactionType!, 'add');
        break;
      case 'REMOVE_REACTION':
        this.revertReaction(data.articleId!, data.reactionType!, 'remove');
        break;
      case 'ADD_COMMENT':
        this.revertComment(data.articleId!, data.tempId!);
        break;
    }
  }

  private revertReaction(articleId: string, reactionType: string, originalAction: ReactionAction): void {
    const post = document.querySelector<HTMLElement>(`[data-article-id="${articleId}"]`);
    if (!post) return;

    const btn = post.querySelector<HTMLElement>(`[onclick*="${reactionType}"]`);
    if (!btn) return;

    const span = btn.querySelector<HTMLElement>('span');
    if (!span) return;

    let count = parseInt(span.textContent ?? '0', 10) || 0;

    if (originalAction === 'add') {
      span.textContent = String(Math.max(0, count - 1));
      btn.classList.remove('active');
    } else {
      span.textContent = String(count + 1);
      btn.classList.add('active');
    }
  }

  private revertComment(articleId: string, tempId: string): void {
    const el = document.querySelector<HTMLElement>(`[data-temp-id="${tempId}"]`);
    if (!el) return;

    el.classList.add('opacity-0', 'transition-opacity');
    setTimeout(() => el.remove(), 300);
  }

  async forceSyncQueue(): Promise<boolean> {
    if (!this.swReady || !navigator.serviceWorker.controller) {
      console.warn('⚠️ SW non disponible');
      return false;
    }

    console.log('🔄 Forçage synchronisation...');
    navigator.serviceWorker.controller.postMessage({ type: 'FORCE_SYNC' });
    return true;
  }

  playNotificationSound(): void {
    try {
      const audio = new Audio(
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWm98OScTgwOUKvo87hlHQU7k9n0yX0xBSh+zPLaizsKGGS56+mjUBELTKXh8bllHQU7k9n0yH0wBSh+zPLaizsKGGS56+mjUBELTKXh8bllHQU7k9n0yH0wBSh+zPLaizsKGGS56+mjUBELTKXh8Q==',
      );
      audio.volume = 0.3;
      audio.play().catch(() => console.log('Son désactivé'));
    } catch {
      console.log('Son non disponible');
    }
  }
}

// ============================================================================
// OPTIMISTIC REACTION MANAGER
// ============================================================================

class OptimisticReactionManager {
  private syncManager: OptimisticSyncManager;

  constructor(syncManager: OptimisticSyncManager) {
    this.syncManager = syncManager;
  }

  async addReaction(articleId: string, reactionType: string, userId: string): Promise<void> {
    this.updateUIInstantly(articleId, reactionType, 'add');

    const sent = await this.syncManager.sendToServiceWorker('ADD_REACTION', {
      articleId,
      userId,
      reactionType,
    });

    if (!sent) console.warn('⚠️ Réaction en attente');
  }

  async removeReaction(
    articleId: string,
    reactionId: string,
    reactionType: string,
    userId: string,
  ): Promise<void> {
    this.updateUIInstantly(articleId, reactionType, 'remove');

    const sent = await this.syncManager.sendToServiceWorker('REMOVE_REACTION', {
      articleId,
      reactionId,
      userId,
      reactionType,
    });

    if (!sent) console.warn('⚠️ Suppression en attente');
  }

  private updateUIInstantly(articleId: string, reactionType: string, action: ReactionAction): void {
    const post = document.querySelector<HTMLElement>(`[data-article-id="${articleId}"]`);
    if (!post) return;

    const btn = post.querySelector<HTMLElement>(`[onclick*="${reactionType}"]`);
    if (!btn) return;

    const span = btn.querySelector<HTMLElement>('span');
    if (!span) return;

    let count = parseInt(span.textContent ?? '0', 10) || 0;

    if (action === 'add') {
      span.textContent = String(count + 1);
      btn.classList.add('active', 'animate-bounce');
      setTimeout(() => btn.classList.remove('animate-bounce'), 600);
    } else {
      span.textContent = String(Math.max(0, count - 1));
      btn.classList.remove('active');
    }

    span.style.transform = 'scale(1.3)';
    span.style.fontWeight = 'bold';
    setTimeout(() => {
      span.style.transform = 'scale(1)';
      span.style.fontWeight = '';
    }, 200);
  }
}

// ============================================================================
// OPTIMISTIC COMMENT MANAGER
// ============================================================================

class OptimisticCommentManager {
  private syncManager: OptimisticSyncManager;

  constructor(syncManager: OptimisticSyncManager) {
    this.syncManager = syncManager;
  }

  async addComment(
    articleId: string,
    content: string,
    userId: string,
    userName: string,
    userAvatar?: string,
  ): Promise<void> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    this.displayCommentInstantly({
      id: tempId,
      article_id: articleId,
      texte: content,
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar,
      date_created: new Date().toISOString(),
      pending: true,
    });

    const sent = await this.syncManager.sendToServiceWorker('ADD_COMMENT', {
      articleId,
      userId,
      content,
      tempId,
    });

    if (!sent) console.warn('⚠️ Commentaire en attente');
  }

  async deleteComment(commentId: string, articleId: string, userId: string): Promise<void> {
    const el = document.querySelector<HTMLElement>(`[data-comment-id="${commentId}"]`);
    if (el) {
      el.style.opacity = '0.5';
      el.style.pointerEvents = 'none';
    }

    const sent = await this.syncManager.sendToServiceWorker('DELETE_COMMENT', {
      commentId,
      articleId,
      userId,
    });

    if (sent && el) {
      setTimeout(() => el.remove(), 300);
    }
  }

  private displayCommentInstantly(comment: PendingComment): void {
    const post = document.querySelector<HTMLElement>(`[data-article-id="${comment.article_id}"]`);
    if (!post) return;

    const container = post.querySelector<HTMLElement>(`#comments-${comment.article_id}`);
    if (!container) return;

    const html = `
      <div class="comment ${comment.pending ? 'opacity-70' : ''}"
           data-comment-id="${comment.id}"
           data-temp-id="${comment.pending ? comment.id : ''}"
           style="padding:12px;border-bottom:1px solid var(--border-color);animation:slideInUp 0.3s ease;">
        <div style="display:flex;gap:12px;">
          <img src="${comment.user_avatar ?? '/default-avatar.png'}"
               alt="${this.escapeHtml(comment.user_name)}"
               style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
          <div style="flex:1;">
            <div style="background:var(--bg-primary);border-radius:12px;padding:10px 14px;">
              <p style="font-weight:700;font-size:14px;margin-bottom:4px;color:var(--text-primary);">
                ${this.escapeHtml(comment.user_name)}
              </p>
              <p style="font-size:14px;line-height:1.5;color:var(--text-primary);">
                ${this.escapeHtml(comment.texte)}
              </p>
            </div>
            <div style="margin-top:6px;font-size:12px;color:var(--text-tertiary);display:flex;gap:8px;">
              <span>À l'instant</span>
              ${comment.pending ? '<span style="color:#f59e0b;">⏳ Envoi...</span>' : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('afterbegin', html);
    container.firstElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ============================================================================
// SINGLETONS
// ============================================================================

let optimisticSync: OptimisticSyncManager | null = null;
let reactionManager: OptimisticReactionManager | null = null;
let commentManager: OptimisticCommentManager | null = null;

// ============================================================================
// API PUBLIQUE
// ============================================================================

async function initOptimisticSync(
  supabaseUrl: string,
  supabaseKey: string,
  currentUser: OptimisticUser,
): Promise<OptimisticSyncManager> {
  if (!optimisticSync) {
    optimisticSync = new OptimisticSyncManager();
    await optimisticSync.init();
  }

  if (supabaseUrl && supabaseKey && currentUser) {
    optimisticSync.configure(supabaseUrl, supabaseKey, currentUser);
    reactionManager = new OptimisticReactionManager(optimisticSync);
    commentManager  = new OptimisticCommentManager(optimisticSync);
    console.log('✅ OptimisticSync v5.0.0 prêt');
  }

  return optimisticSync;
}

function getOptimisticManagers(): OptimisticManagers {
  return { sync: optimisticSync, reactions: reactionManager, comments: commentManager };
}

async function forceSyncQueue(): Promise<boolean> {
  return optimisticSync ? optimisticSync.forceSyncQueue() : false;
}

async function checkSyncQueueStatus(): Promise<QueueItem[]> {
  return optimisticSync ? optimisticSync.checkSyncQueue() : [];
}

// ============================================================================
// ÉVÉNEMENTS GLOBAUX
// ============================================================================

window.addEventListener('online', async () => {
  console.log('🌐 Connexion rétablie - Sync...');
  await forceSyncQueue();
});

window.addEventListener('offline', () => {
  console.log('📡 Hors ligne - Actions seront synchronisées');
});

window.addEventListener('optimistic-sync-success', (event: Event) => {
  const { action } = (event as CustomEvent<{ action: SyncAction }>).detail;
  console.log('✅ Sync réussie:', action);
});

window.addEventListener('optimistic-sync-failed', (event: Event) => {
  const { action } = (event as CustomEvent<{ action: SyncAction; error: string }>).detail;
  console.error('❌ Sync échouée:', action);
});

// ============================================================================
// EXPOSITION SUR WINDOW
// ============================================================================

window.OptimisticSync = {
  init: initOptimisticSync,
  getManagers: getOptimisticManagers,
  forceSync: forceSyncQueue,
  checkQueue: checkSyncQueueStatus,
  OptimisticSyncManager,
  OptimisticReactionManager,
  OptimisticCommentManager,
};

// ============================================================================
// AUTO-INITIALISATION
// ============================================================================

if (window.supabaseClient) {
  (async () => {
    const { supabase, getCurrentUser } = window.supabaseClient!;

    if (!supabase) return;

    const currentUser = await getCurrentUser();
    const supabaseUrl = supabase.supabaseUrl ?? '';
    const supabaseKey = supabase.supabaseKey ?? '';

    if (currentUser) {
      await initOptimisticSync(supabaseUrl, supabaseKey, currentUser);
    }
  })();
}

console.log('✅ optimistic-sync.ts v5.0.0 chargé');

// ============================================================================
// EXPORTS ES MODULE
// ============================================================================

export {
  OptimisticSyncManager,
  OptimisticReactionManager,
  OptimisticCommentManager,
  initOptimisticSync,
  getOptimisticManagers,
  forceSyncQueue,
  checkSyncQueueStatus,
};

export type {
  SyncActionType,
  SyncAction,
  SyncPayloadData,
  AddReactionPayload,
  RemoveReactionPayload,
  AddCommentPayload,
  DeleteCommentPayload,
  OptimisticUser,
  OptimisticManagers,
  QueueItem,
  PendingComment,
};
