import React, { useEffect, useState } from 'react';
import api from '../services/api';
import PageLoader from '../components/PageLoader';

const TEMPORARY_PASSWORD = 'takotak';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      setError('');
      const response = await api.get('/admin/users');
      setUsers(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetPassword = async (user) => {
    if (!window.confirm(`Réinitialiser le mot de passe de ${user.username} à "${TEMPORARY_PASSWORD}" ?`)) {
      return;
    }

    try {
      setSavingUserId(user.id);
      setMessage('');
      setError('');
      await api.post(`/admin/users/${user.id}/reset-password`);
      setMessage(`Mot de passe de ${user.username} réinitialisé à "${TEMPORARY_PASSWORD}".`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading) {
    return <PageLoader title="Chargement des utilisateurs..." icon="👥" subtitle="Préparation de la liste" />;
  }

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Administration</span>
          <h1>👥 Utilisateurs</h1>
          <p>Réinitialise manuellement un mot de passe à <strong>{TEMPORARY_PASSWORD}</strong>. L’utilisateur pourra ensuite se connecter et le changer dans son profil.</p>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-title compact-title">
          <div>
            <span>Comptes</span>
            <h2>Liste des utilisateurs</h2>
          </div>
          <button type="button" className="button secondary" onClick={loadUsers}>Rafraîchir</button>
        </div>

        {message && <div className="admin-alert success">✅ {message}</div>}
        {error && <div className="admin-alert error">❌ {error}</div>}

        <div className="users-admin-table">
          <div className="users-admin-header">
            <span>Pseudo</span>
            <span>Email</span>
            <span>Rôle</span>
            <span>Action</span>
          </div>

          {users.map(user => (
            <div key={user.id} className="users-admin-row">
              <strong>{user.username}</strong>
              <span>{user.email}</span>
              <span>{user.is_admin ? 'Admin' : 'Joueur'}</span>
              <button
                type="button"
                className="button secondary small"
                disabled={savingUserId === user.id}
                onClick={() => resetPassword(user)}
              >
                {savingUserId === user.id ? '...' : 'Reset à takotak'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .admin-page { min-height: 100vh; padding: 24px 18px 42px; background: radial-gradient(circle at top left, rgba(217,119,6,.13), transparent 32%), radial-gradient(circle at top right, rgba(15,118,110,.16), transparent 32%), linear-gradient(135deg, #071b16 0%, #0f172a 44%, #111827 100%); color: #0f172a; }
        .admin-hero { width: min(1220px, 100%); margin: 0 auto 16px; color: white; }
        .admin-eyebrow { display: inline-flex; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #fde68a; margin-bottom: 10px; }
        .admin-hero h1 { margin: 0 0 7px; font-size: clamp(28px, 3.4vw, 44px); line-height: 1; letter-spacing: -.04em; }
        .admin-hero p { margin: 0; color: rgba(255,255,255,.76); font-size: 14px; line-height: 1.5; }
        .admin-card { width: min(1220px, 100%); margin: 0 auto 16px; background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); border-radius: 18px; padding: 16px; box-shadow: 0 18px 55px rgba(0,0,0,.2); }
        .admin-card-title { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
        .admin-card-title span { display: block; color: #0f766e; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; }
        .admin-card-title h2 { margin: 2px 0 0; color: #0f172a; font-size: 20px; }
        .compact-title { align-items: center; }
        .button { border: 0; border-radius: 999px; padding: 9px 13px; font-size: 12px; font-weight: 950; cursor: pointer; }
        .button.secondary { background: #e2e8f0; color: #0f172a; }
        .button.small { padding: 8px 11px; font-size: 11px; }
        .button:disabled { opacity: .45; cursor: not-allowed; }
        .admin-alert { padding: 11px 13px; border-radius: 12px; margin-bottom: 12px; font-weight: 800; font-size: 13px; }
        .admin-alert.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .admin-alert.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .users-admin-table { border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
        .users-admin-header, .users-admin-row { display: grid; grid-template-columns: 1.2fr 1.8fr .7fr 1fr; gap: 10px; align-items: center; padding: 11px 12px; }
        .users-admin-header { background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; }
        .users-admin-row { border-top: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; }
        .users-admin-row span { color: #334155; overflow-wrap: anywhere; }
        @media (max-width: 760px) {
          .users-admin-header { display: none; }
          .users-admin-row { grid-template-columns: 1fr; gap: 7px; }
        }
      `}</style>
    </div>
  );
}

export default AdminUsers;
