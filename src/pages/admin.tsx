import { useState } from "react";

const API_URL = "https://odkbkloukpzvwxaomkfe.supabase.co/functions/v1/nowchange";

type AlertType = "success" | "error" | "info" | "";
type TabType = "email" | "userid";
type RoleType = "admin" | "user";

interface AlertState {
  message: string;
  type: AlertType;
  visible: boolean;
}

export default function AdminRoles() {
  const [currentTab, setCurrentTab] = useState<TabType>("email");
  const [selectedRole, setSelectedRole] = useState<RoleType>("admin");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>({ message: "", type: "", visible: false });

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [targetUserId, setTargetUserId] = useState("");

  const showAlert = (message: string, type: AlertType) => {
    setAlert({ message, type, visible: true });
    setTimeout(() => setAlert((prev) => ({ ...prev, visible: false })), 6000);
  };

  const switchTab = (tab: TabType) => {
    setCurrentTab(tab);
    setTargetEmail("");
    setTargetUserId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminEmail || !adminPassword) {
      showAlert("⚠️ Veuillez saisir vos identifiants administrateur", "error");
      return;
    }

    if (currentTab === "email" && !targetEmail) {
      showAlert("⚠️ Veuillez saisir l'email de l'utilisateur cible", "error");
      return;
    }

    if (currentTab === "userid" && !targetUserId) {
      showAlert("⚠️ Veuillez saisir l'ID de l'utilisateur cible", "error");
      return;
    }

    if (currentTab === "userid") {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(targetUserId)) {
        showAlert("⚠️ Format d'ID utilisateur invalide (UUID requis)", "error");
        return;
      }
    }

    setLoading(true);
    showAlert("🔄 Authentification en cours...", "info");

    try {
      const requestBody: Record<string, string> = {
        admin_email: adminEmail,
        admin_password: adminPassword,
        role: selectedRole,
        ...(currentTab === "email"
          ? { target_email: targetEmail }
          : { target_user_id: targetUserId }),
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userName = data.user?.name || "l'utilisateur";
        const roleEmoji = selectedRole === "admin" ? "👑" : "👤";
        const roleText = selectedRole === "admin" ? "administrateur" : "utilisateur standard";

        showAlert(
          `✅ <strong>Succès !</strong><br>${roleEmoji} <strong>${userName}</strong> est maintenant ${roleText}.<br><small>Modifié par: ${data.changed_by?.admin_email || "Admin"}</small>`,
          "success"
        );

        setTimeout(() => {
          setTargetEmail("");
          setTargetUserId("");
          setSelectedRole("admin");
        }, 2000);
      } else {
        let errorMessage = data.message || data.error || "Erreur inconnue";

        if (response.status === 401) {
          errorMessage = "🔐 <strong>Authentification échouée</strong><br>Email ou mot de passe incorrect.";
        } else if (response.status === 403) {
          errorMessage = errorMessage.includes("Origine")
            ? "🚫 <strong>Accès refusé</strong><br>Origine de la requête non autorisée."
            : "🚫 <strong>Accès refusé</strong><br>Vous n'avez pas les privilèges administrateur.";
        } else if (response.status === 404) {
          errorMessage = "❓ <strong>Utilisateur introuvable</strong><br>Vérifiez l'email ou l'ID saisi.";
        } else if (response.status === 400) {
          errorMessage = `⚠️ <strong>Données invalides</strong><br>${data.message || "Vérifiez les informations saisies."}`;
        }

        showAlert(errorMessage, "error");
      }
    } catch (error: unknown) {
      const err = error as Error;
      showAlert(
        `<strong>❌ Erreur de connexion</strong><br>Impossible de contacter le serveur. Vérifiez votre connexion internet.<br><small>Détails: ${err.message}</small>`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        .admin-body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          position: relative;
          overflow-x: hidden;
        }

        .admin-body::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: backgroundMove 20s linear infinite;
          pointer-events: none;
        }

        @keyframes backgroundMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        .admin-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
          padding: 50px;
          max-width: 600px;
          width: 100%;
          position: relative;
          z-index: 1;
          animation: slideUp 0.6s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .admin-header {
          text-align: center;
          margin-bottom: 35px;
        }

        .icon-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          width: 70px;
          height: 70px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .admin-h1 {
          color: #1a1a1a;
          margin-bottom: 8px;
          font-size: 32px;
          font-weight: 700;
        }

        .admin-subtitle {
          color: #666;
          font-size: 15px;
          font-weight: 400;
        }

        .section-title {
          color: #333;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f0f0f0;
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          background: #f5f5f5;
          padding: 6px;
          border-radius: 12px;
        }

        .tab {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          color: #666;
          transition: all 0.3s ease;
        }

        .tab.active {
          background: white;
          color: #667eea;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .tab:hover:not(.active) {
          color: #333;
        }

        .form-section {
          animation: fadeIn 0.4s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-group {
          margin-bottom: 24px;
        }

        .admin-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #333;
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .admin-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.3s ease;
          background: white;
          box-sizing: border-box;
        }

        .admin-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .admin-input::placeholder {
          color: #9ca3af;
        }

        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 10px;
        }

        .role-option {
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          background: white;
        }

        .role-option:hover {
          border-color: #667eea;
          transform: translateY(-2px);
        }

        .role-option.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        }

        .role-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .role-name {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .submit-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
          position: relative;
          overflow: hidden;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(102, 126, 234, 0.4);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          cursor: not-allowed;
        }

        .alert-box {
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          animation: slideIn 0.4s ease;
          font-size: 14px;
          font-weight: 500;
          border-left: 4px solid;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .alert-success {
          background: #ecfdf5;
          color: #065f46;
          border-color: #10b981;
        }

        .alert-error {
          background: #fef2f2;
          color: #991b1b;
          border-color: #ef4444;
        }

        .alert-info {
          background: #eff6ff;
          color: #1e40af;
          border-color: #3b82f6;
        }

        .loader {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
          margin-right: 10px;
          vertical-align: middle;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .info-box {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-left: 4px solid #3b82f6;
          padding: 18px;
          border-radius: 12px;
          margin-bottom: 30px;
          font-size: 14px;
          color: #1e40af;
          line-height: 1.6;
        }

        .info-box strong {
          color: #1e3a8a;
          display: block;
          margin-bottom: 6px;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
          margin: 30px 0;
        }

        .admin-section-box {
          background: #f9fafb;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 25px;
          border: 2px solid #e5e7eb;
        }

        @media (max-width: 640px) {
          .admin-container { padding: 30px 20px; }
          .admin-h1 { font-size: 26px; }
          .role-selector { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="admin-body">
        <div className="admin-container">
          <div className="admin-header">
            <div className="icon-badge">🔐</div>
            <h1 className="admin-h1">Administration</h1>
            <p className="admin-subtitle">Gestion sécurisée des rôles utilisateurs</p>
          </div>

          <div className="info-box">
            <strong>🔒 Authentification Requise</strong>
            Connectez-vous avec vos identifiants administrateur pour modifier les rôles utilisateurs.
            Seuls les comptes avec privilèges admin peuvent accéder à cette fonctionnalité.
          </div>

          {alert.visible && (
            <div
              className={`alert-box alert-${alert.type}`}
              dangerouslySetInnerHTML={{ __html: alert.message }}
            />
          )}

          <form onSubmit={handleSubmit}>
            {/* Section Authentification Admin */}
            <div className="admin-section-box">
              <div className="section-title">🛡️ Authentification Administrateur</div>

              <div className="form-group">
                <label className="admin-label">
                  <span>📧</span>
                  <span>Votre Email Admin</span>
                </label>
                <input
                  type="email"
                  className="admin-input"
                  placeholder="admin@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="admin-label">
                  <span>🔑</span>
                  <span>Votre Mot de Passe</span>
                </label>
                <input
                  type="password"
                  className="admin-input"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="divider" />

            {/* Section Utilisateur Cible */}
            <div className="section-title">🎯 Utilisateur Cible</div>

            <div className="tabs">
              <button
                type="button"
                className={`tab ${currentTab === "email" ? "active" : ""}`}
                onClick={() => switchTab("email")}
              >
                Par Email
              </button>
              <button
                type="button"
                className={`tab ${currentTab === "userid" ? "active" : ""}`}
                onClick={() => switchTab("userid")}
              >
                Par User ID
              </button>
            </div>

            {currentTab === "email" && (
              <div className="form-section">
                <div className="form-group">
                  <label className="admin-label">
                    <span>👤</span>
                    <span>Email de l'utilisateur</span>
                  </label>
                  <input
                    type="email"
                    className="admin-input"
                    placeholder="utilisateur@example.com"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {currentTab === "userid" && (
              <div className="form-section">
                <div className="form-group">
                  <label className="admin-label">
                    <span>🆔</span>
                    <span>ID de l'utilisateur (UUID)</span>
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="a58c273b-7a15-4aa4-95af-691589d72bbb"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    pattern="[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"
                  />
                </div>
              </div>
            )}

            <div className="divider" />

            {/* Sélection du rôle */}
            <div className="form-group">
              <label className="admin-label">
                <span>⚡</span>
                <span>Rôle à attribuer</span>
              </label>
              <div className="role-selector">
                <div
                  className={`role-option ${selectedRole === "admin" ? "selected" : ""}`}
                  onClick={() => setSelectedRole("admin")}
                >
                  <div className="role-icon">👑</div>
                  <div className="role-name">Administrateur</div>
                </div>
                <div
                  className={`role-option ${selectedRole === "user" ? "selected" : ""}`}
                  onClick={() => setSelectedRole("user")}
                >
                  <div className="role-icon">👤</div>
                  <div className="role-name">Utilisateur</div>
                </div>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="loader" />
                  Authentification et traitement...
                </>
              ) : (
                "Appliquer le changement de rôle"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
