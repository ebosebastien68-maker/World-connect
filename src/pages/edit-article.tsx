// ============================================================================
// EDIT ARTICLE - WORLD CONNECT
// ============================================================================
// Conversion complète de edit-article.html en React TSX
// Props : articleId + supabaseClient
// ============================================================================

import { useState, useEffect, useRef, useCallback, type ChangeEvent, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

interface ArticleImage {
  image_id: string;
  image_url: string;
}

interface Article {
  article_id: string;
  texte: string;
  texte_url: string | null;
  vente_url: string | null;
  whatsapp_url: string | null;
  article_images: ArticleImage[];
}

interface ArticleFormValues {
  texte: string;
  texte_url: string;
  vente_url: string;
  whatsapp_url: string;
}

interface PreviewFile {
  name: string;
  previewUrl: string;
  file: File;
}

type MessageState = { text: string; type: 'success' | 'error' } | null;

export interface EditArticleProps {
  articleId: string;
  supabaseClient: SupabaseClient;
  /** Appelé après une mise à jour réussie (remplace window.location.href = 'index.html') */
  onSuccess?: () => void;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const BUCKET_NAME = 'articles-images';

// ============================================================================
// HELPERS
// ============================================================================

/** Extrait le chemin relatif au bucket depuis une URL publique Supabase Storage */
function extractStoragePath(imageUrl: string): string {
  try {
    const url = new URL(imageUrl);
    const marker = `/${BUCKET_NAME}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx !== -1) return url.pathname.slice(idx + marker.length);
    const parts = url.pathname.split(marker);
    if (parts.length === 2) return parts[1];
  } catch { /* URL invalide */ }
  throw new Error("Impossible d'extraire le chemin de l'image depuis l'URL.");
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// --- Spinner ---
function Spinner() {
  return (
    <div style={{
      width: 20, height: 20,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff', borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      flexShrink: 0,
    }} />
  );
}

// --- Image card (existing) ---
interface ExistingImageCardProps {
  img: ArticleImage;
  onDelete: (imageId: string, imageUrl: string) => void;
}

function ExistingImageCard({ img, onDelete }: ExistingImageCardProps) {
  return (
    <div style={styles.imageWrapper}>
      <img src={img.image_url} alt="Image de l'article" style={styles.imageThumb} />
      <button
        type="button"
        title="Supprimer l'image"
        onClick={() => onDelete(img.image_id, img.image_url)}
        style={styles.deleteImageBtn}
      >
        🗑
      </button>
    </div>
  );
}

// --- Image card (preview) ---
function PreviewImageCard({ file }: { file: PreviewFile }) {
  return (
    <div style={styles.imageWrapper}>
      <img src={file.previewUrl} alt={`Aperçu ${file.name}`} style={styles.imageThumb} />
    </div>
  );
}

// --- Form message ---
function FormMessage({ message }: { message: MessageState }) {
  if (!message) return null;
  return (
    <div style={{
      ...styles.formMessage,
      ...(message.type === 'success' ? styles.formMessageSuccess : styles.formMessageError),
    }}>
      {message.text}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EditArticle({ articleId, supabaseClient: supabase, onSuccess }: EditArticleProps) {
  // --- State ---
  const [form, setForm] = useState<ArticleFormValues>({
    texte: '',
    texte_url: '',
    vente_url: '',
    whatsapp_url: '',
  });
  const [existingImages, setExistingImages] = useState<ArticleImage[]>([]);
  const [newFiles, setNewFiles] = useState<PreviewFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // FETCH ARTICLE
  // ============================================================================

  const fetchArticle = useCallback(async () => {
    setLoading(true);
    setFatalError(null);

    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*, article_images(image_id, image_url)')
        .eq('article_id', articleId)
        .single();

      if (error) throw error;

      const article = data as Article;

      setForm({
        texte:        article.texte        ?? '',
        texte_url:    article.texte_url    ?? '',
        vente_url:    article.vente_url    ?? '',
        whatsapp_url: article.whatsapp_url ?? '',
      });
      setExistingImages(article.article_images ?? []);

    } catch (err) {
      console.error("Erreur de chargement de l'article:", err);
      setFatalError("Impossible de charger l'article.");
    } finally {
      setLoading(false);
    }
  }, [supabase, articleId]);

  useEffect(() => { fetchArticle(); }, [fetchArticle]);

  // ============================================================================
  // DELETE EXISTING IMAGE
  // ============================================================================

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette image définitivement ?')) return;

    try {
      // 1. Supprimer l'enregistrement en base
      const { error: dbError } = await supabase
        .from('article_images')
        .delete()
        .eq('image_id', imageId);

      if (dbError) throw dbError;

      // 2. Supprimer le fichier dans le bucket
      try {
        const storagePath = extractStoragePath(imageUrl);
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([storagePath]);

        if (storageError) console.warn('Avertissement suppression storage:', storageError);
      } catch (e) {
        console.warn('Suppression storage échouée ou chemin non extrait :', e);
      }

      // 3. Retirer de l'état local
      setExistingImages((prev) => prev.filter((img) => img.image_id !== imageId));

    } catch (err) {
      console.error("Erreur de suppression d'image:", err);
      alert('Une erreur est survenue lors de la suppression.');
    }
  };

  // ============================================================================
  // FILE PICKER — aperçu
  // ============================================================================

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    // Révoquer les anciennes URLs d'aperçu pour éviter les fuites mémoire
    newFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));

    setNewFiles(
      files.map((file) => ({
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        file,
      })),
    );
  };

  // Nettoyer les object URLs à la destruction du composant
  useEffect(() => {
    return () => { newFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // SUBMIT
  // ============================================================================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      // 1. Mettre à jour les champs texte
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          texte:        form.texte,
          texte_url:    form.texte_url    || null,
          vente_url:    form.vente_url    || null,
          whatsapp_url: form.whatsapp_url || null,
        })
        .eq('article_id', articleId);

      if (updateError) throw updateError;

      // 2. Uploader les nouvelles images
      if (newFiles.length > 0) {
        const uploadResults = await Promise.all(
          newFiles.map(({ file }) => {
            const filePath = `public/${Date.now()}-${file.name}`;
            return supabase.storage.from(BUCKET_NAME).upload(filePath, file);
          }),
        );

        const newImageRecords: { article_id: string; image_url: string }[] = [];

        for (const result of uploadResults) {
          if (result.error) throw result.error;
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(result.data.path);
          newImageRecords.push({ article_id: articleId, image_url: urlData.publicUrl });
        }

        if (newImageRecords.length > 0) {
          const { error: insertError } = await supabase
            .from('article_images')
            .insert(newImageRecords);
          if (insertError) throw insertError;
        }
      }

      setMessage({ text: '✅ Article mis à jour avec succès !', type: 'success' });

      // Redirection / callback après 2s
      setTimeout(() => {
        if (onSuccess) { onSuccess(); } else { window.location.href = 'index.html'; }
      }, 2000);

    } catch (err) {
      const error = err as Error;
      console.error('Erreur de mise à jour:', error);
      setMessage({ text: `❌ Erreur : ${error.message}`, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER — états
  // ============================================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.stateCenter}>
            <div style={{ ...styles.loaderRing }} />
            <p style={{ color: '#666', marginTop: 12 }}>Chargement de l'article…</p>
          </div>
        </div>
      </div>
    );
  }

  if (fatalError) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.stateCenter}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
            <h1 style={{ fontSize: 22, color: '#333' }}>Erreur</h1>
            <p style={{ color: '#666', marginTop: 8 }}>{fatalError}</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER — formulaire
  // ============================================================================

  return (
    <div style={styles.page}>
      {/* Animation keyframe spin injectée une seule fois */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={styles.container}>
        <h1 style={styles.h1}>✏️ Modifier l'Article</h1>

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Contenu ── */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Contenu de l'article</label>
            <textarea
              style={{ ...styles.formControl, minHeight: 150, resize: 'vertical' }}
              value={form.texte}
              onChange={(e) => setForm((f) => ({ ...f, texte: e.target.value }))}
              required
            />
          </div>

          {/* ── Lien article ── */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Lien associé (URL)</label>
            <input
              type="url"
              style={styles.formControl}
              value={form.texte_url}
              onChange={(e) => setForm((f) => ({ ...f, texte_url: e.target.value }))}
              placeholder="https://exemple.com"
            />
          </div>

          {/* ── Lien vente ── */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Lien de vente (URL)</label>
            <input
              type="url"
              style={styles.formControl}
              value={form.vente_url}
              onChange={(e) => setForm((f) => ({ ...f, vente_url: e.target.value }))}
              placeholder="https://boutique.com/produit"
            />
          </div>

          {/* ── WhatsApp ── */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Lien WhatsApp</label>
            <input
              type="url"
              style={styles.formControl}
              value={form.whatsapp_url}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp_url: e.target.value }))}
              placeholder="https://wa.me/..."
            />
          </div>

          {/* ── Images existantes ── */}
          <h2 style={styles.h2}>🖼 Gérer les Images</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Images actuelles</label>
            {existingImages.length > 0 ? (
              <div style={styles.imagesGrid}>
                {existingImages.map((img) => (
                  <ExistingImageCard key={img.image_id} img={img} onDelete={handleDeleteImage} />
                ))}
              </div>
            ) : (
              <p style={{ color: '#666', fontSize: 14 }}>Aucune image pour cet article.</p>
            )}
          </div>

          {/* ── Upload nouvelles images ── */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Ajouter de nouvelles images</label>

            <div
              style={styles.uploadLabel}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>☁️</span>
              <span>Cliquez ici pour choisir des images</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {/* ── Aperçu nouvelles images ── */}
          {newFiles.length > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Aperçu des nouvelles images</label>
              <div style={styles.imagesGrid}>
                {newFiles.map((f) => (
                  <PreviewImageCard key={f.name} file={f} />
                ))}
              </div>
            </div>
          )}

          {/* ── Bouton submit ── */}
          <button type="submit" disabled={submitting} style={{
            ...styles.btnSubmit,
            ...(submitting ? styles.btnSubmitDisabled : {}),
          }}>
            <span>{submitting ? 'Mise à jour…' : 'Mettre à jour'}</span>
            {submitting && <Spinner />}
          </button>
        </form>

        <FormMessage message={message} />
      </div>
    </div>
  );
}

// ============================================================================
// STYLES (CSS-in-JS avec fallback sur les CSS vars du projet)
// ============================================================================

const styles = {
  page: {
    fontFamily: "'Segoe UI', sans-serif",
    background: 'var(--bg-primary, #f5f7fa)',
    color: 'var(--text-primary, #333)',
    minHeight: '100vh',
    padding: 20,
  } as React.CSSProperties,

  container: {
    maxWidth: 800,
    margin: '0 auto',
    background: 'var(--bg-secondary, #fff)',
    padding: 30,
    borderRadius: 15,
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  } as React.CSSProperties,

  h1: {
    textAlign: 'center' as const,
    marginBottom: 25,
    fontWeight: 600,
    fontSize: 24,
  },

  h2: {
    textAlign: 'center' as const,
    marginTop: 40,
    marginBottom: 25,
    fontWeight: 600,
    fontSize: 20,
    color: 'var(--text-secondary, #666)',
  },

  formGroup: { marginBottom: 20 } as React.CSSProperties,

  label: {
    display: 'block',
    marginBottom: 8,
    fontWeight: 600,
    fontSize: 14,
    color: 'var(--text-secondary, #666)',
  } as React.CSSProperties,

  formControl: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid var(--border-color, #e0e0e0)',
    borderRadius: 8,
    fontSize: 16,
    background: 'var(--bg-primary, #f5f7fa)',
    color: 'var(--text-primary, #333)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  } as React.CSSProperties,

  imagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 15,
  } as React.CSSProperties,

  imageWrapper: {
    position: 'relative' as const,
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },

  imageThumb: {
    width: '100%',
    height: 120,
    objectFit: 'cover' as const,
    display: 'block',
  },

  deleteImageBtn: {
    position: 'absolute' as const,
    top: 5,
    right: 5,
    width: 28,
    height: 28,
    background: '#ff4757',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  uploadLabel: {
    display: 'block',
    padding: 20,
    border: '2px dashed var(--border-color, #e0e0e0)',
    borderRadius: 8,
    textAlign: 'center' as const,
    cursor: 'pointer',
    color: 'var(--text-secondary, #666)',
    transition: 'border-color 0.2s, background 0.2s',
  },

  btnSubmit: {
    width: '100%',
    padding: 15,
    border: 'none',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    transition: 'transform 0.2s, box-shadow 0.2s',
  } as React.CSSProperties,

  btnSubmitDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  } as React.CSSProperties,

  formMessage: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    textAlign: 'center' as const,
    fontSize: 15,
    fontWeight: 500,
  },

  formMessageSuccess: {
    background: '#d4edda',
    color: '#155724',
  },

  formMessageError: {
    background: '#f8d7da',
    color: '#721c24',
  },

  stateCenter: {
    textAlign: 'center' as const,
    padding: '60px 20px',
  },

  loaderRing: {
    width: 48,
    height: 48,
    border: '4px solid #e0e0e0',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto',
  } as React.CSSProperties,
};
