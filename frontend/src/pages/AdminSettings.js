import React, { useEffect, useState } from 'react';
import api, { resultsService } from '../services/api';
import PageLoader from '../components/PageLoader';

function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setting, setSetting] = useState(null);
  const [thirdPlaceSnapshot, setThirdPlaceSnapshot] = useState(null);
  const [thirdPlaceOrder, setThirdPlaceOrder] = useState([]);
  const [savingThirdPlaces, setSavingThirdPlaces] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const applyThirdPlaceSnapshot = (snapshot) => {
    setThirdPlaceSnapshot(snapshot);
    setThirdPlaceOrder((snapshot?.thirdTeams || []).map(team => team.group_code));
  };

  const loadSettings = async () => {
    try {
      setError('');
      const [settingResult, thirdPlacesResult] = await Promise.allSettled([
        api.get('/admin/settings/knockout-predictions'),
        resultsService.getThirdPlaces()
      ]);
      if (settingResult.status === 'fulfilled') setSetting(settingResult.value.data);
      else setError(settingResult.reason?.response?.data?.error || 'Erreur lors du chargement des réglages');
      if (thirdPlacesResult.status === 'fulfilled') applyThirdPlaceSnapshot(thirdPlacesResult.value.data);
      else {
        setThirdPlaceSnapshot(null);
        setThirdPlaceOrder([]);
      }
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

  const moveThirdPlace = (groupCode, direction) => {
    setThirdPlaceOrder(prev => {
      const next = [...prev];
      const index = next.indexOf(groupCode);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const saveThirdPlaceOrder = async () => {
    try {
      setSavingThirdPlaces(true);
      setError('');
      setMessage('');
      const response = await resultsService.saveThirdPlaceOrder(thirdPlaceOrder);
      applyThirdPlaceSnapshot(response.data);
      setMessage('Ordre des meilleurs troisièmes sauvegardé. Le tableau final a été recalculé.');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde des meilleurs troisièmes');
    } finally {
      setSavingThirdPlaces(false);
    }
  };

  const resetThirdPlaceOrder = async () => {
    try {
      setSavingThirdPlaces(true);
      setError('');
      setMessage('');
      const response = await resultsService.saveThirdPlaceOrder([]);
      applyThirdPlaceSnapshot(response.data);
      setMessage('Ordre automatique rétabli. Les affichages prématurés sont nettoyés.');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réinitialisation des meilleurs troisièmes');
    } finally {
      setSavingThirdPlaces(false);
    }
  };

  if (loading) return <PageLoader title="Chargement des réglages..." icon="⚙️" subtitle="Lecture des accès pronostics" />;

  const knockoutOpen = Boolean(setting?.knockout_predictions_open);
  const thirdTeams = thirdPlaceSnapshot?.thirdTeams || [];
  const qualifiedThirdTeams = thirdPlaceSnapshot?.qualifiedThirdTeams || [];
  const requiredThirds = Number(thirdPlaceSnapshot?.required_third_place_qualifiers || 8);
  const thirdSlotsReady = Boolean(thirdPlaceSnapshot?.third_place_slots_ready);
  const thirdPlaceMode = thirdPlaceSnapshot?.third_place_resolution_mode || 'pending';

  return (
    <section className="admin-settings-card">
      <div className="settings-title">
        <div>
          <span>⚙️ Réglages</span>
          <h2>Accès aux pronostics</h2>
          <p>Contrôle les ouvertures globales et la configuration de la phase finale.</p>
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
          <p>Les matchs restent visibles sur la page Pronostics. Quand ce réglage est fermé, les joueurs ne peuvent pas encoder ou modifier les scores de la phase finale.</p>
          {setting?.updated_at && <small>Dernière modification : {String(setting.updated_at).substring(0, 16).replace('T', ' ')}</small>}
        </div>
        <button type="button" className={`toggle-button ${knockoutOpen ? 'is-on' : ''}`} onClick={toggleKnockout} disabled={saving}>{saving ? 'Mise à jour...' : knockoutOpen ? 'Refermer la phase finale' : 'Ouvrir la phase finale'}</button>
      </div>

      <div className={`third-settings-card ${thirdSlotsReady ? 'is-ready' : 'is-pending'}`}>
        <div className="third-settings-title">
          <div>
            <span>🥉 Meilleurs troisièmes</span>
            <h3>{thirdSlotsReady ? 'Tableau final prêt' : 'Tableau final en attente'}</h3>
            <p>Les troisièmes ne sont injectés en phase finale que quand les {requiredThirds} qualifiés sont connus. Avant ça, les matchs gardent les libellés du type 3A/B/C/D/F.</p>
          </div>
          <em>{thirdPlaceMode === 'manual' ? 'Mode manuel' : thirdPlaceMode === 'auto' ? 'Mode auto' : 'En attente'}</em>
        </div>
        <div className="third-status-grid"><div><strong>{qualifiedThirdTeams.length}/{requiredThirds}</strong><span>qualifiés verrouillés</span></div><div><strong>{thirdTeams.length}</strong><span>troisièmes connus</span></div><div><strong>{thirdSlotsReady ? 'Oui' : 'Non'}</strong><span>propagation active</span></div></div>
        {thirdTeams.length ? <div className="thirds-list">{thirdPlaceOrder.map((groupCode, index) => { const team = thirdTeams.find(item => item.group_code === groupCode); if (!team) return null; const isQualified = index < requiredThirds; return <div key={groupCode} className={`third-row ${isQualified ? 'is-qualified' : ''}`}><div className="third-rank">#{index + 1}</div><div className="third-main"><strong>{team.team_name}</strong><span>Groupe {team.group_code}{isQualified ? ' · qualifié provisoire' : ''}</span></div><div className="third-stats"><span>{team.points} pts</span><span>Diff {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}</span><span>BP {team.goals_for}</span></div><div className="third-actions"><button type="button" className="button secondary tiny" disabled={index === 0 || savingThirdPlaces} onClick={() => moveThirdPlace(groupCode, -1)}>↑</button><button type="button" className="button secondary tiny" disabled={index === thirdPlaceOrder.length - 1 || savingThirdPlaces} onClick={() => moveThirdPlace(groupCode, 1)}>↓</button></div></div>; })}</div> : <p className="settings-help">Encode les résultats d’un groupe complet pour voir apparaître son troisième.</p>}
        <div className="third-actions-footer"><button type="button" className="button secondary" disabled={savingThirdPlaces} onClick={resetThirdPlaceOrder}>Repasser en auto / nettoyer</button><button type="button" className="button primary" disabled={savingThirdPlaces || thirdPlaceOrder.length === 0} onClick={saveThirdPlaceOrder}>Valider l’ordre manuel</button></div>
      </div>

      <style>{styles}</style>
    </section>
  );
}

const styles = `
  .admin-settings-card { width: min(1220px, 100%); margin: 0 auto; border-radius: 22px; background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); box-shadow: 0 18px 55px rgba(0,0,0,.2); padding: 18px; }
  .settings-title, .third-settings-title { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
  .settings-title span, .setting-content span, .third-settings-title span { display: block; color: #0f766e; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .07em; }
  .settings-title h2 { margin: 4px 0 6px; color: #0f172a; font-size: 26px; letter-spacing: -.04em; }
  .third-settings-title h3, .setting-content h3 { margin: 3px 0 5px; color: #0f172a; font-size: 19px; }
  .settings-title p, .setting-content p, .third-settings-title p { margin: 0; color: #475569; font-size: 13px; line-height: 1.45; font-weight: 750; }
  .settings-alert { margin-bottom: 12px; padding: 10px 12px; border-radius: 14px; font-size: 13px; font-weight: 900; }
  .settings-alert.success { background: #dcfce7; color: #047857; }
  .settings-alert.error { background: #fee2e2; color: #b91c1c; }
  .setting-row { display: grid; grid-template-columns: 54px minmax(0, 1fr) auto; gap: 14px; align-items: center; border-radius: 18px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .setting-row.is-open { background: #ecfdf5; border-color: #99f6e4; }
  .setting-row.is-closed { background: #fff7ed; border-color: #fed7aa; }
  .setting-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 16px; background: white; box-shadow: inset 0 0 0 1px #e2e8f0; font-size: 24px; }
  .setting-content small { display: block; margin-top: 7px; color: #64748b; font-size: 11px; font-weight: 850; }
  .third-settings-card { margin-top: 14px; border-radius: 18px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .third-settings-card.is-ready { background: #ecfdf5; border-color: #99f6e4; }
  .third-settings-card.is-pending { background: #fff7ed; border-color: #fed7aa; }
  .third-settings-title em { padding: 7px 10px; border-radius: 999px; background: white; color: #92400e; font-style: normal; font-size: 11px; font-weight: 950; white-space: nowrap; }
  .third-status-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }
  .third-status-grid div { padding: 10px; border-radius: 14px; background: white; border: 1px solid #e2e8f0; }
  .third-status-grid strong { display: block; color: #0f172a; font-size: 20px; line-height: 1; }
  .third-status-grid span { display: block; margin-top: 5px; color: #64748b; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .04em; }
  .thirds-list { display: grid; gap: 8px; }
  .third-row { display: grid; grid-template-columns: 46px minmax(0, 1fr) auto auto; gap: 10px; align-items: center; padding: 9px; border-radius: 14px; background: white; border: 1px solid #e2e8f0; }
  .third-row.is-qualified { border-color: #99f6e4; background: #f0fdfa; }
  .third-rank { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 999px; background: #e2e8f0; color: #334155; font-size: 12px; font-weight: 950; }
  .third-main strong { display: block; color: #0f172a; font-size: 13px; }
  .third-main span { display: block; margin-top: 2px; color: #64748b; font-size: 11px; font-weight: 850; }
  .third-stats { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
  .third-stats span { padding: 5px 7px; border-radius: 999px; background: #f1f5f9; color: #334155; font-size: 11px; font-weight: 900; }
  .third-actions, .third-actions-footer { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
  .third-actions-footer { margin-top: 12px; }
  .settings-help { margin: 0; color: #64748b; font-weight: 850; }
  .toggle-button, .button { border: 0; border-radius: 999px; padding: 10px 14px; color: white; background: #0f172a; font-size: 13px; font-weight: 950; cursor: pointer; box-shadow: 0 10px 24px rgba(15,23,42,.18); white-space: nowrap; }
  .button.primary { background: linear-gradient(135deg, #0f766e, #d97706); }
  .toggle-button.is-on { background: #b91c1c; }
  .button.secondary { background: #e2e8f0; color: #334155; box-shadow: none; }
  .button.tiny { padding: 6px 9px; font-size: 11px; }
  .toggle-button:disabled, .button:disabled { opacity: .65; cursor: not-allowed; }
  @media (max-width: 760px) { .settings-title, .third-settings-title, .setting-row, .third-row, .third-status-grid { grid-template-columns: 1fr; } .settings-title, .third-settings-title { flex-direction: column; } .toggle-button { width: 100%; } .third-stats, .third-actions, .third-actions-footer { justify-content: flex-start; } }
`;

export default AdminSettings;
