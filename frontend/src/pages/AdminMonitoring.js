import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import PageLoader from '../components/PageLoader';

const formatDateTime = (value) => {
  if (!value) return '—';
  return value.substring(0, 16).replace('T', ' ');
};

const emptySpecial = {
  completed: 0,
  total: 3,
  missing: [],
  missing_count: 0,
  complete: false,
  global_locked: false,
  admin_unlocked: false,
  locked: false,
  urgent: false
};

const getSpecial2 = (user) => user.special2 || emptySpecial;
const getSpecial3 = (user) => user.special3 || emptySpecial;

const buildReminderText = (users) => {
  const names = users.map(user => user.username).join(', ');
  if (!names) return 'Tout le monde est à jour 🎉';
  return `Petit rappel Takotak : ${names}, pensez à compléter vos pronostics des prochaines 24h${users.some(user => user.bonus.urgent || user.special.urgent || getSpecial2(user).urgent || getSpecial3(user).urgent) ? ' et les bonus/spéciaux encore ouverts' : ''}. Il y a beaucoup de points à prendre 🙂`;
};

function AdminMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [unlockSavingUserId, setUnlockSavingUserId] = useState(null);
  const [specialUnlockSavingKey, setSpecialUnlockSavingKey] = useState(null);

  const loadMonitoring = async () => {
    try {
      setError('');
      setCopied(false);
      const response = await api.get('/admin/monitoring');
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement du monitoring');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoring();
  }, []);

  const users = data?.users || [];
  const usersToRemind = useMemo(() => users.filter(user => user.should_remind), [users]);
  const bonusIncompleteUsers = useMemo(() => data?.bonus_incomplete_users || users.filter(user => !user.bonus.complete), [data, users]);
  const reminderText = useMemo(() => buildReminderText(usersToRemind), [usersToRemind]);

  const copyReminder = async () => {
    try {
      await navigator.clipboard.writeText(reminderText);
      setCopied(true);
    } catch {
      prompt('Copie le message de rappel :', reminderText);
    }
  };

  const toggleBonusUnlock = async (user) => {
    const nextUnlocked = !user.bonus.admin_unlocked;
    try {
      setUnlockSavingUserId(user.id);
      await api.patch(`/admin/users/${user.id}/bonus-unlock`, { unlocked: nextUnlocked });
      await loadMonitoring();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la modification de la réouverture bonus');
    } finally {
      setUnlockSavingUserId(null);
    }
  };

  const toggleSpecialUnlock = async (user, matchday) => {
    const special = matchday === 3 ? getSpecial3(user) : getSpecial2(user);
    const nextUnlocked = !special.admin_unlocked;
    const savingKey = `${user.id}-${matchday}`;
    try {
      setSpecialUnlockSavingKey(savingKey);
      await api.patch(`/admin/users/${user.id}/special-unlock`, { matchday, unlocked: nextUnlocked });
      await loadMonitoring();
    } catch (err) {
      setError(err.response?.data?.error || `Erreur lors de la modification de la réouverture des spéciaux J${matchday}`);
    } finally {
      setSpecialUnlockSavingKey(null);
    }
  };

  if (loading) {
    return <PageLoader title="Chargement du monitoring..." icon="📡" subtitle="Vérification des pronostics urgents" />;
  }

  if (error) {
    return (
      <section className="admin-monitoring-card monitoring-error-card">
        <div className="monitoring-title">
          <div><span>📡 Monitoring</span><h2>Erreur</h2></div>
          <button type="button" className="button secondary" onClick={loadMonitoring}>Réessayer</button>
        </div>
        <p>{error}</p>
        <style>{styles}</style>
      </section>
    );
  }

  const summary = data?.summary || {};
  const todayMatches = data?.today_matches || [];

  return (
    <section className="admin-monitoring-card">
      <div className="monitoring-title">
        <div>
          <span>📡 Monitoring</span>
          <h2>Pronostics à surveiller</h2>
          <p>Vue rapide pour relancer les joueurs avant les matchs des prochaines 24h, contrôler les bonus incomplets, réouvrir un bonus long terme ou les spéciaux J2/J3.</p>
        </div>
        <div className="monitoring-actions">
          <button type="button" className="button secondary" onClick={loadMonitoring}>Rafraîchir</button>
          <button type="button" className="button primary" onClick={copyReminder}>Copier rappel</button>
        </div>
      </div>

      {copied && <div className="monitoring-alert">✅ Message de rappel copié.</div>}

      <div className="monitoring-summary-grid">
        <div><strong>{summary.users_missing_today || 0}</strong><span>joueurs à relancer 24h</span></div>
        <div><strong>{summary.users_missing_bonus || 0}</strong><span>bonus long terme incomplets</span></div>
        <div><strong>{summary.users_bonus_unlocked || 0}/{summary.users_special2_unlocked || 0}/{summary.users_special3_unlocked || 0}</strong><span>réouverts bonus/J2/J3</span></div>
        <div><strong>{summary.today_predictions_done || 0}/{summary.today_predictions_required || 0}</strong><span>pronos matchs 24h</span></div>
      </div>

      <div className="monitoring-columns">
        <div className="monitoring-panel">
          <div className="monitoring-subtitle">
            <span>⚽ Prochaines 24h</span>
            <strong>{todayMatches.length} match{todayMatches.length > 1 ? 's' : ''}</strong>
          </div>

          {todayMatches.length === 0 ? (
            <p className="monitoring-empty">Aucun match prévu dans les prochaines 24h.</p>
          ) : (
            <div className="today-match-list">
              {todayMatches.map(match => (
                <div key={match.id} className="today-match-row">
                  <strong>{formatDateTime(match.start_time)}</strong>
                  <span>{match.team1} - {match.team2}</span>
                  <em>{match.prediction_count}/{summary.users_count || 0} pronos</em>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="monitoring-panel reminder-panel">
          <div className="monitoring-subtitle">
            <span>📣 Relance</span>
            <strong>{usersToRemind.length} joueur{usersToRemind.length > 1 ? 's' : ''}</strong>
          </div>
          <textarea readOnly value={reminderText} />
        </div>
      </div>

      <div className="monitoring-panel bonus-admin-panel">
        <div className="monitoring-subtitle">
          <span>🎁 Bonus incomplets</span>
          <strong>{bonusIncompleteUsers.length} joueur{bonusIncompleteUsers.length > 1 ? 's' : ''}</strong>
        </div>
        <p className="monitoring-empty bonus-note">
          Le détail reste visible ici. Pour réouvrir/refermer, utilise le petit cadenas dans la colonne Bonus du tableau ci-dessous.
        </p>
        {bonusIncompleteUsers.length === 0 ? (
          <p className="monitoring-empty">Tous les joueurs ont complété les pronostics bonus.</p>
        ) : (
          <div className="bonus-missing-list">
            {bonusIncompleteUsers.map(user => (
              <details key={user.id} className={`bonus-missing-row ${user.bonus.admin_unlocked ? 'bonus-unlocked-row' : ''}`}>
                <summary className="bonus-missing-summary">
                  <strong>{user.username}</strong>
                  <span>{user.bonus.completed}/{user.bonus.total}</span>
                  {user.bonus.admin_unlocked ? <em className="unlock-pill">🔓 Réouvert</em> : user.bonus.locked ? <em>🔒 Verrouillé</em> : <em className="open-pill">Ouvert</em>}
                </summary>
                <ul>{user.bonus.missing.map((item, index) => <li key={`${user.id}-bonus-${index}`}>{item}</li>)}</ul>
              </details>
            ))}
          </div>
        )}
      </div>

      <div className="monitoring-table-wrap">
        <div className="monitoring-table">
          <div className="monitoring-header">
            <span>Joueur</span>
            <span>Matchs 24h</span>
            <span>Bonus</span>
            <span>Spéciaux J1</span>
            <span>Spéciaux J2</span>
            <span>Spéciaux J3</span>
            <span>À relancer</span>
          </div>

          {users.map(user => {
            const needsReminder = user.should_remind;
            const special2 = getSpecial2(user);
            const special3 = getSpecial3(user);
            const missingItems = [
              ...user.today.missing_matches.map(match => `Match ${match.label}`),
              ...(user.bonus.urgent ? user.bonus.missing.map(item => `Bonus : ${item}`) : []),
              ...(user.special.urgent ? user.special.missing.map(item => `Spécial J1 : ${item}`) : []),
              ...(special2.urgent ? special2.missing.map(item => `Spécial J2 : ${item}`) : []),
              ...(special3.urgent ? special3.missing.map(item => `Spécial J3 : ${item}`) : [])
            ];
            const showBonusToggle = user.bonus.global_locked || user.bonus.admin_unlocked;
            const showSpecial2Toggle = special2.global_locked || special2.admin_unlocked;
            const showSpecial3Toggle = special3.global_locked || special3.admin_unlocked;
            const special2Saving = specialUnlockSavingKey === `${user.id}-2`;
            const special3Saving = specialUnlockSavingKey === `${user.id}-3`;

            return (
              <div key={user.id} className={`monitoring-row ${needsReminder ? 'needs-reminder' : 'is-ok'}`}>
                <strong>{user.username}</strong>
                <span>{user.today.completed}/{user.today.total}</span>
                <div className={`bonus-table-cell ${user.bonus.complete ? '' : 'incomplete-value'}`}>
                  <span>{user.bonus.completed}/{user.bonus.total}</span>
                  {showBonusToggle && (
                    <button
                      type="button"
                      className={`bonus-lock-toggle ${user.bonus.admin_unlocked ? 'is-on' : ''}`}
                      disabled={unlockSavingUserId === user.id}
                      title={user.bonus.admin_unlocked ? 'Refermer les bonus long terme pour ce joueur' : 'Réouvrir les bonus long terme pour ce joueur'}
                      onClick={() => toggleBonusUnlock(user)}
                    >
                      {unlockSavingUserId === user.id ? '…' : user.bonus.admin_unlocked ? '🔓' : '🔒'}
                    </button>
                  )}
                </div>
                <span className={user.special.complete ? '' : 'incomplete-value'}>{user.special.completed}/{user.special.total}{user.special.locked ? ' 🔒' : ''}</span>
                <div className={`bonus-table-cell ${special2.complete ? '' : 'incomplete-value'}`}>
                  <span>{special2.completed}/{special2.total}{special2.locked ? ' 🔒' : ''}</span>
                  {showSpecial2Toggle && (
                    <button
                      type="button"
                      className={`bonus-lock-toggle special2-lock-toggle ${special2.admin_unlocked ? 'is-on' : ''}`}
                      disabled={special2Saving}
                      title={special2.admin_unlocked ? 'Refermer les spéciaux J2 pour ce joueur' : 'Réouvrir les spéciaux J2 pour ce joueur'}
                      onClick={() => toggleSpecialUnlock(user, 2)}
                    >
                      {special2Saving ? '…' : special2.admin_unlocked ? '🔓' : '🔒'}
                    </button>
                  )}
                </div>
                <div className={`bonus-table-cell ${special3.complete ? '' : 'incomplete-value'}`}>
                  <span>{special3.completed}/{special3.total}{special3.locked ? ' 🔒' : ''}</span>
                  {showSpecial3Toggle && (
                    <button
                      type="button"
                      className={`bonus-lock-toggle special3-lock-toggle ${special3.admin_unlocked ? 'is-on' : ''}`}
                      disabled={special3Saving}
                      title={special3.admin_unlocked ? 'Refermer les spéciaux J3 pour ce joueur' : 'Réouvrir les spéciaux J3 pour ce joueur'}
                      onClick={() => toggleSpecialUnlock(user, 3)}
                    >
                      {special3Saving ? '…' : special3.admin_unlocked ? '🔓' : '🔒'}
                    </button>
                  )}
                </div>
                <div className="missing-cell">
                  {needsReminder ? (
                    <details>
                      <summary>{user.urgent_missing_count} manquant{user.urgent_missing_count > 1 ? 's' : ''}</summary>
                      <ul>{missingItems.map((item, index) => <li key={`${user.id}-${index}`}>{item}</li>)}</ul>
                    </details>
                  ) : (
                    <span className="ok-pill">Pas de relance</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="monitoring-help">
        Bonus long terme : {summary.bonus_locked ? 'verrouillés globalement' : `ouverts jusqu’au ${formatDateTime(summary.bonus_deadline)}`} · Réouvertures admin : bonus {summary.users_bonus_unlocked || 0}, J2 {summary.users_special2_unlocked || 0}, J3 {summary.users_special3_unlocked || 0} · Deadline spéciaux J1 : {formatDateTime(summary.first_matchday_deadline)} · {summary.first_matchday_locked ? 'verrouillés' : 'encore ouverts'} · Deadline spéciaux J2 : {formatDateTime(summary.second_matchday_deadline)} · {summary.second_matchday_locked ? 'verrouillés' : summary.special2_reminder_active ? 'relance active' : 'hors relance'} · Deadline spéciaux J3 : {formatDateTime(summary.third_matchday_deadline)} · {summary.third_matchday_locked ? 'verrouillés' : summary.special3_reminder_active ? 'relance active' : 'hors relance'}.
      </p>

      <style>{styles}</style>
    </section>
  );
}

const styles = `
  .admin-monitoring-card { width: min(1220px, 100%); margin: 0 auto 16px; background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); border-radius: 18px; padding: 16px; box-shadow: 0 18px 55px rgba(0,0,0,.2); color: #0f172a; }
  .monitoring-title { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 14px; }
  .monitoring-title span, .monitoring-subtitle span { display: block; color: #0f766e; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; }
  .monitoring-title h2 { margin: 2px 0 6px; color: #0f172a; font-size: 22px; }
  .monitoring-title p { margin: 0; color: #64748b; font-size: 13px; line-height: 1.45; }
  .monitoring-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .button { border: 0; border-radius: 999px; padding: 9px 13px; font-size: 12px; font-weight: 950; cursor: pointer; }
  .button.primary { background: linear-gradient(135deg, #0f766e, #d97706); color: white; box-shadow: 0 8px 18px rgba(15,118,110,.18); }
  .button.secondary { background: #e2e8f0; color: #0f172a; }
  .monitoring-alert { margin-bottom: 12px; padding: 10px 12px; border-radius: 12px; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; font-size: 13px; font-weight: 900; }
  .monitoring-summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
  .monitoring-summary-grid div { border-radius: 16px; padding: 13px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .monitoring-summary-grid strong { display: block; color: #d97706; font-size: 27px; line-height: 1; }
  .monitoring-summary-grid span { display: block; margin-top: 7px; color: #475569; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; }
  .monitoring-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  .monitoring-panel { border: 1px solid #e2e8f0; border-radius: 16px; padding: 13px; background: #f8fafc; }
  .bonus-admin-panel { margin-bottom: 14px; background: #fff7ed; border-color: #fed7aa; }
  .monitoring-subtitle { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 10px; }
  .monitoring-subtitle strong { color: #0f172a; font-size: 13px; }
  .monitoring-empty { margin: 0; color: #64748b; font-size: 13px; font-weight: 800; }
  .bonus-note { margin-bottom: 10px; color: #9a3412; }
  .today-match-list, .bonus-missing-list { display: grid; gap: 7px; }
  .today-match-row { display: grid; grid-template-columns: 110px 1fr auto; gap: 8px; align-items: center; padding: 8px 10px; border-radius: 12px; background: white; border: 1px solid #e2e8f0; font-size: 12px; }
  .today-match-row strong { color: #0f766e; }
  .today-match-row span { color: #0f172a; font-weight: 850; }
  .today-match-row em { font-style: normal; color: #92400e; font-weight: 950; white-space: nowrap; }
  .bonus-missing-row { border-radius: 12px; background: white; border: 1px solid #fed7aa; padding: 8px 10px; }
  .bonus-unlocked-row { box-shadow: inset 4px 0 0 #0f766e; }
  .bonus-missing-summary { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 8px; align-items: center; cursor: pointer; color: #7c2d12; }
  .bonus-missing-summary strong { color: #0f172a; }
  .bonus-missing-summary span { color: #b45309; font-weight: 950; }
  .bonus-missing-summary em { padding: 3px 7px; border-radius: 999px; background: #fee2e2; color: #991b1b; font-size: 10px; font-style: normal; font-weight: 950; text-transform: uppercase; }
  .bonus-missing-summary em.open-pill { background: #dcfce7; color: #166534; }
  .bonus-missing-summary em.unlock-pill { background: #ccfbf1; color: #0f766e; }
  .bonus-missing-row ul { margin: 8px 0 0; padding-left: 18px; color: #7c2d12; font-size: 12px; line-height: 1.35; }
  .reminder-panel textarea { width: 100%; min-height: 108px; box-sizing: border-box; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 11px; color: #0f172a; background: white; resize: vertical; font-size: 13px; line-height: 1.45; font-weight: 750; }
  .monitoring-table-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 16px; }
  .monitoring-table { min-width: 1080px; }
  .monitoring-header, .monitoring-row { display: grid; grid-template-columns: 1.1fr .7fr .75fr .72fr .72fr .72fr 1.55fr; gap: 10px; align-items: center; padding: 10px 12px; }
  .monitoring-header { background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; }
  .monitoring-row { border-top: 1px solid #e2e8f0; font-size: 13px; color: #334155; }
  .monitoring-row strong { color: #0f172a; }
  .monitoring-row.needs-reminder { background: #fff7ed; }
  .monitoring-row.is-ok { background: #f0fdf4; }
  .incomplete-value { color: #b45309; font-weight: 950; }
  .bonus-table-cell { display: inline-flex; align-items: center; gap: 6px; }
  .bonus-lock-toggle { width: 30px; height: 26px; display: inline-grid; place-items: center; border: 0; border-radius: 999px; background: #fee2e2; color: #991b1b; cursor: pointer; font-size: 13px; box-shadow: inset 0 0 0 1px #fecaca; }
  .bonus-lock-toggle.is-on { background: #ccfbf1; color: #0f766e; box-shadow: inset 0 0 0 1px #99f6e4; }
  .bonus-lock-toggle:disabled { opacity: .55; cursor: wait; }
  .missing-cell summary { cursor: pointer; color: #b45309; font-weight: 950; }
  .missing-cell ul { margin: 8px 0 0; padding-left: 18px; color: #7c2d12; font-size: 12px; line-height: 1.35; }
  .ok-pill { display: inline-flex; padding: 5px 9px; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 950; }
  .monitoring-help { margin: 12px 0 0; color: #64748b; font-size: 12px; font-weight: 800; }
  .monitoring-error-card p { margin: 0; color: #991b1b; font-weight: 900; }
  @media (max-width: 920px) { .monitoring-title, .monitoring-columns { grid-template-columns: 1fr; display: grid; } .monitoring-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 560px) { .admin-monitoring-card { padding: 12px; } .monitoring-summary-grid { grid-template-columns: 1fr; } .today-match-row, .bonus-missing-summary { grid-template-columns: 1fr; } .monitoring-actions .button { width: 100%; } }
`;

export default AdminMonitoring;
