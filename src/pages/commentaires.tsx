// ============================================================================
// WORLD CONNECT - COMMENTAIRES.TSX
// Converti depuis commentaires.js — Version 3.0.0
// Widget commentaires : Edition + Admin + Modal + Vue SQL
// ============================================================================

'use strict';

// ============================================================================
// TYPES
// ============================================================================

interface UserProfile {
  prenom: string;
  nom: string;
  role: string;
}

interface SupabaseUser {
  id: string;
}

interface Comment {
  session_id: string;
  prenom_acteur: string;
  nom_acteur: string;
  texte: string;
  date_created: string;
  acteur_id: string;
  article_id: string;
}

interface Reply {
  reponse_id: string;
  session_id: string;
  prenom_acteur: string;
  nom_acteur: string;
  texte: string;
  date_created: string;
  acteur_id: string;
}

interface SupabaseQueryResult<T> {
  data: T;
  error: { message: string; code?: string } | null;
}

interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
  channel: (name: string) => SupabaseChannel;
  removeChannel: (channel: SupabaseChannel) => void;
}

interface SupabaseQueryBuilder {
  select: (cols?: string) => SupabaseQueryBuilder;
  insert: (data: object | object[]) => Promise<SupabaseQueryResult<unknown>>;
  update: (data: object) => SupabaseQueryBuilder;
  delete: () => SupabaseQueryBuilder;
  eq: (col: string, val: unknown) => SupabaseQueryBuilder;
  order: (col: string, opts?: object) => Promise<SupabaseQueryResult<unknown[]>>;
  single: () => Promise<SupabaseQueryResult<{ texte: string } | null>>;
}

interface SupabaseChannel {
  on: (event: string, filter: object, cb: (payload: unknown) => void) => SupabaseChannel;
  subscribe: (cb?: (status: string) => void) => SupabaseChannel;
}

type ToastType = 'success' | 'error' | 'warning' | 'info';

declare global {
  interface Window {
    supabaseClient: {
      supabase: SupabaseClient;
      getCurrentUser: () => Promise<SupabaseUser | null>;
      getUserProfile: (id: string) => Promise<UserProfile | null>;
    };
    ToastManager?: {
      success: (title: string, msg: string) => void;
      error: (title: string, msg: string) => void;
      warning: (title: string, msg: string) => void;
      info: (title: string, msg: string) => void;
    };
    CommentsWidget: typeof CommentsWidget;
    loadComments?: (articleId: string, container: HTMLElement) => void;
    submitComment?: (articleId: string) => void;
    submitReply?: (parentId: string, articleId: string) => void;
    deleteComment?: (commentId: string, articleId: string) => void;
    toggleReplyBox?: (commentId: string) => void;
  }
}

// ============================================================================
// CSS DU WIDGET
// ============================================================================

const COMMENTS_STYLES = `
  .comments-widget { padding: 20px; background: var(--bg-secondary); }

  .comments-header { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid var(--border-color); }

  .comments-title { font-size: 18px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
  .comments-title i { color: var(--accent-blue); }

  .comments-login-prompt { text-align: center; padding: 40px 20px; background: var(--bg-primary); border-radius: 16px; margin-bottom: 20px; }
  .comments-login-prompt i { font-size: 48px; color: var(--text-tertiary); margin-bottom: 16px; display: block; }
  .comments-login-prompt p { color: var(--text-secondary); margin-bottom: 20px; font-size: 15px; }

  .login-btn { padding: 12px 24px; background: var(--accent-kaki); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(107,114,73,0.3); }
  .login-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(107,114,73,0.5); }

  .comment-input-box, .reply-input-box { display: flex; gap: 12px; margin-bottom: 24px; padding: 16px; background: var(--bg-primary); border-radius: 16px; }

  .comment-input-avatar, .reply-input-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px; flex-shrink: 0; }
  .reply-input-avatar { width: 40px; height: 40px; font-size: 16px; }

  .comment-input-wrapper, .reply-input-wrapper { flex: 1; display: flex; flex-direction: column; gap: 10px; }

  .comment-input, .reply-input { width: 100%; padding: 12px 16px; border: 2px solid var(--border-color); border-radius: 12px; font-family: inherit; font-size: 14px; color: var(--text-primary); background: var(--bg-secondary); resize: vertical; transition: all 0.3s ease; }
  .comment-input:focus, .reply-input:focus { outline: none; border-color: var(--accent-blue); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

  .comment-submit-btn, .reply-submit-btn { align-self: flex-end; padding: 10px 20px; background: var(--accent-kaki); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.3s ease; box-shadow: 0 3px 10px rgba(107,114,73,0.3); }
  .comment-submit-btn:hover, .reply-submit-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(107,114,73,0.5); }

  .comments-empty { text-align: center; padding: 60px 20px; color: var(--text-tertiary); }
  .comments-empty i { font-size: 64px; margin-bottom: 16px; opacity: 0.5; display: block; }

  .comments-list { display: flex; flex-direction: column; gap: 16px; }

  .comment-item { padding: 16px; background: var(--bg-primary); border-radius: 16px; border-left: 4px solid var(--accent-blue); transition: all 0.3s ease; }
  .comment-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateX(4px); }

  .comment-main { display: flex; gap: 12px; }

  .comment-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px; flex-shrink: 0; }

  .comment-content { flex: 1; min-width: 0; }

  .comment-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .comment-author { font-weight: 700; font-size: 15px; color: var(--text-primary); }
  .comment-date { font-size: 13px; color: var(--text-tertiary); }

  .comment-text { color: var(--text-primary); line-height: 1.6; font-size: 14px; margin-bottom: 10px; word-wrap: break-word; }

  .comment-actions { display: flex; gap: 16px; flex-wrap: wrap; }

  .comment-action-btn { background: none; border: none; color: var(--accent-blue); cursor: pointer; font-size: 13px; font-weight: 600; padding: 6px 0; transition: all 0.3s ease; }
  .comment-action-btn:hover { color: var(--accent-cyan); transform: scale(1.05); }
  .comment-action-btn.edit-btn { color: var(--accent-purple); }
  .comment-action-btn.edit-btn:hover { color: var(--accent-pink); }
  .comment-action-btn.delete-btn { color: var(--accent-red); }
  .comment-action-btn.delete-btn:hover { color: #dc2626; }

  .reply-input-box { margin: 12px 0 0 60px; padding: 12px; }

  .replies-list { margin-top: 16px; margin-left: 60px; padding-left: 20px; border-left: 3px solid var(--border-color); display: flex; flex-direction: column; gap: 12px; }

  .reply-item { display: flex; gap: 10px; padding: 12px; background: var(--bg-secondary); border-radius: 12px; transition: all 0.3s ease; }
  .reply-item:hover { background: var(--bg-primary); transform: translateX(4px); }

  .reply-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; flex-shrink: 0; }

  .reply-content { flex: 1; min-width: 0; }
  .reply-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .reply-author { font-weight: 600; font-size: 14px; color: var(--text-primary); }
  .reply-date { font-size: 12px; color: var(--text-tertiary); }
  .reply-text { color: var(--text-primary); line-height: 1.5; font-size: 13px; word-wrap: break-word; margin-bottom: 8px; }

  .reply-actions { display: flex; gap: 12px; flex-wrap: wrap; }
  .reply-action-btn { background: none; border: none; color: var(--accent-blue); cursor: pointer; font-size: 12px; font-weight: 600; padding: 4px 0; transition: all 0.3s ease; }
  .reply-action-btn:hover { color: var(--accent-cyan); transform: scale(1.05); }
  .reply-action-btn.edit-btn { color: var(--accent-purple); }
  .reply-action-btn.edit-btn:hover { color: var(--accent-pink); }
  .reply-action-btn.delete-btn { color: var(--accent-red); }
  .reply-action-btn.delete-btn:hover { color: #dc2626; }

  .comments-loader { text-align: center; padding: 40px; }
  .comments-error { text-align: center; padding: 40px 20px; color: var(--text-tertiary); }
  .comments-error i { font-size: 48px; color: var(--accent-red); margin-bottom: 16px; display: block; }

  .retry-btn { margin-top: 16px; padding: 10px 20px; background: var(--accent-kaki); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; }
  .retry-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(107,114,73,0.4); }

  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15,23,42,0.8); backdrop-filter: blur(8px); z-index: 9998; display: none; opacity: 0; transition: opacity 0.3s ease; }
  .modal-overlay.show { display: block; opacity: 1; }

  .edit-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) scale(0.9); background: var(--bg-secondary); border-radius: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.3); z-index: 9999; max-width: 600px; width: 90%; padding: 32px; display: none; opacity: 0; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
  .edit-modal.show { display: block; opacity: 1; transform: translate(-50%,-50%) scale(1); }

  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .modal-title { font-size: 22px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
  .modal-title i { color: var(--accent-purple); }

  .modal-close-btn { background: none; border: none; font-size: 24px; color: var(--text-tertiary); cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; }
  .modal-close-btn:hover { background: var(--bg-primary); color: var(--text-primary); transform: rotate(90deg); }

  .modal-body { margin-bottom: 24px; }

  .modal-textarea { width: 100%; min-height: 150px; padding: 16px; border: 2px solid var(--border-color); border-radius: 16px; font-family: inherit; font-size: 15px; color: var(--text-primary); background: var(--bg-primary); resize: vertical; transition: all 0.3s ease; }
  .modal-textarea:focus { outline: none; border-color: var(--accent-purple); box-shadow: 0 0 0 4px rgba(124,58,237,0.1); }

  .modal-footer { display: flex; gap: 12px; justify-content: flex-end; }

  .modal-btn { padding: 12px 24px; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 15px; transition: all 0.3s ease; font-family: inherit; }
  .modal-cancel-btn { background: var(--bg-primary); color: var(--text-primary); }
  .modal-cancel-btn:hover { background: var(--border-color); }
  .modal-save-btn { background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); color: white; box-shadow: 0 4px 12px rgba(124,58,237,0.4); }
  .modal-save-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124,58,237,0.6); }

  @media (max-width: 768px) {
    .comment-item { padding: 12px; }
    .replies-list { margin-left: 40px; padding-left: 12px; }
    .reply-input-box { margin-left: 40px; }
    .comment-avatar { width: 40px; height: 40px; font-size: 16px; }
    .reply-avatar { width: 32px; height: 32px; font-size: 13px; }
    .comment-input-avatar, .reply-input-avatar { width: 40px; height: 40px; font-size: 16px; }
    .edit-modal { padding: 24px; width: 95%; }
    .modal-title { font-size: 18px; }
    .modal-textarea { min-height: 120px; }
  }
`;

// ============================================================================
// WIDGET COMMENTAIRES
// ============================================================================

const CommentsWidget = {
  supabaseInstance: null as SupabaseClient | null,
  currentUser: null as SupabaseUser | null,
  userProfile: null as UserProfile | null,
  realtimeChannels: new Map<string, SupabaseChannel>(),

  // ============================================================================
  // INITIALISATION
  // ============================================================================

  async init(): Promise<boolean> {
    console.log('🔄 [CommentsWidget v3.0] Initialisation...');

    if (!window.supabaseClient) {
      console.error('❌ [CommentsWidget] supabaseClient non disponible');
      return false;
    }

    this.supabaseInstance = window.supabaseClient.supabase;
    this.currentUser = await window.supabaseClient.getCurrentUser();

    if (this.currentUser) {
      this.userProfile = await window.supabaseClient.getUserProfile(this.currentUser.id);
      console.log('👤 [CommentsWidget] Utilisateur:', {
        id: this.currentUser.id,
        nom: `${this.userProfile?.prenom} ${this.userProfile?.nom}`,
        role: this.userProfile?.role,
      });
    }

    console.log('✅ [CommentsWidget] Initialisé');
    return true;
  },

  // ============================================================================
  // CHARGEMENT DES COMMENTAIRES
  // ============================================================================

  async loadComments(articleId: string, container: HTMLElement): Promise<void> {
    if (!this.supabaseInstance) await this.init();

    container.innerHTML = '<div class="comments-loader"><div class="spinner"></div></div>';

    try {
      console.log('📥 [CommentsWidget] Chargement commentaires:', articleId);

      const { data: comments, error: commentError } = await this.supabaseInstance!
        .from('comments_with_actor_info')
        .select('*')
        .eq('article_id', articleId)
        .order('date_created', { ascending: false }) as SupabaseQueryResult<Comment[]>;

      if (commentError) throw commentError;

      const { data: allReplies, error: replyError } = await this.supabaseInstance!
        .from('replies_with_actor_info')
        .select('*')
        .order('date_created', { ascending: true }) as SupabaseQueryResult<Reply[]>;

      if (replyError) throw replyError;

      const commentIds = comments.map((c) => c.session_id);
      const replies = allReplies.filter((r) => commentIds.includes(r.session_id));

      console.log('✅ [CommentsWidget] Données chargées:', {
        comments: comments?.length ?? 0,
        replies: replies?.length ?? 0,
      });

      this.renderComments(container, articleId, comments ?? [], replies ?? []);
      this.setupRealtime(articleId, container);

    } catch (error) {
      console.error('❌ [CommentsWidget] Erreur chargement:', error);
      container.innerHTML = `
        <div class="comments-error">
          <i class="fas fa-exclamation-circle"></i>
          <p>Erreur de chargement des commentaires</p>
          <button onclick="CommentsWidget.loadComments('${articleId}', document.getElementById('comments-${articleId}'))"
            class="retry-btn">
            <i class="fas fa-sync-alt"></i> Réessayer
          </button>
        </div>
      `;
    }
  },

  // ============================================================================
  // RENDU HTML
  // ============================================================================

  renderComments(
    container: HTMLElement,
    articleId: string,
    comments: Comment[],
    allReplies: Reply[]
  ): void {
    const repliesByComment: Record<string, Reply[]> = {};
    allReplies.forEach((reply) => {
      const pid = reply.session_id;
      if (!repliesByComment[pid]) repliesByComment[pid] = [];
      repliesByComment[pid].push(reply);
    });

    let html = `
      <div class="comments-widget">
        <div class="comments-header">
          <h4 class="comments-title">
            <i class="fas fa-comments"></i>
            Commentaires (${comments.length})
          </h4>
        </div>
    `;

    if (!this.currentUser || !this.userProfile) {
      html += `
        <div class="comments-login-prompt">
          <i class="fas fa-lock"></i>
          <p>Connectez-vous pour commenter</p>
          <button onclick="window.location.href='connexion.tsx'" class="login-btn">
            <i class="fas fa-sign-in-alt"></i> Se connecter
          </button>
        </div>
      `;
    } else {
      const initials = this.getInitials(this.userProfile.prenom, this.userProfile.nom);
      html += `
        <div class="comment-input-box">
          <div class="comment-input-avatar">${initials}</div>
          <div class="comment-input-wrapper">
            <textarea
              id="comment-input-${articleId}"
              class="comment-input"
              placeholder="Écrivez votre commentaire..."
              rows="3"></textarea>
            <button onclick="CommentsWidget.submitComment('${articleId}')" class="comment-submit-btn">
              <i class="fas fa-paper-plane"></i> Envoyer
            </button>
          </div>
        </div>
      `;
    }

    if (comments.length === 0) {
      html += `
        <div class="comments-empty">
          <i class="fas fa-comment-slash"></i>
          <p>Soyez le premier à commenter !</p>
        </div>
      `;
    } else {
      html += '<div class="comments-list">';
      comments.forEach((comment) => {
        html += this.renderComment(comment, repliesByComment[comment.session_id] ?? [], articleId);
      });
      html += '</div>';
    }

    html += '</div>';

    this.injectStyles();
    this.injectModal();
    container.innerHTML = html;
  },

  renderComment(comment: Comment, replies: Reply[], articleId: string): string {
    const commentId = comment.session_id;
    const prenom = comment.prenom_acteur || 'Utilisateur';
    const nom = comment.nom_acteur || '';
    const initials = this.getInitials(prenom, nom);

    const isMyComment = this.currentUser?.id === comment.acteur_id;
    const isAdmin = this.userProfile?.role === 'admin';
    const canModify = isMyComment;
    const canDelete = isMyComment || isAdmin;

    const userInitials = this.userProfile
      ? this.getInitials(this.userProfile.prenom, this.userProfile.nom)
      : '';

    return `
      <div class="comment-item" id="comment-${commentId}" data-comment-id="${commentId}">
        <div class="comment-main">
          <div class="comment-avatar">${initials}</div>
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">${this.escapeHtml(prenom)} ${this.escapeHtml(nom)}</span>
              <span class="comment-date">${this.formatDate(comment.date_created)}</span>
            </div>
            <div class="comment-text">${this.escapeHtml(comment.texte)}</div>
            <div class="comment-actions">
              ${this.currentUser ? `
                <button class="comment-action-btn" onclick="CommentsWidget.toggleReplyBox('${commentId}')">
                  <i class="fas fa-reply"></i> Répondre
                </button>
              ` : ''}
              ${canModify ? `
                <button class="comment-action-btn edit-btn" onclick="CommentsWidget.openEditModal('comment','${commentId}','${articleId}')">
                  <i class="fas fa-edit"></i> Modifier
                </button>
              ` : ''}
              ${canDelete ? `
                <button class="comment-action-btn delete-btn" onclick="CommentsWidget.deleteComment('${commentId}','${articleId}')">
                  <i class="fas fa-trash"></i> Supprimer
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        ${this.currentUser ? `
          <div id="reply-box-${commentId}" class="reply-input-box" style="display:none;">
            <div class="reply-input-avatar">${userInitials}</div>
            <div class="reply-input-wrapper">
              <textarea
                id="reply-input-${commentId}"
                class="reply-input"
                placeholder="Votre réponse..."
                rows="2"></textarea>
              <button onclick="CommentsWidget.submitReply('${commentId}','${articleId}')" class="reply-submit-btn">
                <i class="fas fa-paper-plane"></i> Répondre
              </button>
            </div>
          </div>
        ` : ''}

        ${replies.length > 0 ? `
          <div class="replies-list">
            ${replies.map((r) => this.renderReply(r, articleId)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  renderReply(reply: Reply, articleId: string): string {
    const prenom = reply.prenom_acteur || 'Utilisateur';
    const nom = reply.nom_acteur || '';
    const initials = this.getInitials(prenom, nom);

    const isMyReply = this.currentUser?.id === reply.acteur_id;
    const isAdmin = this.userProfile?.role === 'admin';
    const canModify = isMyReply;
    const canDelete = isMyReply || isAdmin;

    return `
      <div class="reply-item" id="reply-${reply.reponse_id}">
        <div class="reply-avatar">${initials}</div>
        <div class="reply-content">
          <div class="reply-header">
            <span class="reply-author">${this.escapeHtml(prenom)} ${this.escapeHtml(nom)}</span>
            <span class="reply-date">${this.formatDate(reply.date_created)}</span>
          </div>
          <div class="reply-text">${this.escapeHtml(reply.texte)}</div>
          ${(canModify || canDelete) ? `
            <div class="reply-actions">
              ${canModify ? `
                <button class="reply-action-btn edit-btn" onclick="CommentsWidget.openEditModal('reply','${reply.reponse_id}','${articleId}')">
                  <i class="fas fa-edit"></i> Modifier
                </button>
              ` : ''}
              ${canDelete ? `
                <button class="reply-action-btn delete-btn" onclick="CommentsWidget.deleteReply('${reply.reponse_id}','${articleId}')">
                  <i class="fas fa-trash"></i> Supprimer
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // ============================================================================
  // ACTIONS — CRÉATION
  // ============================================================================

  async submitComment(articleId: string): Promise<void> {
    if (!this.currentUser || !this.userProfile) {
      this.showToast('Connexion requise', 'error');
      return;
    }

    const input = document.getElementById(`comment-input-${articleId}`) as HTMLTextAreaElement;
    const texte = input?.value.trim();

    if (!texte) { this.showToast('Le commentaire ne peut pas être vide', 'warning'); return; }

    try {
      const { error } = await this.supabaseInstance!
        .from('sessions_commentaires')
        .insert([{ article_id: articleId, user_id: this.currentUser.id, texte }]);

      if (error) throw error;

      input.value = '';
      this.showToast('Commentaire publié', 'success');
      const container = document.getElementById(`comments-${articleId}`);
      if (container) this.loadComments(articleId, container);

    } catch (error) {
      console.error('❌ [CommentsWidget] Erreur envoi commentaire:', error);
      this.showToast("Erreur lors de l'envoi", 'error');
    }
  },

  async submitReply(parentId: string, articleId: string): Promise<void> {
    if (!this.currentUser || !this.userProfile) {
      this.showToast('Connexion requise', 'error');
      return;
    }

    const input = document.getElementById(`reply-input-${parentId}`) as HTMLTextAreaElement;
    const texte = input?.value.trim();

    if (!texte) { this.showToast('La réponse ne peut pas être vide', 'warning'); return; }

    try {
      const { error } = await this.supabaseInstance!
        .from('session_reponses')
        .insert([{ session_id: parentId, user_id: this.currentUser.id, texte }]);

      if (error) throw error;

      input.value = '';
      this.toggleReplyBox(parentId);
      this.showToast('Réponse publiée', 'success');
      const container = document.getElementById(`comments-${articleId}`);
      if (container) this.loadComments(articleId, container);

    } catch (error) {
      console.error('❌ [CommentsWidget] Erreur envoi réponse:', error);
      this.showToast("Erreur lors de l'envoi", 'error');
    }
  },

  // ============================================================================
  // ACTIONS — MODIFICATION (MODAL)
  // ============================================================================

  async openEditModal(type: 'comment' | 'reply', id: string, articleId: string): Promise<void> {
    const modal       = document.getElementById('edit-modal');
    const overlay     = document.getElementById('modal-overlay');
    const modalTitle  = document.getElementById('modal-title');
    const modalTA     = document.getElementById('modal-textarea') as HTMLTextAreaElement;
    const saveBtn     = document.getElementById('modal-save-btn');

    if (!modal || !overlay || !modalTitle || !modalTA || !saveBtn) {
      console.error('❌ [CommentsWidget] Éléments modal introuvables');
      return;
    }

    try {
      let currentText = '';

      if (type === 'comment') {
        const { data, error } = await this.supabaseInstance!
          .from('comments_with_actor_info')
          .select('texte')
          .eq('session_id', id)
          .single();
        if (error) throw error;
        currentText = data?.texte ?? '';
        modalTitle.textContent = 'Modifier le commentaire';
      } else {
        const { data, error } = await this.supabaseInstance!
          .from('replies_with_actor_info')
          .select('texte')
          .eq('reponse_id', id)
          .single();
        if (error) throw error;
        currentText = data?.texte ?? '';
        modalTitle.textContent = 'Modifier la réponse';
      }

      modalTA.value = currentText;
      (saveBtn as HTMLButtonElement).onclick = () => this.saveEdit(type, id, articleId);
      overlay.classList.add('show');
      modal.classList.add('show');
      modalTA.focus();

    } catch (error) {
      console.error('❌ [CommentsWidget] Erreur ouverture modal:', error);
      this.showToast('Erreur de chargement', 'error');
    }
  },

  closeEditModal(): void {
    document.getElementById('edit-modal')?.classList.remove('show');
    document.getElementById('modal-overlay')?.classList.remove('show');
  },

  async saveEdit(type: 'comment' | 'reply', id: string, articleId: string): Promise<void> {
    const modalTA = document.getElementById('modal-textarea') as HTMLTextAreaElement;
    const newText = modalTA?.value.trim();

    if (!newText) { this.showToast('Le texte ne peut pas être vide', 'warning'); return; }

    try {
      if (type === 'comment') {
        const { error } = await this.supabaseInstance!
          .from('sessions_commentaires')
          .update({ texte: newText })
          .eq('session_id', id)
          .eq('user_id', this.currentUser!.id);
        if (error) throw error;
        this.showToast('Commentaire modifié', 'success');
      } else {
        const { error } = await this.supabaseInstance!
          .from('session_reponses')
          .update({ texte: newText })
          .eq('reponse_id', id)
          .eq('user_id', this.currentUser!.id);
        if (error) throw error;
        this.showToast('Réponse modifiée', 'success');
      }

      this.closeEditModal();
      const container = document.getElementById(`comments-${articleId}`);
      if (container) this.loadComments(articleId, container);

    } catch (error) {
      console.error('❌ [CommentsWidget] Erreur sauvegarde:', error);
      this.showToast('Erreur lors de la modification', 'error');
    }
  },

  // ============================================================================
  // ACTIONS — SUPPRESSION
  // ============================================================================

  async deleteComment(commentId: string, articleId: string): Promise<void> {
    if (!confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return;

    try {
      const { error } = await this.supabaseInstance!
        .from('sessions_commentaires')
        .delete()
        .eq('session_id', commentId);
      if (error) throw error;

      this.showToast('Commentaire supprimé', 'success');
      const container = document.getElementById(`comments-${articleId}`);
      if (container) this.loadComments(articleId, container);

    } catch (error) {
      console.error('❌ [CommentsWidget] Erreur suppression:', error);
      this.showToast('Erreur lors de la suppression', 'error');
    }
  },

  async deleteReply(replyId: string, articleId: string): Promise<void> {
    if (!confirm('Voulez-vous vraiment supprimer cette réponse ?')) return;

    try {
      const { error } = await this.supabaseInstance!
        .from('session_reponses')
        .delete()
        .eq('reponse_id', replyId);
      if (error) throw error;

      this.showToast('Réponse supprimée', 'success');
      const container = document.getElementById(`comments-${articleId}`);
      if (container) this.loadComments(articleId, container);

    } catch (error) {
      console.error('❌ [CommentsWidget] Erreur suppression:', error);
      this.showToast('Erreur lors de la suppression', 'error');
    }
  },

  toggleReplyBox(commentId: string): void {
    const box = document.getElementById(`reply-box-${commentId}`);
    if (!box) return;
    const isVisible = box.style.display !== 'none';
    box.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
      (document.getElementById(`reply-input-${commentId}`) as HTMLTextAreaElement)?.focus();
    }
  },

  // ============================================================================
  // TEMPS RÉEL
  // ============================================================================

  setupRealtime(articleId: string, container: HTMLElement): void {
    if (this.realtimeChannels.has(articleId)) {
      this.supabaseInstance!.removeChannel(this.realtimeChannels.get(articleId)!);
    }

    const channel = this.supabaseInstance!
      .channel(`comments:${articleId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'sessions_commentaires',
        filter: `article_id=eq.${articleId}`
      }, () => this.loadComments(articleId, container))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'session_reponses'
      }, () => this.loadComments(articleId, container))
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') console.log('✅ [CommentsWidget] Temps réel activé');
      });

    this.realtimeChannels.set(articleId, channel);
  },

  // ============================================================================
  // UTILITAIRES
  // ============================================================================

  getInitials(prenom: string, nom: string): string {
    const p = (prenom || 'U')[0].toUpperCase();
    const n = (nom || '')[0]?.toUpperCase() ?? '';
    return p + n;
  },

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();

    if (diff < 60_000)   return "À l'instant";
    if (diff < 3_600_000) return `Il y a ${Math.floor(diff / 60_000)} min`;
    if (diff < 86_400_000) return `Il y a ${Math.floor(diff / 3_600_000)}h`;
    if (diff < 604_800_000) return `Il y a ${Math.floor(diff / 86_400_000)}j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  escapeHtml(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  showToast(message: string, type: ToastType = 'info'): void {
    if (window.ToastManager) {
      window.ToastManager[type]('Commentaires', message);
    } else {
      console.log(`[CommentsWidget] ${type.toUpperCase()}: ${message}`);
    }
  },

  injectStyles(): void {
    if (document.getElementById('comments-widget-styles')) return;
    const style = document.createElement('style');
    style.id = 'comments-widget-styles';
    style.textContent = COMMENTS_STYLES;
    document.head.appendChild(style);
  },

  injectModal(): void {
    if (document.getElementById('edit-modal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="modal-overlay" onclick="CommentsWidget.closeEditModal()"></div>
      <div class="edit-modal" id="edit-modal">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-title">
            <i class="fas fa-edit"></i> Modifier
          </h3>
          <button class="modal-close-btn" onclick="CommentsWidget.closeEditModal()">×</button>
        </div>
        <div class="modal-body">
          <textarea id="modal-textarea" class="modal-textarea" placeholder="Modifiez votre texte..."></textarea>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-cancel-btn" onclick="CommentsWidget.closeEditModal()">
            <i class="fas fa-times"></i> Annuler
          </button>
          <button class="modal-btn modal-save-btn" id="modal-save-btn">
            <i class="fas fa-check"></i> Enregistrer
          </button>
        </div>
      </div>
    `);
  },

  // ============================================================================
  // NETTOYAGE
  // ============================================================================

  cleanup(): void {
    this.realtimeChannels.forEach((channel, articleId) => {
      this.supabaseInstance?.removeChannel(channel);
      console.log(`✅ [CommentsWidget] Canal ${articleId} fermé`);
    });
    this.realtimeChannels.clear();
  },
};

// ============================================================================
// AUTO-INITIALISATION
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.supabaseClient) window.CommentsWidget.init();
  });
} else {
  if (window.supabaseClient) window.CommentsWidget.init();
}

window.addEventListener('beforeunload', () => window.CommentsWidget.cleanup());

// ============================================================================
// EXPORT GLOBAL
// ============================================================================

window.CommentsWidget = CommentsWidget;

// Aliases de compatibilité
window.loadComments   = (id, el) => CommentsWidget.loadComments(id, el);
window.submitComment  = (id)     => CommentsWidget.submitComment(id);
window.submitReply    = (pid, id) => CommentsWidget.submitReply(pid, id);
window.deleteComment  = (cid, id) => CommentsWidget.deleteComment(cid, id);
window.toggleReplyBox = (cid)    => CommentsWidget.toggleReplyBox(cid);

export default CommentsWidget;

console.log('✅ [CommentsWidget v3.0] Module chargé — Édition + Admin + Modal');
