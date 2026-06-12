import React, { useMemo, useState } from 'react';
import { bonusPredictionsService, specialPredictionsService } from '../services/api';
import { getFlag } from '../utils/countryFlags';
import UserAvatar from './UserAvatar';

const TeamPill = ({ team }) => {
  if (!team) return <span className="bonus-public-value empty">—</span>;
  const flag = getFlag(team);
  return (
    <span className="bonus-public-team-pill" title={team} aria-label={team}>
      {flag ? <img src={flag} alt={team} /> : <span>⚽</span>}
    </span>
  );
};

const getBonusValue = (prediction, kind, group) => {
  if (kind === 'group_winner') return prediction?.group_winners?.[group] || '';
  if (kind === 'champion') return prediction?.champion || '';
  if (kind === 'runner_up') return prediction?.runner_up || '';
  if (kind === 'semifinalists') return Array.isArray(prediction?.semifinalists) ? prediction.semifinalists.filter(Boolean) : [];
  return '';
};

const formatValueKey = (row) => {
  if (Array.isArray(row.value)) return row.value.join(', ') || '—';
  return String(row.value || '—');
};

function PublicBonusPredictionsPanel({
  type = 'bonus',
  kind = 'group_winner',
  group,
  code,
  title,
  locked,
  currentUserId
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');

  const rows = useMemo(() => {
    if (!payload?.locked) return [];

    if (type === 'special') {
      const definition = (payload.definitions || []).find(item => item.code === code);
      return (payload.predictions || []).map(item => ({
        user_id: item.user_id,
        username: item.username,
        avatar_url: item.avatar_url,
        value: item.predictions?.[code] ?? null,
        actual: payload.actual?.[code] ?? null,
        unit: definition?.unit || '',
        points: item.scoring?.details?.[code]?.points ?? null
      }));
    }

    return (payload.predictions || []).map(item => ({
      user_id: item.user_id,
      username: item.username,
      avatar_url: item.avatar_url,
      value: getBonusValue(item.prediction, kind, group),
      points: item.scoring?.points ?? null
    }));
  }, [payload, type, code, kind, group]);

  const popular = useMemo(() => {
    if (!rows.length) return null;
    const counts = new Map();
    rows.forEach(row => {
      const key = formatValueKey(row);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))[0];
  }, [rows]);

  const specialActual = useMemo(() => {
    if (type !== 'special' || !rows.length) return null;
    const firstRow = rows[0];
    if (firstRow.actual === null || firstRow.actual === undefined) return 'Actuel : en attente';
    return `Actuel : ${firstRow.actual}${firstRow.unit ? ` ${firstRow.unit}` : ''}`;
  }, [rows, type]);

  if (!locked) return null;

  const loadPredictions = async () => {
    if (payload || loading) return;
    setLoading(true);
    setError('');

    try {
      const response = type === 'special'
        ? await specialPredictionsService.getPublic()
        : await bonusPredictionsService.getPublic();
      setPayload(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de charger les pronostics du groupe');
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) await loadPredictions();
  };

  const panelTitle = title || (group ? `Groupe ${group}` : 'Bonus');

  return (
    <div className="bonus-public-toggle-shell">
      <button
        type="button"
        className={`bonus-public-toggle ${open ? 'is-open' : ''}`}
        onClick={toggleOpen}
        title={open ? 'Masquer les pronos du groupe' : 'Voir les pronos du groupe'}
        aria-label={open ? 'Masquer les pronos du groupe' : 'Voir les pronos du groupe'}
      >
        {open ? '🙈' : '👀'}
      </button>

      {open && (
        <div className={`bonus-public-panel ${type === 'special' ? 'is-special' : ''}`}>
          <div className="bonus-public-panel-title">
            <strong>{panelTitle}</strong>
            <div>
              {specialActual && <span>{specialActual}</span>}
              {popular && <span>🔥 {popular[0]} · {popular[1]} joueur{popular[1] > 1 ? 's' : ''}</span>}
            </div>
          </div>

          {loading && <div className="bonus-public-state">Chargement des pronos...</div>}
          {error && <div className="bonus-public-state error">{error}</div>}
          {!loading && !error && payload && !payload.locked && <div className="bonus-public-state">Ces pronostics ne sont pas encore verrouillés.</div>}

          {!loading && !error && payload?.locked && (
            <div className="bonus-public-list">
              {type === 'special' && (
                <div className="bonus-public-row bonus-public-head">
                  <span>Joueur</span>
                  <span>Prono</span>
                  <span>Pts</span>
                </div>
              )}
              {rows.length === 0 ? (
                <div className="bonus-public-state">Aucun prono trouvé.</div>
              ) : rows.map(row => (
                <div key={row.user_id} className={`bonus-public-row ${type === 'special' ? 'is-special' : ''} ${Number(currentUserId) === Number(row.user_id) ? 'is-current-user' : ''}`}>
                  <UserAvatar user={row} size={30} />
                  <strong>{row.username}</strong>
                  <div className="bonus-public-pick">
                    {type === 'special' ? (
                      <span className="bonus-public-number">{row.value ?? '—'} {row.value !== null && row.unit ? row.unit : ''}</span>
                    ) : Array.isArray(row.value) ? (
                      <div className="bonus-public-team-list">
                        {row.value.length ? row.value.map((team, index) => <TeamPill key={`${row.user_id}-${team}-${index}`} team={team} />) : <TeamPill team="" />}
                      </div>
                    ) : (
                      <TeamPill team={row.value} />
                    )}
                  </div>
                  {type === 'special' && <span className="bonus-public-points">{row.points ?? '-'} pt{Number(row.points) > 1 ? 's' : ''}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .bonus-public-toggle-shell { display: contents; min-width: 0; margin: 0; }
        .bonus-public-toggle { width: 30px; height: 30px; display: inline-grid; place-items: center; border: 1px solid #fed7aa; border-radius: 999px; padding: 0; color: #92400e; background: #fff7ed; font-size: 14px; font-weight: 950; cursor: pointer; box-shadow: 0 6px 14px rgba(217,119,6,.12); justify-self: end; align-self: center; }
        .bonus-public-toggle:hover, .bonus-public-toggle.is-open { transform: translateY(-1px); background: #ffedd5; border-color: #fb923c; }
        .bonus-public-panel { grid-column: 1 / -1; width: 100%; margin-top: 8px; padding: 12px; border-radius: 16px; background: #ffffff; border: 1px solid #e2e8f0; box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); }
        .bonus-public-panel-title { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 9px; }
        .bonus-public-panel-title strong { color: #0f172a; font-size: 13px; }
        .bonus-public-panel-title div { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
        .bonus-public-panel-title span { color: #92400e; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 999px; padding: 5px 8px; font-size: 10px; font-weight: 950; white-space: nowrap; }
        .bonus-public-list { display: grid; gap: 6px; max-height: 360px; overflow: auto; padding-right: 2px; }
        .bonus-public-row { display: grid; grid-template-columns: 30px minmax(95px, .75fr) minmax(0, 1fr); gap: 8px; align-items: center; padding: 8px; border-radius: 13px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .bonus-public-row.is-special { grid-template-columns: 30px minmax(88px, .8fr) minmax(82px, 1fr) auto; }
        .bonus-public-row.is-current-user { background: #fff7ed; border-color: #f59e0b; }
        .bonus-public-row.bonus-public-head { grid-template-columns: minmax(118px, .9fr) minmax(82px, 1fr) auto; padding: 6px 8px; background: #f1f5f9; color: #64748b; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; }
        .bonus-public-row strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #0f172a; font-size: 12px; }
        .bonus-public-pick { min-width: 0; }
        .bonus-public-team-pill { width: 28px; height: 28px; min-width: 28px; display: inline-grid; place-items: center; border-radius: 999px; background: white; border: 1px solid #e2e8f0; color: #0f172a; font-size: 12px; font-weight: 900; box-shadow: 0 5px 12px rgba(15,23,42,.08); }
        .bonus-public-team-pill img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .bonus-public-team-list { display: flex; flex-wrap: wrap; gap: 5px; }
        .bonus-public-value.empty { color: #94a3b8; font-weight: 950; }
        .bonus-public-number { color: #0f172a; font-size: 12px; font-weight: 950; }
        .bonus-public-points { justify-self: end; padding: 5px 8px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 10px; font-weight: 950; white-space: nowrap; }
        .bonus-public-state { color: #64748b; font-size: 12px; font-weight: 850; }
        .bonus-public-state.error { color: #b91c1c; }
        @media (max-width: 760px) { .bonus-public-panel-title { align-items: flex-start; flex-direction: column; } .bonus-public-panel-title div { justify-content: flex-start; } .bonus-public-row, .bonus-public-row.is-special { grid-template-columns: 30px minmax(0, 1fr); } .bonus-public-row.bonus-public-head { display: none; } .bonus-public-pick, .bonus-public-points { grid-column: 2 / -1; justify-self: start; } }
      `}</style>
    </div>
  );
}

export default PublicBonusPredictionsPanel;
