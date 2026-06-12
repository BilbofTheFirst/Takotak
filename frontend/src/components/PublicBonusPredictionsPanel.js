import React, { useMemo, useState } from 'react';
import { bonusPredictionsService, specialPredictionsService } from '../services/api';
import { getFlag } from '../utils/countryFlags';
import UserAvatar from './UserAvatar';

const TeamPill = ({ team }) => {
  if (!team) return <span className="bonus-public-value empty">—</span>;
  const flag = getFlag(team);
  return (
    <span className="bonus-public-team-pill">
      {flag ? <img src={flag} alt="" /> : <span>⚽</span>}
      <span>{team}</span>
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
      <button type="button" className="bonus-public-toggle" onClick={toggleOpen}>
        {open ? '🙈 Masquer les pronos' : '👀 Voir les pronos du groupe'}
      </button>

      {open && (
        <div className="bonus-public-panel">
          <div className="bonus-public-panel-title">
            <strong>{panelTitle}</strong>
            {popular && <span>🔥 {popular[0]} · {popular[1]} joueur{popular[1] > 1 ? 's' : ''}</span>}
          </div>

          {loading && <div className="bonus-public-state">Chargement des pronos...</div>}
          {error && <div className="bonus-public-state error">{error}</div>}
          {!loading && !error && payload && !payload.locked && <div className="bonus-public-state">Ces pronostics ne sont pas encore verrouillés.</div>}

          {!loading && !error && payload?.locked && (
            <div className="bonus-public-list">
              {rows.length === 0 ? (
                <div className="bonus-public-state">Aucun prono trouvé.</div>
              ) : rows.map(row => (
                <div key={row.user_id} className={`bonus-public-row ${Number(currentUserId) === Number(row.user_id) ? 'is-current-user' : ''}`}>
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
        .bonus-public-toggle-shell { grid-column: 1 / -1; min-width: 0; margin-top: 6px; }
        .bonus-public-toggle { border: 0; border-radius: 999px; padding: 7px 11px; color: white; background: linear-gradient(135deg, #0f766e, #d97706); font-size: 11px; font-weight: 950; cursor: pointer; box-shadow: 0 8px 18px rgba(15,118,110,.16); }
        .bonus-public-panel { margin-top: 9px; padding: 12px; border-radius: 16px; background: #ffffff; border: 1px solid #e2e8f0; box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); }
        .bonus-public-panel-title { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 9px; }
        .bonus-public-panel-title strong { color: #0f172a; font-size: 13px; }
        .bonus-public-panel-title span { color: #92400e; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 999px; padding: 5px 8px; font-size: 10px; font-weight: 950; white-space: nowrap; }
        .bonus-public-list { display: grid; gap: 6px; }
        .bonus-public-row { display: grid; grid-template-columns: 30px minmax(110px, .75fr) minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 8px; border-radius: 13px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .bonus-public-row.is-current-user { background: #fff7ed; border-color: #f59e0b; }
        .bonus-public-row strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #0f172a; font-size: 12px; }
        .bonus-public-pick { min-width: 0; }
        .bonus-public-team-pill { min-width: 0; max-width: 100%; display: inline-flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 999px; background: white; border: 1px solid #e2e8f0; color: #0f172a; font-size: 11px; font-weight: 900; }
        .bonus-public-team-pill img { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; flex: 0 0 auto; }
        .bonus-public-team-pill span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bonus-public-team-list { display: flex; flex-wrap: wrap; gap: 5px; }
        .bonus-public-value.empty { color: #94a3b8; font-weight: 950; }
        .bonus-public-number { color: #0f172a; font-size: 12px; font-weight: 950; }
        .bonus-public-points { justify-self: end; padding: 5px 8px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 10px; font-weight: 950; white-space: nowrap; }
        .bonus-public-state { color: #64748b; font-size: 12px; font-weight: 850; }
        .bonus-public-state.error { color: #b91c1c; }
        @media (max-width: 760px) { .bonus-public-panel-title { align-items: flex-start; flex-direction: column; } .bonus-public-row { grid-template-columns: 30px minmax(0, 1fr); } .bonus-public-pick, .bonus-public-points { grid-column: 2 / -1; justify-self: start; } }
      `}</style>
    </div>
  );
}

export default PublicBonusPredictionsPanel;
