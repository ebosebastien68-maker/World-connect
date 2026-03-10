// ============================================================================
// COMMENTS WIDGET - WORLD CONNECT v4.0
// React TSX - Hooks + JSX + SupabaseClient via props
// ============================================================================

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  prenom: string;
  nom: string;
  role: 'admin' | 'user' | string;
}

export interface CurrentUser {
  id: string;
  email?: string;
}

export interface Comment {
  session_id: string;
  article_id: string;
  acteur_id: string;
  prenom_acteur: string;
  nom_acteur: string;
  texte: string;
  date_created: string;
}

export interface Reply {
  reponse_id: string;
  session_id: string;
  acteur_id: string;
  prenom_acteur: string;
  nom_acteur: string;
  texte: string;
  date_created: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type EditTarget = { type: 'comment'; id: string } | { type: 'reply'; id: string } | null;

export interface SupabaseQueryBuilder<T = unknown> extends Promise<{ data: T | null; error: Error | null }> {
  select(fields: string): this;
  eq(col: string, val: string): this;
  order(col: string, opts?: { ascending: boolean }): this;
  insert(rows: Record<string, unknown>[]): Promise<{ data: null; error: Error | null }>;
  update(row: Record<string, unknown>): this;
  delete(): this;
  single(): Promise<{ data: T | null; error: Error | null }>;
}

export interface RealtimeChannel {
  on(event: string, config: Record<string, unknown>, cb: (p: unknown) => void): this;
  subscribe(cb: (status: string) => void): this;
}

export interface SupabaseClient {
  from<T = unknown>(table: string): SupabaseQueryBuilder<T>;
  channel(name: string): RealtimeChannel;
  removeChannel(ch: RealtimeChannel): void;
}

export interface SupabaseClientWrapper {
  supabase: SupabaseClient;
  getCurrentUser(): Promise<CurrentUser | null>;
  getUserProfile(id: string): Promise<UserProfile | null>;
}

export interface CommentsWidgetProps {
  articleId: string;
  /** Pass supabaseClient directly OR provide via <CommentsProvider> */
  supabaseClient?: SupabaseClientWrapper;
}

// ============================================================================
// CONTEXT (alternative to props drilling)
// ============================================================================

interface CommentsContextValue {
  supabaseClient: SupabaseClientWrapper;
  currentUser: CurrentUser | null;
  userProfile: UserProfile | null;
}

const CommentsContext = createContext<CommentsContextValue | null>(null);

export function CommentsProvider({
  supabaseClient,
  children,
}: {
  supabaseClient: SupabaseClientWrapper;
  children: ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    (async () => {
      const user = await supabaseClient.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        const profile = await supabaseClient.getUserProfile(user.id);
        setUserProfile(profile);
      }
    })();
  }, [supabaseClient]);

  return (
    <CommentsContext.Provider value={{ supabaseClient, currentUser, userProfile }}>
      {children}
    </CommentsContext.Provider>
  );
}

function useCommentsContext() {
  const ctx = useContext(CommentsContext);
  if (!ctx) throw new Error('useCommentsContext must be used inside <CommentsProvider>');
  return ctx;
}

// ============================================================================
// HELPERS
// ============================================================================

function getInitials(prenom: string, nom: string): string {
  return ((prenom || 'U')[0] + ((nom || '')[0] ?? '')).toUpperCase();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "À l'instant";
  if (diff < 3_600_000) return `Il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Il y a ${Math.floor(diff / 3_600_000)}h`;
  if (diff < 604_800_000) return `Il y a ${Math.floor(diff / 86_400_000)}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ============================================================================
// TOAST
// ============================================================================

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div style={styles.toastContainer}>
      {toasts.map((t) => (
        <div key={t.id} style={{ ...styles.toast, ...styles[`toast_${t.type}` as keyof typeof styles] as object }}>
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} style={styles.toastClose}>×</button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}

// ============================================================================
// EDIT MODAL
// ============================================================================

interface EditModalProps {
  isOpen: boolean;
  title: string;
  initialText: string;
  onSave: (text: string) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

function EditModal({ isOpen, title, initialText, onSave, onClose, loading }: EditModalProps) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setText(initialText);
  }, [initialText, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!text.trim()) return;
    await onSave(text.trim());
  };

  return (
    <>
      {/* Overlay */}
      <div style={styles.modalOverlay} onClick={onClose} />

      {/* Modal */}
      <div style={styles.modal} role="dialog" aria-modal="true">
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>✏️ {title}</h3>
          <button onClick={onClose} style={styles.modalCloseBtn} aria-label="Fermer">×</button>
        </div>

        <div style={styles.modalBody}>
          <textarea
            style={styles.modalTextarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Modifiez votre texte..."
            autoFocus
            rows={5}
          />
        </div>

        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.modalCancelBtn} disabled={loading}>
            Annuler
          </button>
          <button onClick={handleSave} style={styles.modalSaveBtn} disabled={loading || !text.trim()}>
            {loading ? <span style={styles.spinner} /> : '✓'} Enregistrer
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// REPLY ITEM
// ============================================================================

interface ReplyItemProps {
  reply: Reply;
  articleId: string;
  currentUser: CurrentUser | null;
  userProfile: UserProfile | null;
  onEdit: (reply: Reply) => void;
  onDelete: (replyId: string) => void;
}

function ReplyItem({ reply, currentUser, userProfile, onEdit, onDelete }: ReplyItemProps) {
  const isMyReply = currentUser?.id === reply.acteur_id;
  const isAdmin = userProfile?.role === 'admin';

  return (
    <div style={styles.replyItem}>
      <div style={styles.replyAvatar}>
        {getInitials(reply.prenom_acteur, reply.nom_acteur)}
      </div>
      <div style={styles.replyContent}>
        <div style={styles.replyHeader}>
          <span style={styles.replyAuthor}>
            {reply.prenom_acteur} {reply.nom_acteur}
          </span>
          <span style={styles.replyDate}>{formatDate(reply.date_created)}</span>
        </div>
        <p style={styles.replyText}>{reply.texte}</p>
        {(isMyReply || isAdmin) && (
          <div style={styles.replyActions}>
            {isMyReply && (
              <button style={styles.actionBtnEdit} onClick={() => onEdit(reply)}>
                ✏️ Modifier
              </button>
            )}
            {(isMyReply || isAdmin) && (
              <button style={styles.actionBtnDelete} onClick={() => onDelete(reply.reponse_id)}>
                🗑 Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// REPLY INPUT BOX
// ============================================================================

interface ReplyInputProps {
  commentId: string;
  userProfile: UserProfile;
  onSubmit: (text: string) => Promise<void>;
  onClose: () => void;
}

function ReplyInputBox({ userProfile, onSubmit, onClose }: ReplyInputProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await onSubmit(text.trim());
    setText('');
    setLoading(false);
    onClose();
  };

  return (
    <div style={styles.replyInputBox}>
      <div style={styles.replyInputAvatar}>
        {getInitials(userProfile.prenom, userProfile.nom)}
      </div>
      <div style={styles.replyInputWrapper}>
        <textarea
          style={styles.commentInput}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Votre réponse..."
          rows={2}
          autoFocus
        />
        <div style={styles.replyInputActions}>
          <button onClick={onClose} style={styles.replyInputCancelBtn}>Annuler</button>
          <button onClick={handleSubmit} style={styles.replyInputSubmitBtn} disabled={loading || !text.trim()}>
            {loading ? <span style={styles.spinner} /> : '✉️'} Répondre
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMMENT ITEM
// ============================================================================

interface CommentItemProps {
  comment: Comment;
  replies: Reply[];
  articleId: string;
  currentUser: CurrentUser | null;
  userProfile: UserProfile | null;
  onEditComment: (comment: Comment) => void;
  onEditReply: (reply: Reply) => void;
  onDeleteComment: (commentId: string) => void;
  onDeleteReply: (replyId: string) => void;
  onSubmitReply: (parentId: string, text: string) => Promise<void>;
}

function CommentItem({
  comment,
  replies,
  articleId,
  currentUser,
  userProfile,
  onEditComment,
  onEditReply,
  onDeleteComment,
  onDeleteReply,
  onSubmitReply,
}: CommentItemProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);

  const isMyComment = currentUser?.id === comment.acteur_id;
  const isAdmin = userProfile?.role === 'admin';

  return (
    <div style={styles.commentItem}>
      {/* Main comment */}
      <div style={styles.commentMain}>
        <div style={styles.commentAvatar}>
          {getInitials(comment.prenom_acteur, comment.nom_acteur)}
        </div>
        <div style={styles.commentContent}>
          <div style={styles.commentHeader}>
            <span style={styles.commentAuthor}>
              {comment.prenom_acteur} {comment.nom_acteur}
            </span>
            <span style={styles.commentDate}>{formatDate(comment.date_created)}</span>
          </div>
          <p style={styles.commentText}>{comment.texte}</p>
          <div style={styles.commentActions}>
            {currentUser && (
              <button
                style={styles.actionBtnReply}
                onClick={() => setShowReplyBox((v) => !v)}
              >
                ↩ Répondre
              </button>
            )}
            {isMyComment && (
              <button style={styles.actionBtnEdit} onClick={() => onEditComment(comment)}>
                ✏️ Modifier
              </button>
            )}
            {(isMyComment || isAdmin) && (
              <button
                style={styles.actionBtnDelete}
                onClick={() => onDeleteComment(comment.session_id)}
              >
                🗑 Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply input */}
      {showReplyBox && userProfile && (
        <ReplyInputBox
          commentId={comment.session_id}
          userProfile={userProfile}
          onSubmit={(text) => onSubmitReply(comment.session_id, text)}
          onClose={() => setShowReplyBox(false)}
        />
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div style={styles.repliesList}>
          {replies.map((reply) => (
            <ReplyItem
              key={reply.reponse_id}
              reply={reply}
              articleId={articleId}
              currentUser={currentUser}
              userProfile={userProfile}
              onEdit={onEditReply}
              onDelete={onDeleteReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMMENT INPUT
// ============================================================================

interface CommentInputProps {
  userProfile: UserProfile;
  onSubmit: (text: string) => Promise<void>;
}

function CommentInput({ userProfile, onSubmit }: CommentInputProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await onSubmit(text.trim());
    setText('');
    setLoading(false);
  };

  return (
    <div style={styles.commentInputBox}>
      <div style={styles.commentInputAvatar}>
        {getInitials(userProfile.prenom, userProfile.nom)}
      </div>
      <div style={styles.commentInputWrapper}>
        <textarea
          style={styles.commentInput}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrivez votre commentaire..."
          rows={3}
        />
        <button
          onClick={handleSubmit}
          style={styles.commentSubmitBtn}
          disabled={loading || !text.trim()}
        >
          {loading ? <span style={styles.spinner} /> : '✉️'} Envoyer
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN WIDGET
// ============================================================================

export default function CommentsWidget({ articleId, supabaseClient: supabaseClientProp }: CommentsWidgetProps) {
  // --- Auth: context or local init ---
  const ctx = (() => {
    try { return useCommentsContext(); } catch { return null; }
  })();

  const [localUser, setLocalUser] = useState<CurrentUser | null>(null);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);
  const [localClient, setLocalClient] = useState<SupabaseClientWrapper | null>(null);

  useEffect(() => {
    if (ctx || !supabaseClientProp) return;
    setLocalClient(supabaseClientProp);
    (async () => {
      const user = await supabaseClientProp.getCurrentUser();
      setLocalUser(user);
      if (user) {
        const profile = await supabaseClientProp.getUserProfile(user.id);
        setLocalProfile(profile);
      }
    })();
  }, [supabaseClientProp, ctx]);

  const client = ctx?.supabaseClient ?? localClient;
  const currentUser = ctx?.currentUser ?? localUser;
  const userProfile = ctx?.userProfile ?? localProfile;
  const supabase = client?.supabase ?? null;

  // --- Data ---
  const [comments, setComments] = useState<Comment[]>([]);
  const [repliesByComment, setRepliesByComment] = useState<Record<string, Reply[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Edit modal ---
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [editInitialText, setEditInitialText] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const editModalTitle = editTarget?.type === 'comment' ? 'Modifier le commentaire' : 'Modifier la réponse';

  // --- Toast ---
  const { toasts, showToast, removeToast } = useToast();

  // --- Realtime ref ---
  const channelRef = useRef<RealtimeChannel | null>(null);

  // ============================================================================
  // FETCH
  // ============================================================================

  const fetchComments = useCallback(async () => {
    if (!supabase) return;
    setError(null);

    try {
      const { data: commentsData, error: ce } = await (supabase
        .from('comments_with_actor_info')
        .select('*')
        .eq('article_id', articleId)
        .order('date_created', { ascending: false }) as unknown as Promise<{ data: Comment[] | null; error: Error | null }>);

      if (ce) throw ce;

      const { data: allReplies, error: re } = await (supabase
        .from('replies_with_actor_info')
        .select('*')
        .order('date_created', { ascending: true }) as unknown as Promise<{ data: Reply[] | null; error: Error | null }>);

      if (re) throw re;

      const commentIds = new Set((commentsData ?? []).map((c) => c.session_id));
      const filteredReplies = (allReplies ?? []).filter((r) => commentIds.has(r.session_id));

      const grouped: Record<string, Reply[]> = {};
      filteredReplies.forEach((r) => {
        if (!grouped[r.session_id]) grouped[r.session_id] = [];
        grouped[r.session_id].push(r);
      });

      setComments(commentsData ?? []);
      setRepliesByComment(grouped);
    } catch (err) {
      console.error('❌ [CommentsWidget] Erreur:', err);
      setError('Erreur de chargement des commentaires');
    } finally {
      setLoading(false);
    }
  }, [supabase, articleId]);

  // --- Initial load ---
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // --- Realtime ---
  useEffect(() => {
    if (!supabase) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`comments:${articleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions_commentaires', filter: `article_id=eq.${articleId}` },
        () => fetchComments())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_reponses' },
        () => fetchComments())
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') console.log('✅ [CommentsWidget] Temps réel actif');
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, articleId, fetchComments]);

  // ============================================================================
  // HANDLERS - SUBMIT
  // ============================================================================

  const handleSubmitComment = async (text: string) => {
    if (!supabase || !currentUser) return;
    const { error } = await supabase
      .from('sessions_commentaires')
      .insert([{ article_id: articleId, user_id: currentUser.id, texte: text }]);

    if (error) { showToast('Erreur lors de l\'envoi', 'error'); return; }
    showToast('Commentaire publié ✓', 'success');
    fetchComments();
  };

  const handleSubmitReply = async (parentId: string, text: string) => {
    if (!supabase || !currentUser) return;
    const { error } = await supabase
      .from('session_reponses')
      .insert([{ session_id: parentId, user_id: currentUser.id, texte: text }]);

    if (error) { showToast('Erreur lors de l\'envoi', 'error'); return; }
    showToast('Réponse publiée ✓', 'success');
    fetchComments();
  };

  // ============================================================================
  // HANDLERS - DELETE
  // ============================================================================

  const handleDeleteComment = async (commentId: string) => {
    if (!supabase || !window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return;
    const { error } = await supabase.from('sessions_commentaires').delete().eq('session_id', commentId);
    if (error) { showToast('Erreur de suppression', 'error'); return; }
    showToast('Commentaire supprimé', 'success');
    fetchComments();
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!supabase || !window.confirm('Voulez-vous vraiment supprimer cette réponse ?')) return;
    const { error } = await supabase.from('session_reponses').delete().eq('reponse_id', replyId);
    if (error) { showToast('Erreur de suppression', 'error'); return; }
    showToast('Réponse supprimée', 'success');
    fetchComments();
  };

  // ============================================================================
  // HANDLERS - EDIT MODAL OPEN
  // ============================================================================

  const openEditComment = async (comment: Comment) => {
    setEditInitialText(comment.texte);
    setEditTarget({ type: 'comment', id: comment.session_id });
  };

  const openEditReply = async (reply: Reply) => {
    setEditInitialText(reply.texte);
    setEditTarget({ type: 'reply', id: reply.reponse_id });
  };

  const closeEditModal = () => {
    setEditTarget(null);
    setEditInitialText('');
  };

  // ============================================================================
  // HANDLERS - SAVE EDIT
  // ============================================================================

  const handleSaveEdit = async (newText: string) => {
    if (!supabase || !currentUser || !editTarget) return;
    setEditLoading(true);

    try {
      if (editTarget.type === 'comment') {
        const { error } = await supabase
          .from('sessions_commentaires')
          .update({ texte: newText })
          .eq('session_id', editTarget.id)
          .eq('user_id', currentUser.id);
        if (error) throw error;
        showToast('Commentaire modifié ✓', 'success');
      } else {
        const { error } = await supabase
          .from('session_reponses')
          .update({ texte: newText })
          .eq('reponse_id', editTarget.id)
          .eq('user_id', currentUser.id);
        if (error) throw error;
        showToast('Réponse modifiée ✓', 'success');
      }
      closeEditModal();
      fetchComments();
    } catch {
      showToast('Erreur lors de la modification', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={styles.widget}>
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Edit modal */}
      <EditModal
        isOpen={!!editTarget}
        title={editModalTitle}
        initialText={editInitialText}
        onSave={handleSaveEdit}
        onClose={closeEditModal}
        loading={editLoading}
      />

      {/* Header */}
      <div style={styles.widgetHeader}>
        <h4 style={styles.widgetTitle}>
          💬 Commentaires ({comments.length})
        </h4>
      </div>

      {/* Login prompt / Comment input */}
      {!currentUser || !userProfile ? (
        <div style={styles.loginPrompt}>
          <div style={styles.loginIcon}>🔒</div>
          <p style={styles.loginText}>Connectez-vous pour commenter</p>
          <a href="connexion.html" style={styles.loginBtn}>Se connecter</a>
        </div>
      ) : (
        <CommentInput userProfile={userProfile} onSubmit={handleSubmitComment} />
      )}

      {/* States */}
      {loading && (
        <div style={styles.stateBox}>
          <div style={styles.loaderRing} />
          <span style={styles.stateText}>Chargement...</span>
        </div>
      )}

      {!loading && error && (
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>⚠️</span>
          <p style={styles.stateText}>{error}</p>
          <button onClick={fetchComments} style={styles.retryBtn}>↻ Réessayer</button>
        </div>
      )}

      {!loading && !error && comments.length === 0 && (
        <div style={styles.stateBox}>
          <div style={styles.emptyIcon}>💬</div>
          <p style={styles.stateText}>Soyez le premier à commenter !</p>
        </div>
      )}

      {/* Comments list */}
      {!loading && !error && comments.length > 0 && (
        <div style={styles.commentsList}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.session_id}
              comment={comment}
              replies={repliesByComment[comment.session_id] ?? []}
              articleId={articleId}
              currentUser={currentUser}
              userProfile={userProfile}
              onEditComment={openEditComment}
              onEditReply={openEditReply}
              onDeleteComment={handleDeleteComment}
              onDeleteReply={handleDeleteReply}
              onSubmitReply={handleSubmitReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STYLES (CSS-in-JS, compatible avec les CSS vars du projet)
// ============================================================================

const styles = {
  // Widget
  widget: {
    padding: '20px',
    background: 'var(--bg-secondary, #f9fafb)',
    fontFamily: 'inherit',
    position: 'relative' as const,
  },
  widgetHeader: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid var(--border-color, #e5e7eb)',
  },
  widgetTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary, #111)',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  // Login
  loginPrompt: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    background: 'var(--bg-primary, #fff)',
    borderRadius: '16px',
    marginBottom: '20px',
  },
  loginIcon: { fontSize: '48px', marginBottom: '12px' },
  loginText: { color: 'var(--text-secondary, #555)', marginBottom: '16px', fontSize: '15px' },
  loginBtn: {
    display: 'inline-block',
    padding: '12px 24px',
    background: 'var(--accent-kaki, #6b7249)',
    color: 'white',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '15px',
    transition: 'all 0.2s',
  },

  // Comment input
  commentInputBox: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    padding: '16px',
    background: 'var(--bg-primary, #fff)',
    borderRadius: '16px',
  },
  commentInputAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-blue, #2563eb), var(--accent-cyan, #06b6d4))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 700,
    fontSize: '18px',
    flexShrink: 0,
  },
  commentInputWrapper: { flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  commentInput: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid var(--border-color, #e5e7eb)',
    borderRadius: '12px',
    fontFamily: 'inherit',
    fontSize: '14px',
    color: 'var(--text-primary, #111)',
    background: 'var(--bg-secondary, #f9fafb)',
    resize: 'vertical' as const,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  commentSubmitBtn: {
    alignSelf: 'flex-end' as const,
    padding: '10px 20px',
    background: 'var(--accent-kaki, #6b7249)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  // Comments list
  commentsList: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },

  // Comment item
  commentItem: {
    padding: '16px',
    background: 'var(--bg-primary, #fff)',
    borderRadius: '16px',
    borderLeft: '4px solid var(--accent-blue, #2563eb)',
  },
  commentMain: { display: 'flex', gap: '12px' },
  commentAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-blue, #2563eb), var(--accent-cyan, #06b6d4))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 700,
    fontSize: '18px',
    flexShrink: 0,
  },
  commentContent: { flex: 1, minWidth: 0 },
  commentHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  commentAuthor: { fontWeight: 700, fontSize: '15px', color: 'var(--text-primary, #111)' },
  commentDate: { fontSize: '13px', color: 'var(--text-tertiary, #999)' },
  commentText: {
    color: 'var(--text-primary, #111)',
    lineHeight: 1.6,
    fontSize: '14px',
    marginBottom: '10px',
    wordWrap: 'break-word' as const,
    margin: '0 0 10px 0',
  },
  commentActions: { display: 'flex', gap: '16px', flexWrap: 'wrap' as const },

  // Action buttons
  actionBtnReply: {
    background: 'none', border: 'none', color: 'var(--accent-blue, #2563eb)',
    cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: '4px 0',
  },
  actionBtnEdit: {
    background: 'none', border: 'none', color: 'var(--accent-purple, #7c3aed)',
    cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: '4px 0',
  },
  actionBtnDelete: {
    background: 'none', border: 'none', color: 'var(--accent-red, #ef4444)',
    cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: '4px 0',
  },

  // Reply input
  replyInputBox: {
    display: 'flex',
    gap: '12px',
    margin: '12px 0 0 60px',
    padding: '12px',
    background: 'var(--bg-primary, #fff)',
    borderRadius: '12px',
  },
  replyInputAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-purple, #7c3aed), var(--accent-pink, #ec4899))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 700,
    fontSize: '16px',
    flexShrink: 0,
  },
  replyInputWrapper: { flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  replyInputActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' as const },
  replyInputCancelBtn: {
    padding: '8px 14px', background: 'var(--bg-secondary, #f9fafb)',
    border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px',
    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
  },
  replyInputSubmitBtn: {
    padding: '8px 16px', background: 'var(--accent-kaki, #6b7249)',
    color: 'white', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: '6px',
  },

  // Replies list
  repliesList: {
    marginTop: '16px',
    marginLeft: '60px',
    paddingLeft: '20px',
    borderLeft: '3px solid var(--border-color, #e5e7eb)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },

  // Reply item
  replyItem: {
    display: 'flex',
    gap: '10px',
    padding: '12px',
    background: 'var(--bg-secondary, #f9fafb)',
    borderRadius: '12px',
  },
  replyAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-purple, #7c3aed), var(--accent-pink, #ec4899))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 700,
    fontSize: '14px',
    flexShrink: 0,
  },
  replyContent: { flex: 1, minWidth: 0 },
  replyHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  replyAuthor: { fontWeight: 600, fontSize: '14px', color: 'var(--text-primary, #111)' },
  replyDate: { fontSize: '12px', color: 'var(--text-tertiary, #999)' },
  replyText: {
    color: 'var(--text-primary, #111)',
    lineHeight: 1.5,
    fontSize: '13px',
    wordWrap: 'break-word' as const,
    margin: '0 0 8px 0',
  },
  replyActions: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },

  // State boxes
  stateBox: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
  },
  stateText: { color: 'var(--text-tertiary, #999)', fontSize: '15px', margin: 0 },
  emptyIcon: { fontSize: '56px', opacity: 0.4 },
  errorBox: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
  },
  errorIcon: { fontSize: '40px' },
  retryBtn: {
    padding: '10px 20px',
    background: 'var(--accent-kaki, #6b7249)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
  },

  // Loader
  loaderRing: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '4px solid var(--border-color, #e5e7eb)',
    borderTopColor: 'var(--accent-blue, #2563eb)',
    animation: 'spin 0.8s linear infinite',
  },

  // Modal
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(15,23,42,0.75)',
    backdropFilter: 'blur(6px)',
    zIndex: 9998,
  },
  modal: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'var(--bg-secondary, #f9fafb)',
    borderRadius: '24px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
    zIndex: 9999,
    width: '90%',
    maxWidth: '600px',
    padding: '32px',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary, #111)',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    color: 'var(--text-tertiary, #999)',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 4px',
  },
  modalBody: { marginBottom: '24px' },
  modalTextarea: {
    width: '100%',
    minHeight: '140px',
    padding: '16px',
    border: '2px solid var(--border-color, #e5e7eb)',
    borderRadius: '14px',
    fontFamily: 'inherit',
    fontSize: '15px',
    color: 'var(--text-primary, #111)',
    background: 'var(--bg-primary, #fff)',
    resize: 'vertical' as const,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  modalFooter: { display: 'flex', gap: '12px', justifyContent: 'flex-end' as const },
  modalCancelBtn: {
    padding: '12px 24px',
    background: 'var(--bg-primary, #fff)',
    border: '2px solid var(--border-color, #e5e7eb)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '15px',
    color: 'var(--text-primary, #111)',
  },
  modalSaveBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, var(--accent-purple, #7c3aed), var(--accent-pink, #ec4899))',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  // Toast
  toastContainer: {
    position: 'fixed' as const,
    bottom: '24px',
    right: '24px',
    zIndex: 10000,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    maxWidth: '360px',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderRadius: '14px',
    fontWeight: 600,
    fontSize: '14px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    animation: 'slideInRight 0.3s ease',
    gap: '12px',
  },
  toast_success: { background: '#ecfdf5', color: '#065f46', borderLeft: '4px solid #10b981' },
  toast_error: { background: '#fef2f2', color: '#991b1b', borderLeft: '4px solid #ef4444' },
  toast_warning: { background: '#fffbeb', color: '#92400e', borderLeft: '4px solid #f59e0b' },
  toast_info: { background: '#eff6ff', color: '#1e40af', borderLeft: '4px solid #3b82f6' },
  toastClose: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '18px', opacity: 0.6, lineHeight: 1,
  },

  // Spinner (inline)
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
} as const;
