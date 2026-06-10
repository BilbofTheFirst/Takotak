import React, { useState } from 'react';
import { predictionsService } from '../services/api';
import UserAvatar from './UserAvatar';

const CATEGORY_CONFIG = {
  exact_score: { icon: '🎯', label: 'Score exact', className: 'exact' },
  correct_difference: { icon: '⚖️', label: 'Bonne différence', className: 'difference' },
  correct_winner: { icon: '✅', label: 'Bon vainqueur', className: 'winner' },
  correct_draw: { icon: '🤝', label: 'Bon nul', className: 'winner' },
  wrong_prediction: { icon: '🧊', label: 'Raté', className: 'wrong' }
};

const getPopularPrediction = (predictions) => {
  if (!predictions.length) return null;
  const counts = new Map();
  predictions.forEach(prediction => {
    const key = `${prediction.team1_goals}-${prediction.team2_goals}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
};

function PublicMatchPredictionsPanel({ match }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);

  const hasResult = Boolean(payload?.match?.has_result);
  const predictions = payload?.predictions || [];
  const sortedPredictions = [...predictions].sort((a, b) => {
    if (hasResult) return Number(b.points || 0) - Number(a.points || 0) || a.username.localeCompare(b.username, 'fr');
    return a.username.localeCompare(b.username, 'fr');
  });

  const popular = getPopularPrediction(predictions);
  const exactCount = predictions.filter(prediction => prediction.category === 'exact_score').length;
  const maxPoints = hasResult ? Math.max(0, ...predictions.map(prediction => Number(prediction.points || 0))) : null;
  const bestUsers = hasResult && maxPoints > 0
    ? predictions.filter(prediction => Number(prediction.points || 0) === maxPoints).map(prediction => prediction.username).slice(0, 3)
    : [];

  const loadPredictions = async () => {
    if (payload || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await predictionsService.getPublicForMatch(match.id);
      setPayload(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de charger les pronostics');
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
    <div className="public-predictions-shell">
      <button type="button" className="public-predictions-toggle" onClick={toggleOpen}>
        {open ? '🙈 Masquer les pronos' : '👀 Voir les pronos du groupe'}
      </button>

      {open && (
        <div className="public-predictions-panel">
          {loading && <div className="public-predictions-loading">Chargement des pronos...</div>}
          {error && <div className="public-predictions-error">{error}</div>}

          {!loading && !error && payload && (
            <>
              <div className="public-predictions-fun">
                <div><span>🔥 Prono populaire</span><strong>{popular ? `${popular[0]} · ${popular[1]} joueur${popular[1] > 1 ? 's' : ''}` : 'Aucun prono'}</strong></div>
                {hasResult ? (
                  <>
                    <div><span>🎯 Scores exacts</span><strong>{exactCount}</strong></div>
                    <div><span>👑 Meilleur coup</span><strong>{bestUsers.length ? `${bestUsers.join(', ')} +${maxPoints}` : 'Personne'}</strong></div>
                  </>
                ) : (
                  <div><span>🔒 Points</span><strong>Disponibles après résultat</strong></div>
                )}
              </div>

              <div className="public-predictions-list">
                {sortedPredictions.length === 0 ? (
                  <div className="public-prediction-empty">Personne n’a pronostiqué ce match.</div>
                ) : sortedPredictions.map(prediction => {
                  const category = CATEGORY_CONFIG[prediction.category] || { icon: '⏳', label: 'En attente', className: 'pending' };
                  return (
                    <div className="public-prediction-row" key={prediction.user_id}>
                      <UserAvatar user={prediction} size={32} />
                      <strong>{prediction.username}</strong>
                      <span className="public-prediction-score">{prediction.team1_goals}-{prediction.team2_goals}</span>
                      {hasResult ? (
                        <span className={`public-prediction-badge ${category.className}`}>{category.icon} {category.label} · +{prediction.points}</span>
                      ) : (
                        <span className="public-prediction-badge pending">⏳ En jeu</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .public-predictions-shell { grid-column: 1 / -1; margin-top: 8px; }
        .public-predictions-toggle { border: 0; border-radius: 999px; padding: 7px 11px; color: white; background: linear-gradient(135deg, #0f766e, #d97706); font-size: 11px; font-weight: 950; cursor: pointer; box-shadow: 0 8px 18px rgba(15,118,110,.16); }
        .public-predictions-panel { margin-top: 9px; padding: 12px; border-radius: 16px; background: #ffffff; border: 1px solid #e2e8f0; box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); }
        .public-predictions-loading, .public-predictions-error, .public-prediction-empty { color: #64748b; font-size: 12px; font-weight: 850; }
        .public-predictions-error { color: #b91c1c; }
        .public-predictions-fun { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 10px; }
        .public-predictions-fun div { padding: 9px 10px; border-radius: 13px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .public-predictions-fun span { display: block; color: #64748b; font-size: 9px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; }
        .public-predictions-fun strong { display: block; margin-top: 3px; color: #0f172a; font-size: 12px; line-height: 1.15; }
        .public-predictions-list { display: grid; gap: 6px; }
        .public-prediction-row { display: grid; grid-template-columns: 32px minmax(120px, 1fr) 58px minmax(150px, auto); gap: 8px; align-items: center; padding: 8px; border-radius: 13px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .public-prediction-row strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #0f172a; font-size: 12px; }
        .public-prediction-score { justify-self: center; padding: 4px 8px; border-radius: 10px; color: white; background: #0f172a; font-size: 13px; font-weight: 950; font-variant-numeric: tabular-nums; }
        .public-prediction-badge { justify-self: end; padding: 5px 8px; border-radius: 999px; font-size: 10px; font-weight: 950; white-space: nowrap; }
        .public-prediction-badge.exact { background: #dcfce7; color: #047857; }
        .public-prediction-badge.difference { background: #dbeafe; color: #1d4ed8; }
        .public-prediction-badge.winner { background: #fef3c7; color: #92400e; }
        .public-prediction-badge.wrong { background: #fee2e2; color: #b91c1c; }
        .public-prediction-badge.pending { background: #f1f5f9; color: #64748b; }
        @media (max-width: 760px) { .public-predictions-fun { grid-template-columns: 1fr; } .public-prediction-row { grid-template-columns: 32px minmax(0, 1fr) 52px; } .public-prediction-badge { grid-column: 2 / -1; justify-self: start; } }
      `}</style>
    </div>
  );
}

export default PublicMatchPredictionsPanel;
