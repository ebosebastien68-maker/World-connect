// ============================================================================
// WORLD CONNECT - INDEX.TSX
// Converti depuis index.html → home.tsx — Version 5.0.3 PRO
// ============================================================================

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import * as THREE from 'three';
import './style.css';

// ============================================================================
// TYPES
// ============================================================================

interface UserProfile {
  prenom: string;
  nom: string;
  role: string;
}

interface ArticleImage {
  image_url: string;
}

interface ArticleVideo {
  video_url: string;
}

interface Article {
  article_id: string;
  texte: string;
  date_created: string;
  users_profile: { prenom: string; nom: string };
  article_images: ArticleImage[];
  article_videos: ArticleVideo[];
  texte_url?: string;
  vente_url?: string;
  whatsapp_url?: string;
  reaction_like: number;
  reaction_love: number;
  reaction_rire: number;
  reaction_colere: number;
  comment_count?: number;
}

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  title: string;
  message: string;
  type: ToastType;
}

type PageName = 'home' | 'messages' | 'notifications' | 'plus' | 'game';

// Déclarations ambiantes pour les scripts externes non encore convertis
declare global {
  interface Window {
    supabaseClient: {
      supabase: SupabaseClient;
      getCurrentUser: () => Promise<SupabaseUser | null>;
      getUserProfile: (userId: string) => Promise<UserProfile | null>;
    };
    CommentsWidget?: {
      loadComments: (articleId: string, container: HTMLElement) => void;
    };
    submitComment?: (...args: unknown[]) => void;
    deleteComment?: (...args: unknown[]) => void;
    toggleReplyBox?: (...args: unknown[]) => void;
  }
}

// Types Supabase simplifiés (remplacez par @supabase/supabase-js si installé)
interface SupabaseUser {
  id: string;
  email?: string;
}

interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
  auth: {
    signOut: () => Promise<void>;
  };
  channel: (name: string) => SupabaseChannel;
}

interface SupabaseQueryBuilder {
  select: (columns?: string, opts?: object) => SupabaseQueryBuilder;
  insert: (data: object) => Promise<{ data: unknown; error: unknown }>;
  upsert: (data: object, opts?: object) => Promise<{ data: unknown; error: unknown }>;
  delete: () => SupabaseQueryBuilder;
  eq: (column: string, value: unknown) => SupabaseQueryBuilder;
  order: (column: string, opts?: object) => Promise<{ data: unknown[]; error: unknown }>;
  single: () => Promise<{ data: unknown; error: { code?: string } | null }>;
  count?: string;
}

interface SupabaseChannel {
  on: (
    event: string,
    filter: object,
    callback: (...args: unknown[]) => void
  ) => SupabaseChannel;
  subscribe: () => void;
}

// ============================================================================
// COMPOSANT TOAST
// ============================================================================

const ToastItem: React.FC<{
  toast: Toast;
  onRemove: (id: number) => void;
}> = ({ toast, onRemove }) => {
  const icons: Record<ToastType, string> = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
  };

  return (
    <div
      className={`toast ${toast.type}`}
      onClick={() => onRemove(toast.id)}
    >
      <div className="toast-icon">
        <i className={`fas ${icons[toast.type]}`}></i>
      </div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        <div className="toast-message">{toast.message}</div>
      </div>
      <button
        className="toast-close"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(toast.id);
        }}
      >
        ×
      </button>
    </div>
  );
};

// ============================================================================
// COMPOSANT CARTE ARTICLE
// ============================================================================

const ArticleCard: React.FC<{
  article: Article;
  userProfile: UserProfile | null;
  currentUser: SupabaseUser | null;
  userReactions: Record<string, string[]>;
  onReaction: (articleId: string, type: string) => void;
  onDelete: (articleId: string) => void;
  onViewReactions: (articleId: string) => void;
  onShare: (platform: string, articleId: string) => void;
  allArticles: Article[];
}> = ({
  article,
  userProfile,
  currentUser,
  userReactions,
  onReaction,
  onDelete,
  onViewReactions,
  onShare,
  allArticles,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  const author = article.users_profile || { prenom: 'Utilisateur', nom: 'Inconnu' };
  const initials = `${author.prenom[0]}${author.nom[0]}`.toUpperCase();

  const images = Array.isArray(article.article_images) ? article.article_images : [];
  const videos = Array.isArray(article.article_videos) ? article.article_videos : [];

  const imageClass =
    images.length === 1 ? 'single' : images.length === 2 ? 'double' : 'multiple';

  const formattedDate = new Date(article.date_created).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const textContent = article.texte || '';
  const isLongText = textContent.length > 300;
  const displayText = isLongText && !expanded ? textContent.substring(0, 300) + '...' : textContent;

  const userArticleReactions = userReactions[article.article_id] || [];
  const likeActive = userArticleReactions.includes('like') ? 'active' : '';
  const loveActive = userArticleReactions.includes('love') ? 'active' : '';
  const rireActive = userArticleReactions.includes('rire') ? 'active' : '';
  const colereActive = userArticleReactions.includes('colere') ? 'active' : '';

  const commentCount = article.comment_count || 0;

  // Gérer l'ouverture des commentaires
  useEffect(() => {
    if (showComments && commentsRef.current && commentsRef.current.innerHTML === '') {
      if (window.CommentsWidget) {
        window.CommentsWidget.loadComments(article.article_id, commentsRef.current);
      } else {
        if (commentsRef.current) {
          commentsRef.current.innerHTML =
            '<p style="color: #ef4444; padding: 20px;">Module commentaires non chargé</p>';
        }
      }
    }
  }, [showComments, article.article_id]);

  const getShareUrl = () =>
    `${window.location.origin}${window.location.pathname}?article=${article.article_id}`;

  const getShareText = () => {
    const preview = textContent.substring(0, 100) + (textContent.length > 100 ? '...' : '');
    return `${preview} - World Connect`;
  };

  const handleShareClick = (platform: string) => {
    setShowShareMenu(false);
    if (platform === 'more') {
      if (navigator.share) {
        navigator
          .share({ title: 'World Connect', text: getShareText(), url: getShareUrl() })
          .catch(() => navigator.clipboard.writeText(getShareUrl()));
      } else {
        navigator.clipboard.writeText(getShareUrl());
      }
    } else {
      onShare(platform, article.article_id);
    }
  };

  return (
    <div className="article-card" data-article-id={article.article_id}>
      {/* En-tête */}
      <div className="article-header">
        <div className="avatar">{initials}</div>
        <div className="author-info">
          <h3>{author.prenom} {author.nom}</h3>
          <p>{formattedDate}</p>
        </div>

        {/* Menu admin */}
        {userProfile?.role === 'admin' && (
          <div className="admin-options">
            <button
              className="options-btn"
              onClick={() => setShowAdminMenu(!showAdminMenu)}
            >
              <i className="fas fa-ellipsis-v"></i>
            </button>
            {showAdminMenu && (
              <div className="options-menu show">
                <a onClick={() => { window.location.href = `edit-article.tsx?id=${article.article_id}`; }}>
                  <i className="fas fa-edit"></i> Modifier
                </a>
                <a
                  className="delete"
                  onClick={() => {
                    setShowAdminMenu(false);
                    onDelete(article.article_id);
                  }}
                >
                  <i className="fas fa-trash"></i> Supprimer
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="article-content">
        {/* Texte */}
        <div className="article-text-container">
          <div className="article-text">{displayText}</div>
          {isLongText && (
            <button className="show-more-btn" onClick={() => setExpanded(!expanded)}>
              <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`}></i>
              {expanded ? 'Voir moins' : 'Voir plus'}
            </button>
          )}
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div className={`article-images ${imageClass}`}>
            {images.map((img, i) => (
              <img
                key={i}
                src={img.image_url || ''}
                alt="Image"
                loading="lazy"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
            ))}
          </div>
        )}

        {/* Vidéo */}
        {videos.length > 0 && videos[0]?.video_url && (
          <div className="article-video">
            <video controls playsInline preload="metadata" src={videos[0].video_url} />
          </div>
        )}

        {/* Liens */}
        {(article.texte_url || article.vente_url || article.whatsapp_url) && (
          <div className="article-links">
            {article.texte_url && (
              <button
                className="link-btn"
                onClick={() => window.open(article.texte_url, '_blank')}
              >
                <i className="fas fa-link"></i> Lien
              </button>
            )}
            {article.vente_url && (
              <button
                className="link-btn"
                onClick={() => window.open(article.vente_url, '_blank')}
              >
                <i className="fas fa-shopping-cart"></i> Acheter
              </button>
            )}
            {article.whatsapp_url && (
              <button
                className="link-btn"
                onClick={() => window.open(article.whatsapp_url, '_blank')}
              >
                <i className="fab fa-whatsapp"></i> WhatsApp
              </button>
            )}
          </div>
        )}
      </div>

      {/* Réactions */}
      <div className="reactions">
        <button
          className={`reaction-btn ${likeActive}`}
          onClick={() => onReaction(article.article_id, 'like')}
        >
          <i className="fas fa-thumbs-up"></i>
          <span>{article.reaction_like}</span>
        </button>
        <button
          className={`reaction-btn ${loveActive}`}
          onClick={() => onReaction(article.article_id, 'love')}
        >
          <i className="fas fa-heart"></i>
          <span>{article.reaction_love}</span>
        </button>
        <button
          className={`reaction-btn ${rireActive}`}
          onClick={() => onReaction(article.article_id, 'rire')}
        >
          <i className="fas fa-laugh"></i>
          <span>{article.reaction_rire}</span>
        </button>
        <button
          className={`reaction-btn ${colereActive}`}
          onClick={() => onReaction(article.article_id, 'colere')}
        >
          <i className="fas fa-angry"></i>
          <span>{article.reaction_colere}</span>
        </button>
      </div>

      {/* Section commentaires + partage */}
      <div className="comments-reactions-section">
        <div
          className="comments-toggle-large"
          onClick={() => setShowComments(!showComments)}
        >
          <i className="fas fa-comment"></i>
          <span>Commentaires</span>
          {commentCount > 0 && (
            <span className="comment-count-badge">{commentCount}</span>
          )}
        </div>

        {/* Partage */}
        <div
          className="share-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowShareMenu(!showShareMenu);
          }}
        >
          <i className="fas fa-share-alt"></i>
          {showShareMenu && (
            <div className="share-menu show">
              <h4>Partager</h4>
              <div className="share-options">
                {[
                  { cls: 'facebook', icon: 'fab fa-facebook', label: 'Facebook' },
                  { cls: 'twitter', icon: 'fab fa-twitter', label: 'Twitter' },
                  { cls: 'whatsapp', icon: 'fab fa-whatsapp', label: 'WhatsApp' },
                  { cls: 'telegram', icon: 'fab fa-telegram', label: 'Telegram' },
                  { cls: 'instagram', icon: 'fab fa-instagram', label: 'Instagram' },
                  { cls: 'tiktok', icon: 'fab fa-tiktok', label: 'TikTok' },
                  { cls: 'more', icon: 'fas fa-ellipsis-h', label: 'Plus' },
                ].map(({ cls, icon, label }) => (
                  <a
                    key={cls}
                    className={`share-option ${cls}`}
                    onClick={() => handleShareClick(cls)}
                  >
                    <i className={icon}></i>
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="user-reactions-btn"
          onClick={() => onViewReactions(article.article_id)}
        >
          <i className="fas fa-users"></i>
        </div>
      </div>

      {/* Section commentaires */}
      <div
        className={`comments-section ${showComments ? 'show' : ''}`}
        ref={commentsRef}
      />
    </div>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL — INDEX
// ============================================================================

const HomePage: React.FC = () => {
  // ── État ────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageName>('home');
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>({});

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [showSearchInfo, setShowSearchInfo] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(false);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [emptyState, setEmptyState] = useState(false);
  const [emptyStateContent, setEmptyStateContent] = useState<'default' | 'offline' | 'error'>('default');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [notifCount, setNotifCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [loadedPages, setLoadedPages] = useState<Set<PageName>>(new Set(['home']));
  const [iframeUrls, setIframeUrls] = useState<Partial<Record<PageName, string>>>({});

  // ── Refs ─────────────────────────────────────────────────────────────────
  const toastIdRef = useRef(0);
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animFrameRef = useRef<number>(0);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const pageLabels: Record<PageName, string> = {
    home: 'Accueil',
    messages: 'Messages',
    notifications: 'Notifications',
    plus: 'Connect Ultra',
    game: 'Jeu de Course 3D',
  };

  // ============================================================================
  // TOAST MANAGER
  // ============================================================================

  const showToast = useCallback(
    (title: string, message: string, type: ToastType = 'info', duration = 5000) => {
      const id = ++toastIdRef.current;
      setToasts((prev) => [...prev, { id, title, message, type }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ============================================================================
  // DARK MODE
  // ============================================================================

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    if (saved === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.body.classList.toggle('dark-mode', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // ============================================================================
  // OFFLINE DETECTION
  // ============================================================================

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Connexion rétablie', 'Vous êtes de nouveau en ligne', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Hors ligne', 'Certaines fonctionnalités peuvent être limitées', 'warning');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // ============================================================================
  // THREE.JS BACKGROUND
  // ============================================================================

  useEffect(() => {
    if (!threeContainerRef.current) return;

    const container = threeContainerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x2563eb);
    const color2 = new THREE.Color(0x06b6d4);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      const mixed = color1.clone().lerp(color2, Math.random());
      colors[i] = mixed.r;
      colors[i + 1] = mixed.g;
      colors[i + 2] = mixed.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    particlesRef.current = particles;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      particles.rotation.x += 0.0005;
      particles.rotation.y += 0.001;
      const pos = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += Math.sin(Date.now() * 0.001 + i) * 0.01;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ============================================================================
  // SERVICE WORKER
  // ============================================================================

  const initServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register('./service-worker.js');
      swRegistrationRef.current = reg;
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type } = event.data || {};
        if (type === 'RESUBSCRIBE_PUSH') {
          showToast('Notification', 'Veuillez réactiver les notifications', 'warning');
        }
      });
      await navigator.serviceWorker.ready;
    } catch (err) {
      console.error('❌ Erreur Service Worker:', err);
    }
  }, [showToast]);

  // ============================================================================
  // PUSH NOTIFICATIONS
  // ============================================================================

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    return window.btoa(String.fromCharCode(...bytes));
  };

  const saveSubscriptionToDatabase = useCallback(
    async (subscription: PushSubscription, user: SupabaseUser) => {
      if (!supabaseRef.current) return;
      try {
        const data = {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh_key: arrayBufferToBase64(subscription.getKey('p256dh') as ArrayBuffer),
          auth_key: arrayBufferToBase64(subscription.getKey('auth') as ArrayBuffer),
          user_agent: navigator.userAgent,
          device_type: 'web',
          created_at: new Date().toISOString(),
        };
        await supabaseRef.current
          .from('subscriptions')
          .upsert(data, { onConflict: 'user_id,endpoint' });
      } catch (err) {
        console.error('❌ Erreur sauvegarde subscription:', err);
      }
    },
    []
  );

  const subscribeToPush = useCallback(
    async (user: SupabaseUser) => {
      if (!swRegistrationRef.current) return;
      try {
        const vapidKey =
          'BH3HWUJHOVhPrzNe-XeKjVTls6_iExezM7hReypIioYDh49bui2j7r60bf_aGBMOtVJ0ReiQVGVfxZDVgELmjCA';
        const sub = await swRegistrationRef.current.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        await saveSubscriptionToDatabase(sub, user);
      } catch (err) {
        console.error('❌ Erreur abonnement push:', err);
        showToast('Erreur', "Impossible de s'abonner aux notifications", 'error');
      }
    },
    [saveSubscriptionToDatabase, showToast]
  );

  const requestNotificationPermission = useCallback(
    async (user: SupabaseUser) => {
      if (!('Notification' in window) || !('PushManager' in window)) return false;
      const asked = localStorage.getItem('notificationAsked');
      if (asked === 'true' && Notification.permission !== 'default') {
        if (Notification.permission === 'granted') {
          const existing = await swRegistrationRef.current?.pushManager.getSubscription();
          if (!existing) await subscribeToPush(user);
        }
        return false;
      }
      showToast(
        '🔔 Restez informé',
        'Activez les notifications pour ne rien manquer des nouveautés !',
        'info',
        8000
      );
      await new Promise((r) => setTimeout(r, 1500));
      const permission = await Notification.requestPermission();
      localStorage.setItem('notificationAsked', 'true');
      if (permission === 'granted') {
        await subscribeToPush(user);
        showToast(
          '✅ Notifications activées',
          'Vous recevrez désormais nos actualités en temps réel !',
          'success',
          6000
        );
        return true;
      }
      if (permission === 'denied') {
        showToast(
          '🔕 Notifications désactivées',
          'Vous pouvez les réactiver dans les paramètres',
          'warning',
          6000
        );
      }
      return false;
    },
    [subscribeToPush, showToast]
  );

  // ============================================================================
  // CHARGEMENT DES RÉACTIONS UTILISATEUR
  // ============================================================================

  const loadUserReactions = useCallback(async (user: SupabaseUser) => {
    if (!supabaseRef.current) return;
    try {
      const { data } = (await supabaseRef.current
        .from('article_reactions')
        .select('article_id, reaction_type')
        .eq('user_id', user.id)
        .order('article_id')) as { data: { article_id: string; reaction_type: string }[] };

      if (!data) return;
      const map: Record<string, string[]> = {};
      data.forEach((r) => {
        if (!map[r.article_id]) map[r.article_id] = [];
        map[r.article_id].push(r.reaction_type);
      });
      setUserReactions(map);
    } catch (err) {
      console.warn('⚠️ Erreur chargement réactions:', err);
    }
  }, []);

  // ============================================================================
  // CHARGEMENT DES ARTICLES
  // ============================================================================

  const loadArticles = useCallback(async () => {
    if (!supabaseRef.current) return;
    try {
      if (!navigator.onLine) throw new Error('Pas de connexion Internet');

      setArticlesLoading(true);
      setEmptyState(false);

      const { data: articles, error } = (await supabaseRef.current
        .from('articles')
        .select(
          `*, users_profile!articles_user_id_fkey (prenom, nom),
           article_images (image_url), article_videos (video_url)`
        )
        .order('date_created', { ascending: false })) as {
        data: Article[];
        error: unknown;
      };

      setArticlesLoading(false);

      if (error) throw error;

      if (!articles || articles.length === 0) {
        setAllArticles([]);
        setDisplayedArticles([]);
        setEmptyState(true);
        setEmptyStateContent('default');
        return;
      }

      setAllArticles(articles);
      setDisplayedArticles(articles);
      setEmptyState(false);
    } catch {
      setArticlesLoading(false);
      setDisplayedArticles([]);
      setEmptyState(true);
      setEmptyStateContent(!navigator.onLine ? 'offline' : 'error');
      showToast(
        !navigator.onLine ? 'Hors ligne' : 'Erreur',
        !navigator.onLine ? 'Vérifiez votre connexion Internet' : 'Une erreur est survenue',
        'error'
      );
    }
  }, [showToast]);

  // ============================================================================
  // COMPTEURS BADGES
  // ============================================================================

  const loadNotificationCount = useCallback(async (user: SupabaseUser) => {
    if (!supabaseRef.current) return;
    try {
      const result = (await supabaseRef.current
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read_status', false)
        .order('')) as unknown as { count: number };
      setNotifCount(result?.count ?? 0);
    } catch {}
  }, []);

  const loadMessageCount = useCallback(async (user: SupabaseUser) => {
    if (!supabaseRef.current) return;
    try {
      const result = (await supabaseRef.current
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read_status', false)
        .order('')) as unknown as { count: number };
      setMessageCount(result?.count ?? 0);
    } catch {}
  }, []);

  // ============================================================================
  // TEMPS RÉEL
  // ============================================================================

  const setupRealTimeUpdates = useCallback(
    (user: SupabaseUser) => {
      if (!supabaseRef.current) return;
      const sb = supabaseRef.current;

      sb.channel('articles-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () =>
          loadArticles()
        )
        .subscribe();

      sb.channel('reactions-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'article_reactions' },
          () => {
            loadUserReactions(user);
            loadArticles();
          }
        )
        .subscribe();

      sb.channel('comments-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sessions_commentaires' },
          () => loadArticles()
        )
        .subscribe();

      sb.channel('notifications-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => loadNotificationCount(user)
        )
        .subscribe();

      sb.channel('messages-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
          () => loadMessageCount(user)
        )
        .subscribe();
    },
    [loadArticles, loadUserReactions, loadNotificationCount, loadMessageCount]
  );

  // ============================================================================
  // GESTION DES RÉACTIONS
  // ============================================================================

  const handleReaction = useCallback(
    async (articleId: string, reactionType: string) => {
      if (!currentUser || !userProfile) {
        showToast('Connexion requise', 'Connectez-vous pour réagir', 'warning');
        setTimeout(() => (window.location.href = 'connexion.tsx'), 2000);
        return;
      }
      if (!navigator.onLine) {
        showToast('Hors ligne', 'Impossible de réagir en mode hors ligne', 'error');
        return;
      }
      if (!supabaseRef.current) return;

      try {
        const { data: existing, error: selectError } = await supabaseRef.current
          .from('article_reactions')
          .select('*')
          .eq('article_id', articleId)
          .eq('user_id', currentUser.id)
          .eq('reaction_type', reactionType)
          .single();

        if (selectError && selectError.code !== 'PGRST116') throw selectError;

        if (existing) {
          await supabaseRef.current
            .from('article_reactions')
            .delete()
            .eq('reaction_id', (existing as { reaction_id: string }).reaction_id);
          setUserReactions((prev) => ({
            ...prev,
            [articleId]: (prev[articleId] || []).filter((r) => r !== reactionType),
          }));
        } else {
          await supabaseRef.current
            .from('article_reactions')
            .insert({ article_id: articleId, user_id: currentUser.id, reaction_type: reactionType });
          setUserReactions((prev) => ({
            ...prev,
            [articleId]: [...(prev[articleId] || []), reactionType],
          }));
        }

        setTimeout(() => loadArticles(), 300);
      } catch {
        showToast('Erreur', "Impossible d'enregistrer votre réaction", 'error');
      }
    },
    [currentUser, userProfile, loadArticles, showToast]
  );

  // ============================================================================
  // SUPPRESSION D'ARTICLE
  // ============================================================================

  const deleteArticle = useCallback(
    async (articleId: string) => {
      if (!window.confirm('Voulez-vous vraiment supprimer cet article ?')) return;
      if (!supabaseRef.current) return;
      try {
        setLoading(true);
        const { error } = await supabaseRef.current
          .from('articles')
          .delete()
          .eq('article_id', articleId);
        if (error) throw error;
        showToast('Suppression réussie', 'Article supprimé avec succès', 'success');
        await loadArticles();
      } catch {
        showToast('Erreur', "Impossible de supprimer l'article", 'error');
      } finally {
        setLoading(false);
      }
    },
    [loadArticles, showToast]
  );

  // ============================================================================
  // RÉACTIONS UTILISATEURS
  // ============================================================================

  const viewUserReactions = useCallback(
    (articleId: string) => {
      if (!currentUser || !userProfile) {
        showToast('Connexion requise', 'Connectez-vous pour voir les réactions', 'warning');
        setTimeout(() => (window.location.href = 'connexion.tsx'), 2000);
        return;
      }
      window.location.href = `usereact.tsx?article_id=${articleId}`;
    },
    [currentUser, userProfile, showToast]
  );

  // ============================================================================
  // PARTAGE SOCIAL
  // ============================================================================

  const handleShare = useCallback((platform: string, articleId: string) => {
    const article = allArticles.find((a) => a.article_id === articleId);
    const url = encodeURIComponent(
      `${window.location.origin}${window.location.pathname}?article=${articleId}`
    );
    const text = encodeURIComponent(
      article ? article.texte.substring(0, 100) + '... - World Connect' : 'World Connect'
    );

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      instagram: '',
      tiktok: '',
    };

    if (platform === 'instagram' || platform === 'tiktok') {
      navigator.clipboard.writeText(decodeURIComponent(url));
      showToast(`Partage ${platform}`, 'Lien copié dans le presse-papier', 'info');
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  }, [allArticles, showToast]);

  // ============================================================================
  // RECHERCHE
  // ============================================================================

  const performSearch = useCallback(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setDisplayedArticles(allArticles);
      setShowSearchInfo(false);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const filtered = allArticles.filter((a) => {
      const text = a.texte.toLowerCase();
      const author = `${a.users_profile.prenom} ${a.users_profile.nom}`.toLowerCase();
      return text.includes(query) || author.includes(query);
    });
    setSearchResultCount(filtered.length);
    setShowSearchInfo(true);
    setDisplayedArticles(filtered);
    showToast('Recherche', `${filtered.length} résultat(s) trouvé(s)`, 'info');
    setTimeout(() => setSearchPanelOpen(false), 500);
  }, [searchQuery, allArticles, showToast]);

  // ============================================================================
  // NAVIGATION PAGES
  // ============================================================================

  const navigateToPage = useCallback(
    (page: PageName) => {
      if (page === currentPage) return;
      setCurrentPage(page);
      setMenuOpen(false);

      if (page !== 'home') {
        if (!loadedPages.has(page)) {
          const src = page === 'game' ? 'offline.tsx' : `${page}.tsx`;
          setIframeUrls((prev) => ({ ...prev, [page]: src }));
          setLoadedPages((prev) => new Set([...prev, page]));
        }
      }
    },
    [currentPage, loadedPages]
  );

  // ============================================================================
  // DÉCONNEXION
  // ============================================================================

  const handleLogout = useCallback(async () => {
    if (!supabaseRef.current) return;
    try {
      setLoading(true);
      sessionStorage.removeItem('welcomeShown');
      await supabaseRef.current.auth.signOut();
      sessionStorage.setItem('manualLogout', 'true');
      showToast('Déconnexion', 'À bientôt !', 'success');
      setTimeout(() => (window.location.href = 'connexion.tsx'), 1000);
    } catch {
      setLoading(false);
      showToast('Erreur', 'Impossible de se déconnecter', 'error');
    }
  }, [showToast]);

  // ============================================================================
  // GESTION DU MENU (auto-fermeture)
  // ============================================================================

  const handleMenuToggle = () => {
    setMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
        menuTimeoutRef.current = setTimeout(() => setMenuOpen(false), 5000);
      }
      return next;
    });
  };

  // Fermer menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.navbar') && !target.closest('.menu-toggle-btn')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ============================================================================
  // INITIALISATION PRINCIPALE
  // ============================================================================

  useEffect(() => {
    const init = async () => {
      console.log('🚀 Initialisation World Connect...');

      await initServiceWorker();

      const manualLogout = sessionStorage.getItem('manualLogout');
      if (manualLogout === 'true') {
        sessionStorage.removeItem('manualLogout');
        await loadArticles();
        return;
      }

      if (!window.supabaseClient) {
        console.error('❌ supabaseClient introuvable');
        await loadArticles();
        return;
      }

      supabaseRef.current = window.supabaseClient.supabase;
      setLoading(true);

      try {
        const user = await window.supabaseClient.getCurrentUser();

        if (user) {
          setCurrentUser(user);

          try {
            const profile = await window.supabaseClient.getUserProfile(user.id);
            if (profile) {
              setUserProfile(profile);

              const welcomed = sessionStorage.getItem('welcomeShown');
              if (!welcomed) {
                sessionStorage.setItem('welcomeShown', 'true');
                setTimeout(() => {
                  setWelcomeVisible(true);
                  setTimeout(() => setWelcomeVisible(false), 3500);
                }, 500);
              }

              await loadUserReactions(user);
              setupRealTimeUpdates(user);
              loadNotificationCount(user);
              loadMessageCount(user);

              if (Notification.permission === 'granted') {
                const existing = await swRegistrationRef.current?.pushManager.getSubscription();
                if (!existing) subscribeToPush(user);
              } else if (Notification.permission === 'default') {
                setTimeout(() => requestNotificationPermission(user), 3000);
              }
            }
          } catch (err) {
            console.warn('⚠️ Erreur profil:', err);
            showToast('Attention', 'Impossible de charger votre profil', 'warning');
          }
        }
      } catch (err) {
        console.warn('⚠️ Erreur initialisation:', err);
      } finally {
        setLoading(false);
      }

      await loadArticles();

      // Intervalle badges (30s)
      const interval = setInterval(() => {
        if (currentUser) {
          loadNotificationCount(currentUser);
          loadMessageCount(currentUser);
        }
      }, 30000);

      // Visibilité
      const handleVisibility = () => {
        if (!document.hidden && currentUser) {
          loadNotificationCount(currentUser);
          loadMessageCount(currentUser);
          loadArticles();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Canvas Three.js */}
      <div id="canvas-container" ref={threeContainerRef}></div>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay show">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Chargement...</p>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>

      {/* Offline indicator */}
      <div className={`offline-indicator ${!isOnline ? 'show' : ''}`}>
        <i className="fas fa-wifi-slash"></i>
        <span>Vous êtes hors ligne</span>
      </div>

      {/* Welcome Popup */}
      <div className={`welcome-popup-overlay ${welcomeVisible ? 'show' : ''}`}></div>
      <div className={`welcome-popup ${welcomeVisible ? 'show' : ''}`}>
        <div className="welcome-popup-emoji">👋</div>
        <div className="welcome-popup-title">Bienvenue sur World Connect</div>
        <div className="welcome-popup-name">
          {userProfile ? `${userProfile.prenom} ${userProfile.nom}` : ''}
        </div>
        <div className="welcome-popup-subtitle">
          Nous sommes disponibles à tous vos Services. Laissez-nous votre numéro en Messages
        </div>
      </div>

      {/* Menu Toggle */}
      <button
        className={`menu-toggle-btn ${menuOpen ? 'active' : ''}`}
        onClick={handleMenuToggle}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Navbar */}
      <nav className={`navbar ${menuOpen ? 'show' : ''}`}>
        <div className="navbar-header">
          <button className="theme-toggle-mini" onClick={toggleTheme}>
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <div className="navbar-left">World Connect</div>
        </div>

        <div className="navbar-content">
          {(
            [
              { page: 'home', icon: 'fa-home', label: 'Accueil' },
              { page: 'messages', icon: 'fa-envelope', label: 'Messages', badge: messageCount },
              { page: 'notifications', icon: 'fa-bell', label: 'Notifications', badge: notifCount },
              { page: 'plus', icon: 'fa-plus-circle', label: 'World Connect' },
              { page: 'game', icon: 'fa-gamepad', label: 'Jeu 3D' },
            ] as { page: PageName; icon: string; label: string; badge?: number }[]
          ).map(({ page, icon, label, badge }) => (
            <div
              key={page}
              className={`nav-item ${currentPage === page ? 'active' : ''}`}
              onClick={() => navigateToPage(page)}
            >
              <i className={`fas ${icon}`}></i>
              <span>{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="badge">{badge}</span>
              )}
            </div>
          ))}

          <div className="menu-divider"></div>

          {!currentUser ? (
            <div
              className="menu-item"
              onClick={() => (window.location.href = 'connexion.tsx')}
            >
              <i className="fas fa-sign-in-alt"></i>
              <span>Connexion</span>
            </div>
          ) : (
            <div className="menu-item">
              <i className="fas fa-user"></i>
              <span>{userProfile ? `${userProfile.prenom} ${userProfile.nom}` : 'Mon Profil'}</span>
            </div>
          )}

          {userProfile?.role === 'admin' && (
            <div
              className="menu-item"
              onClick={() => (window.location.href = 'publier.tsx')}
            >
              <i className="fas fa-edit"></i>
              <span>Administration</span>
            </div>
          )}

          <div
            className="menu-item"
            onClick={() => (window.location.href = 'parametre.tsx')}
          >
            <i className="fas fa-cog"></i>
            <span>Paramètres</span>
          </div>

          <div className="menu-divider"></div>

          {currentUser && (
            <div className="menu-item logout" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Déconnexion</span>
            </div>
          )}
        </div>

        <div className="navbar-footer">
          <button className="theme-toggle" onClick={toggleTheme}>
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            <span>{isDarkMode ? 'Mode Clair' : 'Mode Sombre'}</span>
          </button>
        </div>
      </nav>

      {/* Bouton Recherche */}
      {currentPage === 'home' && (
        <button
          className={`search-toggle-btn ${searchPanelOpen ? 'active' : ''}`}
          onClick={() => {
            setSearchPanelOpen(!searchPanelOpen);
          }}
        >
          <i className="fas fa-search"></i>
          <span>Recherche</span>
        </button>
      )}

      {/* Panneau Recherche */}
      <div className={`search-panel ${searchPanelOpen ? 'show' : ''}`}>
        <h3>
          <i className="fas fa-search"></i> Rechercher des articles
        </h3>
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            placeholder="Mots-clés..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && performSearch()}
          />
          <button className="search-btn" onClick={performSearch}>
            <i className="fas fa-search"></i> Rechercher
          </button>
        </div>
        {showSearchInfo && (
          <div className="search-results-info">
            Résultats : <span>{searchResultCount}</span> article(s) trouvé(s)
          </div>
        )}
      </div>

      {/* Titre de page */}
      <div className="page-title">{pageLabels[currentPage]}</div>

      {/* SPA Container */}
      <div className="spa-container">
        {/* Page Accueil */}
        <div className={`spa-page ${currentPage === 'home' ? 'active' : ''}`}>
          {articlesLoading && (
            <div className="loader">
              <div className="spinner"></div>
              <p style={{ marginTop: 20, color: 'var(--text-tertiary)' }}>Chargement...</p>
            </div>
          )}

          {!articlesLoading && emptyState && emptyStateContent === 'offline' && (
            <div className="empty-state">
              <i className="fas fa-wifi-slash"></i>
              <h3>Mode hors ligne</h3>
              <p>Impossible de charger les articles sans connexion</p>
            </div>
          )}

          {!articlesLoading && emptyState && emptyStateContent === 'error' && (
            <div className="empty-state">
              <i
                className="fas fa-exclamation-triangle"
                style={{ color: 'var(--accent-yellow)' }}
              ></i>
              <h3>Erreur de chargement</h3>
              <p>Impossible de charger les articles pour le moment</p>
              <button
                onClick={loadArticles}
                style={{
                  marginTop: 20,
                  padding: '12px 24px',
                  background: 'var(--accent-kaki)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                <i className="fas fa-sync-alt" style={{ marginRight: 8 }}></i>Réessayer
              </button>
            </div>
          )}

          {!articlesLoading && emptyState && emptyStateContent === 'default' && (
            <div className="empty-state">
              <i className="fas fa-newspaper"></i>
              <h3>Aucun article</h3>
              <p>Revenez plus tard</p>
            </div>
          )}

          {!articlesLoading && !emptyState && (
            <div id="articles-container">
              {displayedArticles.map((article) => (
                <ArticleCard
                  key={article.article_id}
                  article={article}
                  userProfile={userProfile}
                  currentUser={currentUser}
                  userReactions={userReactions}
                  onReaction={handleReaction}
                  onDelete={deleteArticle}
                  onViewReactions={viewUserReactions}
                  onShare={handleShare}
                  allArticles={allArticles}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pages iframe */}
        {(['messages', 'notifications', 'plus', 'game'] as PageName[]).map((page) => (
          <div
            key={page}
            className={`spa-page ${currentPage === page ? 'active' : ''}`}
          >
            <div className="iframe-container">
              {!loadedPages.has(page) && (
                <div className="iframe-loader">
                  <div className="spinner"></div>
                </div>
              )}
              {iframeUrls[page] && (
                <iframe
                  className="page-iframe"
                  src={iframeUrls[page]}
                  title={pageLabels[page]}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default HomePage;
