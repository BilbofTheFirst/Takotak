import React, { useEffect, useState } from 'react';
import api from '../services/api';
import PageLoader from '../components/PageLoader';

function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setting, setSetting] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadSettings = async () => {
    try {
      setError('');
      const response = await api.get('/admin/settings/knockout-predictions');
      setSetting(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des réglages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const toggleKnockout = async () => {
    const nextOpen = !setting?.knockout_predictions_open;
    try {
      setSaving(true);
      setError('');
      setMessage('');
      const response = await api.patch('/admin/settings/knockout-predictions', { open: nextOpen });
      setSetting(response.data);
      setMessage(response.data?.message || 'Réglage mis à jour.');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader title="Chargement des réglages..." icon="⚙️" subtitle="Lecture des accès pronostics" />;

  const knockoutOpen = Boolean(setting?.knockout_predictions_open);

  return (
    <section className="admin-settings-card">
      <div className="settings-title">
        <div>
          <span>⚙️ Réglages</span>
          <h2>Accès aux pronostics</h2>
          <p>Contrôle les ouvertures globales qui ne dépendent pas uniquement de l’horaire des matchs.</p>
        </div>
        <button type="button" className="button secondary" onClick={loadSettings}>Rafraîchir</button>
      </div>

      {error && <div className="settings-alert error">⚠️ {error}</div>}
      {message && <div className="settings-alert success">✅ {message}</div>}

      <div className={`setting-row ${knockoutOpen ? 'is-open' : 'is-closed'}`}>
        <div className="setting-icon">🏆</div>
        <div className="setting-content">
          <span>Phase finale</span>
          <h3>{knockoutOpen ? 'Pronostics ouverts' : 'Pronostics verrouillés'}</h3>
          <p>
            Les matchs restent visibles sur la page Pronostics. Quand ce réglage est fermé,
            les joueurs ne peuvent pas encoder ou modifier les scores de la phase finale.
          </p>
          {setting?.updated_at && <small>Dernière modification : {String(setting.updated_at).substring(0, 16).replace('T', ' ')}</small>}
        </div>
        <button type="button" className={`toggle-button ${knockoutOpen ? 'is-on' : ''}`} onClick={toggleKnockout} disabled={saving}>
          {saving ? 'Mise à jour...' : knockoutOpen ? 'Refermer la phase finale' : 'Ouvrir la phase finale'}
        </button>
      </div>

      <style>{`
        .admin-settings-card {
          width: min(1220px, 100%);
          margin: 0 auto;
          border-radius: 22px;
          background: rgba(255,255,255,.96);
          border: 1px solid rgba(255,255,255,.55);
          box-shadow: 0 18px 55px rgba(0,0,0,.2);
          padding: 18px;
        }
        .settings-title {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .settings-title span, .setting-content span {
          display: block;
          color: #0f766e;
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .07em;
        }
        .settings-title h2 {
          margin: 4px 0 6px;
          color: #0f172a;
          font-size: 26px;
          letter-spacing: -.04em;
        }
        .settings-title p, .setting-content p {
          margin: 0;
          color: #475569;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 750;
        }
        .settings-alert {
          margin-bottom: 12px;
          padding: 10px 12px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 900;
        }
        .settings-alert.success { background: #dcfce7; color: #047857; }
        .settings-alert.error { background: #fee2e2; color: #b91c1c; }
        .setting-row {
          display: grid;
          grid-template-columns: 54px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          border-radius: 18px;
          padding: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }
        .setting-row.is-open {
          background: #ecfdf5;
          border-color: #99f6e4;
        }
        .setting-row.is-closed {
          background: #fff7ed;
          border-color: #fed7aa;
        }
        .setting-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: white;
          box-shadow: inset 0 0 0 1px #e2e8f0;
          font-size: 24px;
        }
        .setting-content h3 {
          margin: 3px 0 5px;
          color: #0f172a;
          font-size: 19px;
        }
        .setting-content small {
          display: block;
          margin-top: 7px;
          color: #64748b;
          font-size: 11px;
          font-weight: 850;
        }
        .toggle-button, .button {
          border: 0;
          border-radius: 999px;
          padding: 10px 14px;
          color: white;
          background: #0f172a;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(15,23,42,.18);
          white-space: nowrap;
        }
        .toggle-button.is-on { background: #b91c1c; }
        .button.secondary { background: #e2e8f0; color: #334155; box-shadow: none; }
        .toggle-button:disabled { opacity: .65; cursor: not-allowed; }
        @media (max-width: 760px) {
          .settings-title, .setting-row { grid-template-columns: 1fr; }
          .settings-title { flex-direction: column; }
          .toggle-button { width: 100%; }
        }
      `}</style>
    </section>
  );
}

export default AdminSettings;
