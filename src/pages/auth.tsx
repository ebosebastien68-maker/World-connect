import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type MessageType = "error" | "success" | "info" | null;
type StrengthLevel = "weak" | "medium" | "strong" | null;
type AppState = "loading" | "form" | "error" | "success";

interface PasswordRequirements {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function checkPasswordStrength(password: string): { requirements: PasswordRequirements; strength: StrengthLevel } {
  const requirements: PasswordRequirements = {
    length: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const score = Object.values(requirements).filter(Boolean).length;
  const strength: StrengthLevel = score <= 1 ? "weak" : score <= 3 ? "medium" : "strong";
  return { requirements, strength };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: "30px" }}>
      <div style={{
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #3498db",
        borderRadius: "50%",
        width: 50, height: 50,
        animation: "spin 1s linear infinite",
        margin: "0 auto 20px",
      }} />
      <p style={{ color: "#666", fontWeight: 500 }}>Vérification en cours...</p>
    </div>
  );
}

function MessageBanner({ text, type }: { text: string; type: MessageType }) {
  if (!text || !type) return null;
  const styles: Record<string, { background: string; color: string; border: string }> = {
    error: { background: "#fee", color: "#c33", border: "2px solid #fcc" },
    success: { background: "#efe", color: "#2d7c2d", border: "2px solid #cfc" },
    info: { background: "#e3f2fd", color: "#1976d2", border: "2px solid #bbdefb" },
  };
  return (
    <div style={{
      padding: 15, borderRadius: 10, marginBottom: 25, textAlign: "center",
      animation: "fadeIn 0.3s ease-in",
      ...styles[type],
    }}>{text}</div>
  );
}

function ErrorView() {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>⚠️</div>
      <h2 style={{ color: "#2c3e50", marginBottom: 15, fontSize: 24 }}>Lien invalide ou expiré</h2>
      <p style={{ color: "#7f8c8d", lineHeight: 1.6, marginBottom: 30 }}>
        Ce lien de réinitialisation n'est plus valide. Il a peut-être expiré ou a déjà été utilisé.
      </p>
      <a href="connexion.html" style={{
        display: "inline-block", padding: 16, background: "#3498db", color: "white",
        borderRadius: 10, fontSize: 16, fontWeight: 600, textDecoration: "none",
        transition: "all 0.3s",
      }}>Retour à la connexion</a>
    </div>
  );
}

function SuccessView() {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 70, marginBottom: 20, animation: "scaleIn 0.5s ease-out" }}>✅</div>
      <h2 style={{ color: "#2d7c2d", marginBottom: 15, fontSize: 24 }}>Mot de passe modifié !</h2>
      <p style={{ color: "#7f8c8d", lineHeight: 1.6 }}>
        Votre mot de passe a été changé avec succès. Vous allez être redirigé vers la page de connexion...
      </p>
    </div>
  );
}

function PasswordInput({
  id, value, onChange, placeholder,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input
        type={visible ? "text" : "password"}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "••••••••"}
        style={{
          width: "100%", padding: "14px 45px 14px 15px",
          border: "2px solid #e0e0e0", borderRadius: 10,
          fontSize: 16, transition: "all 0.3s", background: "white",
          outline: "none",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#3498db"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52,152,219,0.1)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.boxShadow = "none"; }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        style={{
          position: "absolute", right: 15, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "#666", fontSize: 20, padding: 5, transition: "color 0.3s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#3498db")}
        onMouseLeave={e => (e.currentTarget.style.color = "#666")}
      >{visible ? "🙈" : "👁️"}</button>
    </div>
  );
}

function StrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const { requirements, strength } = checkPasswordStrength(password);

  const strengthConfig = {
    weak: { width: "33%", color: "#f44336", label: "Force : Faible" },
    medium: { width: "66%", color: "#ff9800", label: "Force : Moyenne" },
    strong: { width: "100%", color: "#4caf50", label: "Force : Forte" },
  };

  const cfg = strength ? strengthConfig[strength] : strengthConfig.weak;

  const reqs: { key: keyof PasswordRequirements; label: string }[] = [
    { key: "length", label: "Minimum 6 caractères" },
    { key: "uppercase", label: "Une lettre majuscule" },
    { key: "lowercase", label: "Une lettre minuscule" },
    { key: "number", label: "Un chiffre" },
  ];

  return (
    <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "#f8f9fa", animation: "fadeIn 0.3s ease" }}>
      <div style={{ height: 6, borderRadius: 3, background: "#e0e0e0", marginBottom: 10, overflow: "hidden" }}>
        <div style={{ height: "100%", width: cfg.width, background: cfg.color, borderRadius: 3, transition: "all 0.3s" }} />
      </div>
      <div style={{ fontSize: 12, color: cfg.color, marginBottom: 8, fontWeight: 600 }}>{cfg.label}</div>
      <div style={{ fontSize: 12, color: "#666" }}>
        {reqs.map(({ key, label }) => (
          <div key={key} style={{ padding: "4px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: requirements[key] ? "#4caf50" : "#ccc", fontSize: 16, fontWeight: requirements[key] ? "bold" : "normal" }}>
              {requirements[key] ? "✓" : "○"}
            </span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchMessage({ newPwd, confirmPwd }: { newPwd: string; confirmPwd: string }) {
  if (!confirmPwd) return null;
  const match = newPwd === confirmPwd;
  return (
    <div style={{ fontSize: 12, marginTop: 8, color: match ? "#4caf50" : "#f44336" }}>
      {match ? "✓ Les mots de passe correspondent" : "✗ Les mots de passe ne correspondent pas"}
    </div>
  );
}

function ResetForm({
  isValidSession,
  onSuccess,
}: {
  isValidSession: boolean;
  onSuccess: () => void;
}) {
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [message, setMessage] = useState<{ text: string; type: MessageType }>({ text: "", type: null });
  const [submitting, setSubmitting] = useState(false);

  const { requirements } = checkPasswordStrength(newPwd);
  const allMet = Object.values(requirements).every(Boolean);
  const pwdMatch = newPwd === confirmPwd && confirmPwd.length > 0;
  const canSubmit = allMet && pwdMatch && isValidSession && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidSession) { setMessage({ text: "Session invalide. Veuillez recommencer.", type: "error" }); return; }
    if (newPwd !== confirmPwd) { setMessage({ text: "Les mots de passe ne correspondent pas", type: "error" }); return; }
    if (!allMet) { setMessage({ text: "Le mot de passe ne respecte pas tous les critères de sécurité", type: "error" }); return; }

    setSubmitting(true);
    setMessage({ text: "", type: null });

    try {
      // @ts-ignore — supabaseInstance is provided by the external supabaseClient.js
      const supabaseInstance = (window as any).supabaseClient?.supabase;
      if (!supabaseInstance) throw new Error("Client Supabase non disponible");

      const { error } = await supabaseInstance.auth.updateUser({ password: newPwd });
      if (error) throw error;

      onSuccess();

      setTimeout(async () => {
        await supabaseInstance.auth.signOut();
        window.location.href = "connexion.html";
      }, 3000);
    } catch (err: any) {
      setMessage({ text: err.message || "Erreur lors de la réinitialisation du mot de passe", type: "error" });
      setSubmitting(false);
    }
  };

  return (
    <div>
      <MessageBanner text={message.text} type={message.type} />

      <form onSubmit={handleSubmit}>
        {/* New password */}
        <div style={{ marginBottom: 25 }}>
          <label style={{ display: "block", marginBottom: 8, color: "#2c3e50", fontWeight: 600, fontSize: 14 }}>
            Nouveau mot de passe
          </label>
          <PasswordInput id="new-password" value={newPwd} onChange={setNewPwd} />
          {newPwd && <StrengthIndicator password={newPwd} />}
        </div>

        {/* Confirm password */}
        <div style={{ marginBottom: 25 }}>
          <label style={{ display: "block", marginBottom: 8, color: "#2c3e50", fontWeight: 600, fontSize: 14 }}>
            Confirmer le mot de passe
          </label>
          <PasswordInput id="confirm-password" value={confirmPwd} onChange={setConfirmPwd} />
          <MatchMessage newPwd={newPwd} confirmPwd={confirmPwd} />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            width: "100%", padding: 16,
            background: canSubmit ? "#3498db" : "#ccc",
            color: "white", border: "none", borderRadius: 10,
            fontSize: 16, fontWeight: 600,
            cursor: canSubmit ? "pointer" : "not-allowed",
            transition: "all 0.3s", marginTop: 10,
          }}
          onMouseEnter={e => { if (canSubmit) { (e.currentTarget as HTMLElement).style.background = "#2980b9"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 25px rgba(52,152,219,0.3)"; } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = canSubmit ? "#3498db" : "#ccc"; (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
        >
          {submitting ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 25, paddingTop: 25, borderTop: "1px solid #e0e0e0" }}>
        <a href="connexion.html" style={{ color: "#3498db", textDecoration: "none", fontWeight: 600, fontSize: 14 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#2980b9"; (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#3498db"; (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
        >← Retour à la connexion</a>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ResetPassword() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [isValidSession, setIsValidSession] = useState(false);
  const initialized = useRef(false);

  const verifyRecoverySession = useCallback(async () => {
    try {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (type !== "recovery" || !accessToken) {
        setAppState("error");
        return;
      }

      // @ts-ignore
      const supabaseInstance = (window as any).supabaseClient?.supabase;
      if (!supabaseInstance) { setAppState("error"); return; }

      const { data: { user }, error } = await supabaseInstance.auth.getUser();
      if (error || !user) { setAppState("error"); return; }

      setIsValidSession(true);
      setAppState("form");
    } catch {
      setAppState("error");
    }
  }, []);

  const initializeApp = useCallback(() => {
    // @ts-ignore
    if ((window as any).supabaseClient) {
      verifyRecoverySession();
    } else {
      setTimeout(initializeApp, 100);
    }
  }, [verifyRecoverySession]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initializeApp();
    }
  }, [initializeApp]);

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
      `}</style>

      <div style={{
        background: "white", borderRadius: 20,
        boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
        overflow: "hidden", width: "100%", maxWidth: 500,
        animation: "slideIn 0.4s ease-out",
      }}>
        {/* Header */}
        <div style={{
          background: "white", padding: 40, textAlign: "center",
          borderBottom: "2px solid #f0f0f0",
        }}>
          <h1 style={{ fontSize: 28, marginBottom: 10, color: "#2c3e50" }}>🔐 Réinitialisation</h1>
          <p style={{ fontSize: 14, color: "#7f8c8d" }}>Créez un nouveau mot de passe sécurisé</p>
        </div>

        {/* Body */}
        <div style={{ padding: 40, background: "white" }}>
          {appState === "loading" && <Spinner />}
          {appState === "error" && <ErrorView />}
          {appState === "success" && <SuccessView />}
          {appState === "form" && (
            <ResetForm
              isValidSession={isValidSession}
              onSuccess={() => setAppState("success")}
            />
          )}
        </div>
      </div>
    </>
  );
}
