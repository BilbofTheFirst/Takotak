import React, { useMemo, useState } from 'react';
import { specialPredictionsService } from '../services/api';
import UserAvatar from './UserAvatar';

const formatActual = (definition, currentActual) => {
  const value = currentActual?.[definition.code];
  if (value === null || value === undefined) return 'Actuel : en attente';
  return `Actuel : ${value}${definition.unit ? ` ${definition.unit}` : ''}`;
};

function PublicSpecialPredictionsTable({ locked, currentUserId }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');

  const definitions = payload?.definitions || [];
  const currentActual = payload?.current_actual || payload?.actual || {};

  const rows = useMemo(() => {
    if (!payload?.locked) return [];
    return (payload.predictions || []).map(item => ({
      user_id: item.user_id,
      username: item.username,
      avatar_url: item.avatar_url,
      predictions: item.predictions || {},
      points: item.scoring?.points ?? null
    }));
  }, [payload]);

  if (!locked) return null;

  const loadPredictions = async () => {
    if (payload || loading) return;
    setLoading(true);
    setError('');

    try {
      const response = await specialPredictionsService.getPublic();
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

  return (
    <div className="public-special-table-shell">
      <button
        type="button"
        className={`public-special-toggle ${open ? 'is-open' : ''}`}
        onClick={toggleOpen}
        title={open ? 'Masquer les pronos du groupe' : 'Afficher les pronos des autres'}
        aria-label={open ? 'Masquer les pronos du groupe' : 'Afficher les pronos des autres'}
      >
        {open ? '🙈 Masquer' : '👀 Afficher les pronos des autres'}
      </button>

      {open && (
        <div className="public-special-panel">
          <div className="public-special-panel-title">
            <strong>Pronos du groupe · Spéciaux J1</strong>
            {payload?.completed_matches !== undefined && (
              <span>{payload.completed_matches}/{payload.total_matches} matchs encodés</span>
            )}
          </div>

          {loading && <div className="public-special-state">Chargement des pronos...</div>}
          {error && <div className="public-special-state error">{error}</div>}

          {!loading && !error && payload?.locked && (
            <div className="public-special-table-wrap">
              <div className="public-special-table">
                <div className="public-special-row public-special-head">
                  <span>Joueur</span>
                  {definitions.map(definition => (
                    <span key={definition.code} className="public-special-question">
                      <strong>{definition.label}</strong>
                      <em>{formatActual(definition, currentActual)}</em>
                    </span>
                  ))}
                  <span>Pts</span>
                </div>

                {rows.length === 0 ? (
                  <div className="public-special-state">Aucun prono trouvé.</div>
                ) : rows.map(row => (
                  <div key={row.user_id} className={`public-special-row ${Number(currentUserId) === Number(row.user_id) ? 'is-current-user' : ''}`}>
                    <span className="public-special-user"><UserAvatar user={row} size={30} /><strong>{row.username}</strong></span>
                    {definitions.map(definition => (
                      <span key={`${row.user_id}-${definition.code}`} className="public-special-value">
                        {row.predictions?.[definition.code] ?? '—'} {row.predictions?.[definition.code] !== null && definition.unit ? definition.unit : ''}
                      </span>
                    ))}
                    <span className="public-special-points">{row.points ?? '-'} pt{Number(row.points) > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .public-special-table-shell { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: start; margin-bottom: 14px; }
        .public-special-toggle { grid-column: 2; justify-self: end; border: 1px solid #fed7aa; border-radius: 999px; padding: 7px 11px; color: #92400e; background: #fff7ed; font-size: 11px; font-weight: 950; cursor: pointer; box-shadow: 0 6px 14px rgba(217,119,6,.12); white-space: nowrap; }
        .public-special-toggle:hover, .public-special-toggle.is-open { transform: translateY(-1px); background: #ffedd5; border-color: #fb923c; }
        .public-special-panel { grid-column: 1 / -1; width: 100%; padding: 12px; border-radius: 16px; background: #ffffff; border: 1px solid #e2e8f0; box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); }
        .public-special-panel-title { display: flex; justify-content: space-between; gap: 10px; align-items: center; margin-bottom: 10px; }
        .public-special-panel-title strong { color: #0f172a; font-size: 13px; }
        .public-special-panel-title span { color: #92400e; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 999px; padding: 5px 8px; font-size: 10px; font-weight: 950; white-space: nowrap; }
        .public-special-table-wrap { overflow-x: auto; }
        .public-special-table { min-width: 760px; display: grid; gap: 6px; }
        .public-special-row { display: grid; grid-template-columns: minmax(150px, .9fr) repeat(3, minmax(130px, 1fr)) auto; gap: 8px; align-items: center; padding: 8px; border-radius: 13px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .public-special-row.is-current-user { background: #fff7ed; border-color: #f59e0b; }
        .public-special-head { background: #f1f5f9; color: #64748b; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; }
        .public-special-user { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
        .public-special-user strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #0f172a; font-size: 12px; }
        .public-special-question { display: grid; gap: 2px; }
        .public-special-question strong { color: #475569; font-size: 10px; }
        .public-special-question em { color: #d97706; font-size: 10px; font-style: normal; font-weight: 950; text-transform: none; letter-spacing: 0; }
        .public-special-value { color: #0f172a; font-size: 12px; font-weight: 950; }
        .public-special-points { justify-self: end; padding: 5px 8px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 10px; font-weight: 950; white-space: nowrap; }
        .public-special-state { color: #64748b; font-size: 12px; font-weight: 850; }
        .public-special-state.error { color: #b91c1c; }
        @media (max-width: 760px) { .public-special-table-shell { grid-template-columns: 1fr; } .public-special-toggle { grid-column: 1; justify-self: start; } .public-special-panel-title { align-items: flex-start; flex-direction: column; } }
      `}</style>
    </div>
  );
}

export default PublicSpecialPredictionsTable;
