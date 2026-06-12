import React, { useMemo, useState } from 'react';
import { bonusPredictionsService } from '../services/api';
import { getFlag } from '../utils/countryFlags';
import UserAvatar from './UserAvatar';

const GROUP_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const TeamFlag = ({ team }) => {
  if (!team) return <span className="public-bonus-empty">—</span>;
  const flag = getFlag(team);
  return (
    <span className="public-bonus-flag" title={team} aria-label={team}>
      {flag ? <img src={flag} alt={team} /> : <span>⚽</span>}
    </span>
  );
};

function PublicBonusPredictionsTable({ type = 'groups', locked, currentUserId }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');

  const rows = useMemo(() => {
    if (!payload?.locked) return [];
    return (payload.predictions || []).map(item => ({
      user_id: item.user_id,
      username: item.username,
      avatar_url: item.avatar_url,
      prediction: item.prediction || {},
      points: item.scoring?.points ?? null
    }));
  }, [payload]);

  if (!locked) return null;

  const loadPredictions = async () => {
    if (payload || loading) return;
    setLoading(true);
    setError('');

    try {
      const response = await bonusPredictionsService.getPublic();
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

  const isFinal = type === 'final';

  return (
    <div className="public-bonus-table-shell">
      <button
        type="button"
        className={`public-bonus-toggle ${open ? 'is-open' : ''}`}
        onClick={toggleOpen}
        title={open ? 'Masquer les pronos du groupe' : 'Afficher les pronos des autres'}
        aria-label={open ? 'Masquer les pronos du groupe' : 'Afficher les pronos des autres'}
      >
        {open ? '🙈 Masquer' : '👀 Afficher les pronos des autres'}
      </button>

      {open && (
        <div className="public-bonus-panel">
          <div className="public-bonus-panel-title">
            <strong>{isFinal ? 'Pronos du groupe · Tableau final' : 'Pronos du groupe · Vainqueurs de groupes'}</strong>
            {rows.length > 0 && <span>{rows.length} joueur{rows.length > 1 ? 's' : ''}</span>}
          </div>

          {loading && <div className="public-bonus-state">Chargement des pronos...</div>}
          {error && <div className="public-bonus-state error">{error}</div>}

          {!loading && !error && payload?.locked && (
            <div className="public-bonus-table-wrap">
              <div className={`public-bonus-table ${isFinal ? 'is-final' : 'is-groups'}`}>
                <div className={`public-bonus-row public-bonus-head ${isFinal ? 'is-final' : 'is-groups'}`}>
                  <span>Joueur</span>
                  {isFinal ? (
                    <>
                      <span>Champion</span>
                      <span>Finaliste</span>
                      <span>Demi-finalistes</span>
                    </>
                  ) : GROUP_CODES.map(group => <span key={group}>{group}</span>)}
                  <span>Pts</span>
                </div>

                {rows.length === 0 ? (
                  <div className="public-bonus-state">Aucun prono trouvé.</div>
                ) : rows.map(row => (
                  <div key={row.user_id} className={`public-bonus-row ${isFinal ? 'is-final' : 'is-groups'} ${Number(currentUserId) === Number(row.user_id) ? 'is-current-user' : ''}`}>
                    <span className="public-bonus-user"><UserAvatar user={row} size={30} /><strong>{row.username}</strong></span>
                    {isFinal ? (
                      <>
                        <TeamFlag team={row.prediction.champion} />
                        <TeamFlag team={row.prediction.runner_up} />
                        <span className="public-bonus-semis">
                          {(row.prediction.semifinalists || []).length
                            ? row.prediction.semifinalists.map((team, index) => <TeamFlag key={`${row.user_id}-${team}-${index}`} team={team} />)
                            : <TeamFlag team="" />}
                        </span>
                      </>
                    ) : GROUP_CODES.map(group => (
                      <TeamFlag key={`${row.user_id}-${group}`} team={row.prediction.group_winners?.[group]} />
                    ))}
                    <span className="public-bonus-points">{row.points ?? '-'} pt{Number(row.points) > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .public-bonus-table-shell { display: contents; }
        .public-bonus-toggle { border: 1px solid #fed7aa; border-radius: 999px; padding: 7px 11px; color: #92400e; background: #fff7ed; font-size: 11px; font-weight: 950; cursor: pointer; box-shadow: 0 6px 14px rgba(217,119,6,.12); justify-self: end; align-self: center; white-space: nowrap; }
        .public-bonus-toggle:hover, .public-bonus-toggle.is-open { transform: translateY(-1px); background: #ffedd5; border-color: #fb923c; }
        .public-bonus-panel { grid-column: 1 / -1; width: 100%; margin-top: 8px; padding: 12px; border-radius: 16px; background: #ffffff; border: 1px solid #e2e8f0; box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); }
        .public-bonus-panel-title { display: flex; justify-content: space-between; gap: 10px; align-items: center; margin-bottom: 10px; }
        .public-bonus-panel-title > strong { color: #0f172a; font-size: 13px; line-height: 1.2; letter-spacing: 0; text-transform: none; }
        .public-bonus-panel-title > span { color: #92400e; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 999px; padding: 5px 8px; font-size: 10px; font-weight: 950; white-space: nowrap; }
        .public-bonus-table-wrap { overflow-x: auto; }
        .public-bonus-table { min-width: 760px; display: grid; gap: 6px; }
        .public-bonus-table.is-groups { min-width: 980px; }
        .public-bonus-table .public-bonus-row { display: grid; gap: 8px; align-items: center; padding: 8px; border-radius: 13px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .public-bonus-table .public-bonus-row.is-groups { grid-template-columns: minmax(145px, .95fr) repeat(12, 44px) auto; }
        .public-bonus-table .public-bonus-row.is-final { grid-template-columns: minmax(150px, .9fr) minmax(90px, .7fr) minmax(90px, .7fr) minmax(185px, 1.2fr) auto; }
        .public-bonus-table .public-bonus-row.is-current-user { background: #fff7ed; border-color: #f59e0b; }
        .public-bonus-table .public-bonus-head { background: #f1f5f9; color: #64748b; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; }
        .public-bonus-table .public-bonus-user { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
        .public-bonus-table .public-bonus-user strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #0f172a; font-size: 12px; line-height: 1.2; font-weight: 950; letter-spacing: 0; text-transform: none; }
        .public-bonus-table .public-bonus-flag { width: 28px; height: 28px; display: inline-grid; place-items: center; border-radius: 999px; background: white; border: 1px solid #e2e8f0; box-shadow: 0 5px 12px rgba(15,23,42,.08); }
        .public-bonus-table .public-bonus-flag img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .public-bonus-table .public-bonus-semis { display: flex; align-items: center; flex-wrap: nowrap; gap: 5px; }
        .public-bonus-table .public-bonus-empty { color: #94a3b8; font-weight: 950; }
        .public-bonus-table .public-bonus-points { justify-self: end; padding: 5px 8px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 10px; font-weight: 950; white-space: nowrap; }
        .public-bonus-state { color: #64748b; font-size: 12px; font-weight: 850; }
        .public-bonus-state.error { color: #b91c1c; }
        @media (max-width: 760px) { .public-bonus-panel-title { align-items: flex-start; flex-direction: column; } }
      `}</style>
    </div>
  );
}

export default PublicBonusPredictionsTable;
