// pages/usereact.tsx
// ✅ Pages Router — pas de 'use client'
// ✅ useRouter de 'next/router' — articleId via router.query
// ✅ supabase importé depuis @/lib/supabaseClient (plus de props)
// ✅ CSS inline conservé

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/lib/supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export type ReactionType = 'like' | 'love' | 'rire' | 'colere';
export type FilterType = ReactionType | 'all';

export interface RawReaction {
  acteur_id: string;
  prenom_acteur: string;
  nom_acteur: string;
  reaction_type: ReactionType;
  article_id: string;
  date_created: string;
}

export interface ArticleAuthorProfile {
  prenom: string;
  nom: string;
}

export interface Article {
  article_id: string;
  texte: string;
  date_created: string;
  users_profile: ArticleAuthorProfile;
}

export interface UserReactionEntry {
  type: ReactionType;
  date: Date;
}

export interface UserData {
  acteurId: string;
  prenom: string;
  nom: string;
  reactions: UserReactionEntry[];
  latestDate: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BATCH_SIZE = 1000;

const REACTION_CONFIG: Record<ReactionType, { icon: string; label: string; color: string }> = {
  like:   { icon: '👍', label: "J'aime",  color: '#3b82f6' },
  love:   { icon: '❤️', label: 'Amour',   color: '#ef4444' },
  rire:   { icon: '😂', label: 'Rire',    color: '#f59e0b' },
  colere: { icon: '😠', label: 'Colère',  color: '#dc2626' },
};

const FILTER_TABS: { type: FilterType; icon: string; label: string }[] = [
  { type: 'all',    icon: '📋', label: 'Toutes'  },
  { type: 'like',   icon: '👍', label: "J'aime"  },
  { type: 'love',   icon: '❤️', label: 'Amour'   },
  { type: 'rire',   icon: '😂', label: 'Rire'    },
  { type: 'colere', icon: '😠', label: 'Colère'  },
];

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const days = Math.floor(h / 24);
  if (days > 7)  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  if (days > 0)  return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  if (h > 0)     return `Il y a ${h} heure${h > 1 ? 's' : ''}`;
  if (m > 0)     return `Il y a ${m} minute${m > 1 ? 's' : ''}`;
  return "À l'instant";
}

function truncateText(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max) + '…';
}

function getInitials(prenom: string, nom: string): string {
  return `${(prenom || 'U')[0]}${(nom || '')[0] ?? ''}`.toUpperCase();
}

function groupByUser(reactions: RawReaction[]): UserData[] {
  const map: Record<string, UserData> = {};
  reactions.forEach((r) => {
    if (!map[r.acteur_id]) {
      map[r.acteur_id] = { acteurId: r.acteur_id, prenom: r.prenom_acteur, nom: r.nom_acteur, reactions: [], latestDate: new Date(0) };
    }
    const entry = map[r.acteur_id];
    const date = new Date(r.date_created);
    entry.reactions.push({ type: r.reaction_type, date });
    if (date > entry.latestDate) entry.latestDate = date;
  });
  return Object.values(map).sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
}

function countByType(reactions: RawReaction[]): Record<ReactionType, number> {
  const counts: Record<ReactionType, number> = { like: 0, love: 0, rire: 0, colere: 0 };
  reactions.forEach((r) => { if (r.reaction_type in counts) counts[r.reaction_type]++; });
  return counts;
}

function uniqueUsersByType(reactions: RawReaction[], type: ReactionType): number {
  return new Set(reactions.filter((r) => r.reaction_type === type).map((r) => r.acteur_id)).size;
}

// ============================================================================
// SHARED STYLE
// ============================================================================

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-secondary, #FFFFFF)',
  padding: 24, borderRadius: 20,
  boxShadow: '0 4px 20px rgba(139,139,92,0.12)',
  marginBottom: 24,
  border: '1px solid var(--border-color, #E8E8DC)',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function Avatar({ prenom, nom, size = 50 }: { prenom: string; nom: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #8B8B5C 0%, #6B6B4C 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.36,
      flexShrink: 0, boxShadow: '0 3px 10px rgba(139,139,92,0.3)',
    }}>
      {getInitials(prenom, nom)}
    </div>
  );
}

function ReactionBadge({ type, date }: { type: ReactionType; date: Date }) {
  const cfg = REACTION_CONFIG[type];
  return (
    <div title={`${cfg.label} — ${formatDate(date)}`} style={{
      padding: '8px 14px', borderRadius: 25, background: cfg.color,
      color: 'white', fontSize: 13, fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 6,
      boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
    }}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </div>
  );
}

function ReactionStatCard({ type, count }: { type: ReactionType; count: number }) {
  const cfg = REACTION_CONFIG[type];
  return (
    <div style={{
      background: 'var(--kaki-bg, #F5F5E8)', padding: 18, borderRadius: 14,
      display: 'flex', alignItems: 'center', gap: 14,
      border: `1px solid var(--border-color, #E8E8DC)`,
      borderLeft: `4px solid ${cfg.color}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}>
      <span style={{ fontSize: 28 }}>{cfg.icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary, #5A5A5A)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{cfg.label}</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary, #2C2C2C)', marginTop: 2 }}>{count}</span>
      </div>
    </div>
  );
}

function ArticleInfoCard({ article }: { article: Article }) {
  const { prenom, nom } = article.users_profile;
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <Avatar prenom={prenom} nom={nom} size={52} />
        <div>
          <h4 style={{ color: 'var(--text-primary, #2C2C2C)', fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{prenom} {nom}</h4>
          <p style={{ color: 'var(--text-tertiary, #8B8B8B)', fontSize: 13 }}>
            {new Date(article.date_created).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
      <p style={{
        color: 'var(--text-secondary, #5A5A5A)', fontSize: 15, lineHeight: 1.65,
        padding: 16, background: 'var(--kaki-bg, #F5F5E8)',
        borderRadius: 12, borderLeft: '4px solid var(--kaki-primary, #8B8B5C)', margin: 0,
      }}>
        {truncateText(article.texte, 100)}
      </p>
    </div>
  );
}

function ReactionsSummaryCard({ reactions, totalCount, totalUsers }: { reactions: RawReaction[]; totalCount: number; totalUsers: number }) {
  const counts = countByType(reactions);
  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary, #2C2C2C)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        📊 Résumé ({totalCount} réactions par {totalUsers} utilisateurs)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((type) => (
          <ReactionStatCard key={type} type={type} count={counts[type]} />
        ))}
      </div>
    </div>
  );
}

function FilterTabs({ activeFilter, reactions, totalUsers, onChange }: {
  activeFilter: FilterType;
  reactions: RawReaction[];
  totalUsers: number;
  onChange: (f: FilterType) => void;
}) {
  const getCount = (type: FilterType) =>
    type === 'all' ? totalUsers : uniqueUsersByType(reactions, type as ReactionType);

  return (
    <div style={{ ...cardStyle, display: 'flex', gap: 12, overflowX: 'auto', flexWrap: 'wrap', padding: 18 }}>
      {FILTER_TABS.map(({ type, icon, label }) => {
        const isActive = activeFilter === type;
        return (
          <button key={type} onClick={() => onChange(type)} style={{
            background: isActive ? 'linear-gradient(135deg, #8B8B5C 0%, #6B6B4C 100%)' : 'var(--kaki-bg, #F5F5E8)',
            border: isActive ? '2px solid #8B8B5C' : '2px solid transparent',
            padding: '12px 20px', borderRadius: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 14, fontWeight: 600,
            color: isActive ? 'white' : 'var(--text-secondary, #5A5A5A)',
            boxShadow: isActive ? '0 4px 12px rgba(139,139,92,0.25)' : 'none',
            transition: 'all 0.2s ease', whiteSpace: 'nowrap',
          }}>
            <span>{icon}</span>
            {label} ({getCount(type)})
          </button>
        );
      })}
    </div>
  );
}

function UserReactionRow({ user }: { user: UserData }) {
  const sorted = [...user.reactions].sort((a, b) => b.date.getTime() - a.date.getTime());
  return (
    <div style={{
      background: 'var(--kaki-bg, #F5F5E8)', padding: 18, borderRadius: 14,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      border: '1px solid var(--border-color, #E8E8DC)',
      transition: 'transform 0.2s', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
        <Avatar prenom={user.prenom} nom={user.nom} />
        <div>
          <h4 style={{ color: 'var(--text-primary, #2C2C2C)', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{user.prenom} {user.nom}</h4>
          <p style={{ color: 'var(--text-tertiary, #8B8B8B)', fontSize: 13 }}>Dernière réaction : {formatDate(user.latestDate)}</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
        {sorted.map((r, i) => <ReactionBadge key={i} type={r.type} date={r.date} />)}
      </div>
    </div>
  );
}

function LoadingState({ label = 'Chargement...' }: { label?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{
        border: '4px solid var(--border-color, #E8E8DC)',
        borderTopColor: '#8B8B5C', borderRadius: '50%',
        width: 50, height: 50, margin: '0 auto 18px',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{ color: 'var(--text-tertiary, #8B8B8B)', fontSize: 15, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

function EmptyState({ message = 'Aucune réaction' }: { message?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 70, marginBottom: 24, opacity: 0.4 }}>💔</div>
      <h3 style={{ fontSize: 22, marginBottom: 12, color: 'var(--text-primary, #2C2C2C)' }}>{message}</h3>
      <p style={{ color: 'var(--text-tertiary, #8B8B8B)' }}>Cet article n'a pas encore reçu de réactions.</p>
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

export default function UserReactionsPage() {
  // ✅ articleId récupéré depuis l'URL : /usereact?article_id=xxx
  const router = useRouter();
  const articleId = router.query.article_id as string | undefined;

  const [article, setArticle] = useState<Article | null>(null);
  const [allReactions, setAllReactions] = useState<RawReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [displayedCount, setDisplayedCount] = useState(BATCH_SIZE);

  // ── Fetch réactions (par batch) ────────────────────────────────────────────
  const fetchAllReactions = useCallback(async (id: string): Promise<RawReaction[]> => {
    const all: RawReaction[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error: err } = await supabase
        .from('reactions_with_actor_info')
        .select('*')
        .eq('article_id', id)
        .order('date_created', { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1) as unknown as { data: RawReaction[] | null; error: Error | null };

      if (err) throw err;
      if (!data || data.length === 0) { hasMore = false; break; }

      all.push(...data);
      if (data.length < BATCH_SIZE) { hasMore = false; } else { offset += BATCH_SIZE; }
    }
    return all;
  }, []);

  // ── Chargement initial ─────────────────────────────────────────────────────
  useEffect(() => {
    // Attendre que router.query soit prêt
    if (!router.isReady || !articleId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [reactionsData, articleResult] = await Promise.all([
          fetchAllReactions(articleId),
          supabase
            .from('articles')
            .select('*, users_profile(prenom, nom)')
            .eq('article_id', articleId)
            .single() as unknown as Promise<{ data: Article | null; error: Error | null }>,
        ]);

        if (cancelled) return;
        if (articleResult.error) throw articleResult.error;

        setAllReactions(reactionsData);
        setArticle(articleResult.data);
      } catch (err) {
        if (!cancelled) setError('Impossible de charger les réactions.');
        console.error('❌ [UserReactions]', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [router.isReady, articleId, fetchAllReactions]);

  // ── Données dérivées ───────────────────────────────────────────────────────
  const filteredReactions = useMemo(() =>
    activeFilter === 'all' ? allReactions : allReactions.filter((r) => r.reaction_type === activeFilter),
    [allReactions, activeFilter],
  );

  const allUsers = useMemo(() => groupByUser(filteredReactions), [filteredReactions]);
  const displayedUsers = useMemo(() => allUsers.slice(0, displayedCount), [allUsers, displayedCount]);
  const totalUsers = useMemo(() => new Set(allReactions.map((r) => r.acteur_id)).size, [allReactions]);
  const remaining = allUsers.length - displayedCount;

  useEffect(() => { setDisplayedCount(BATCH_SIZE); }, [activeFilter]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={{
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      background: '#FAFAF2', color: '#2C2C2C',
      minHeight: '100vh', padding: 24, lineHeight: 1.6,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ ...cardStyle, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 14, letterSpacing: -0.5, margin: 0 }}>
            ❤️ Réactions sur l'article
          </h1>
          {/* ✅ router.back() remplace window.history.back() */}
          <button onClick={() => router.back()} style={{
            background: 'linear-gradient(135deg, #8B8B5C 0%, #6B6B4C 100%)',
            border: 'none', padding: '12px 24px', borderRadius: 12,
            color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 15, fontWeight: 600,
            boxShadow: '0 4px 14px rgba(139,139,92,0.25)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
            ← Retour
          </button>
        </div>

        {/* Pas d'articleId */}
        {!articleId && !loading && (
          <EmptyState message="Aucun article sélectionné" />
        )}

        {loading && <LoadingState label="Chargement des statistiques..." />}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ fontSize: 22, marginBottom: 12 }}>Erreur de chargement</h3>
            <p style={{ color: 'var(--text-tertiary, #8B8B8B)' }}>{error}</p>
          </div>
        )}

        {!loading && !error && allReactions.length === 0 && articleId && <EmptyState />}

        {!loading && !error && allReactions.length > 0 && article && (
          <>
            <ArticleInfoCard article={article} />
            <ReactionsSummaryCard reactions={allReactions} totalCount={allReactions.length} totalUsers={totalUsers} />
            <FilterTabs activeFilter={activeFilter} reactions={allReactions} totalUsers={totalUsers} onChange={setActiveFilter} />

            <div style={{
              textAlign: 'center', padding: '14px 20px',
              color: 'var(--text-secondary, #5A5A5A)', fontSize: 14, fontWeight: 500,
              background: 'var(--kaki-bg, #F5F5E8)', borderRadius: 12,
              border: '1px solid var(--border-color, #E8E8DC)', marginBottom: 20,
            }}>
              Affichage de <strong style={{ color: '#8B8B5C' }}>{Math.min(displayedCount, allUsers.length)}</strong> sur{' '}
              <strong style={{ color: '#8B8B5C' }}>{allUsers.length}</strong> utilisateurs
            </div>

            {displayedUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary, #8B8B8B)' }}>
                Aucune réaction pour ce filtre.
              </div>
            ) : (
              <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {displayedUsers.map((user) => <UserReactionRow key={user.acteurId} user={user} />)}
              </div>
            )}

            {remaining > 0 && (
              <div style={{ textAlign: 'center', padding: '24px 20px' }}>
                <button onClick={() => setDisplayedCount((p) => p + BATCH_SIZE)} style={{
                  background: 'linear-gradient(135deg, #8B8B5C 0%, #6B6B4C 100%)',
                  border: 'none', padding: '14px 32px', borderRadius: 12,
                  color: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(139,139,92,0.25)',
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  ↓ Charger {Math.min(remaining, BATCH_SIZE)} utilisateur{remaining > 1 ? 's' : ''} supplémentaire{remaining > 1 ? 's' : ''}
                </button>
              </div>
            )}

            {remaining <= 0 && allUsers.length > 0 && (
              <p style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-tertiary, #8B8B8B)', fontSize: 14 }}>
                ✓ Tous les utilisateurs sont affichés
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
