import React, { useEffect, useMemo, useState } from 'react';
import { teamsService } from '../services/api';
import { getFlag } from '../utils/countryFlags';

const resultConfig = {
  W: { label: 'Victoire', short: 'V', className: 'result-win', icon: '✓' },
  D: { label: 'Nul', short: 'N', className: 'result-draw', icon: '=' },
  L: { label: 'Défaite', short: 'D', className: 'result-loss', icon: '×' }
};

function TeamInfoModal({ teamId, teamName, onClose }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTeamInfo();
  }, [teamId]);

  const loadTeamInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await teamsService.getInfo(teamName);
      setInfo(res.data);
    } catch (err) {
      setError('Infos non disponibles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formStats = useMemo(() => {
    if (!info?.lastMatches) return { wins: 0, draws: 0, losses: 0 };

    return info.lastMatches.reduce((acc, match) => {
      if (match.result === 'W') acc.wins += 1;
      else if (match.result === 'D') acc.draws += 1;
      else if (match.result === 'L') acc.losses += 1;
      return acc;
    }, { wins: 0, draws: 0, losses: 0 });
  }, [info]);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getResultConfig = (result) => resultConfig[result] || resultConfig.D;

  return (
    <div className="team-modal-backdrop" onClick={onClose}>
      <div className="team-modal" onClick={(e) => e.stopPropagation()}>
        <button className="team-modal-close" type="button" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <div className="team-modal-hero">
          <div className="team-modal-title-row">
            <div className="team-modal-identity">
              <div className="team-modal-flag-shell">
                <img src={getFlag(teamName)} alt={teamName} />
              </div>
              <div className="team-modal-heading">
                <span>Forme récente</span>
                <h2>{teamName}</h2>
              </div>
            </div>

            <div className="team-ranking-card">
              <span>FIFA</span>
              <strong>{info?.team?.fifaRanking ? `#${info.team.fifaRanking}` : '—'}</strong>
            </div>
          </div>
        </div>

        <div className="team-modal-body">
          {loading && (
            <div className="team-modal-state">
              <div className="team-modal-ball">⚽</div>
              <p>Chargement...</p>
            </div>
          )}

          {error && !loading && (
            <div className="team-modal-error">
              ⚠️ {error}
            </div>
          )}

          {info && !loading && !error && (
            <>
              <div className="team-form-summary">
                <div className="form-pill result-win"><strong>{formStats.wins}</strong><span>Victoires</span></div>
                <div className="form-pill result-draw"><strong>{formStats.draws}</strong><span>Nuls</span></div>
                <div className="form-pill result-loss"><strong>{formStats.losses}</strong><span>Défaites</span></div>
              </div>

              <div className="team-section-title">
                <span>📊 5 derniers matchs</span>
              </div>

              {info.lastMatches.length === 0 ? (
                <div className="empty-form-card">
                  Aucun match joué pour le moment.
                </div>
              ) : (
                <div className="team-match-list">
                  {info.lastMatches.map((match, idx) => {
                    const config = getResultConfig(match.result);

                    return (
                      <div key={`${match.date}-${idx}`} className={`team-match-card ${config.className}`}>
                        <div className="team-match-result">
                          {config.short}
                        </div>

                        <div className="team-match-main">
                          <strong>{match.opponent}</strong>
                          <div className="team-match-meta">
                            <span>{formatDate(match.date)}</span>
                            {match.competition && <span>{match.competition}</span>}
                          </div>
                        </div>

                        <div className="team-match-score-block">
                          <strong>{match.score}</strong>
                          <span>{config.icon} {config.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <style>{`
          .team-modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px;
            background:
              radial-gradient(circle at top left, rgba(251, 191, 36, 0.20), transparent 34%),
              rgba(2, 6, 23, 0.70);
            backdrop-filter: blur(8px);
          }

          .team-modal {
            position: relative;
            width: min(540px, 100%);
            max-height: min(86vh, 680px);
            overflow: hidden;
            border-radius: 22px;
            background: rgba(255, 255, 255, 0.97);
            border: 1px solid rgba(255, 255, 255, 0.62);
            box-shadow: 0 28px 90px rgba(2, 6, 23, 0.42);
          }

          .team-modal-close {
            position: absolute;
            top: 11px;
            right: 11px;
            z-index: 2;
            width: 30px;
            height: 30px;
            border: 0;
            border-radius: 999px;
            display: grid;
            place-items: center;
            color: white;
            background: rgba(255, 255, 255, 0.18);
            cursor: pointer;
            font-weight: 900;
            font-size: 15px;
          }

          .team-modal-close:hover {
            background: rgba(255, 255, 255, 0.28);
          }

          .team-modal-hero {
            padding: 22px 24px 20px;
            color: white;
            background:
              radial-gradient(circle at 12% 15%, rgba(251, 191, 36, 0.32), transparent 26%),
              linear-gradient(135deg, #06281c 0%, #0f766e 58%, #b45309 145%);
          }

          .team-modal-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
          }

          .team-modal-identity {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .team-modal-flag-shell {
            width: 50px;
            height: 50px;
            flex: 0 0 auto;
            display: grid;
            place-items: center;
            overflow: hidden;
            border-radius: 50%;
            background: white;
            border: 3px solid rgba(255, 255, 255, 0.88);
            box-shadow: 0 13px 30px rgba(2, 6, 23, 0.28);
          }

          .team-modal-flag-shell img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .team-modal-heading {
            min-width: 0;
          }

          .team-modal-heading span {
            display: inline-flex;
            margin-bottom: 5px;
            padding: 4px 8px;
            border-radius: 999px;
            color: #fde68a;
            background: rgba(255, 255, 255, 0.13);
            border: 1px solid rgba(255, 255, 255, 0.15);
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.07em;
          }

          .team-modal-heading h2 {
            margin: 0;
            max-width: 290px;
            overflow: hidden;
            font-size: clamp(25px, 4vw, 34px);
            line-height: 1;
            letter-spacing: -0.05em;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .team-ranking-card {
            min-width: 104px;
            padding: 10px 12px;
            border-radius: 16px;
            text-align: right;
            background: rgba(255, 255, 255, 0.13);
            border: 1px solid rgba(255, 255, 255, 0.18);
          }

          .team-ranking-card span {
            display: block;
            color: rgba(255, 255, 255, 0.72);
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.07em;
          }

          .team-ranking-card strong {
            display: block;
            margin-top: 3px;
            color: #fde68a;
            font-size: 28px;
            line-height: 1;
            font-weight: 950;
          }

          .team-modal-body {
            max-height: calc(86vh - 96px);
            overflow: auto;
            padding: 14px 18px 16px;
            background:
              radial-gradient(circle at top right, rgba(15, 118, 110, 0.07), transparent 28%),
              #f8fafc;
          }

          .team-modal-state {
            display: grid;
            place-items: center;
            padding: 34px 10px;
            color: #64748b;
            font-weight: 800;
          }

          .team-modal-ball {
            margin-bottom: 10px;
            font-size: 36px;
            animation: team-modal-bounce 1s infinite;
          }

          @keyframes team-modal-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-7px); }
          }

          .team-modal-error {
            padding: 12px;
            border-radius: 14px;
            color: #b91c1c;
            background: #fee2e2;
            font-weight: 800;
          }

          .team-form-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 13px;
          }

          .form-pill {
            padding: 9px 8px;
            border-radius: 14px;
            border: 1px solid rgba(15, 23, 42, 0.06);
            text-align: center;
          }

          .form-pill strong {
            display: block;
            font-size: 20px;
            line-height: 1;
            font-weight: 950;
          }

          .form-pill span {
            display: block;
            margin-top: 3px;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .team-section-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .team-section-title span {
            display: block;
            color: #0f766e;
            font-size: 12px;
            font-weight: 950;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }

          .team-match-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .team-match-card {
            position: relative;
            display: grid;
            grid-template-columns: 34px minmax(0, 1fr) auto;
            gap: 10px;
            align-items: center;
            min-height: 58px;
            padding: 9px 12px;
            overflow: hidden;
            border-radius: 16px;
            background: white;
            border: 1px solid rgba(15, 23, 42, 0.06);
            box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
          }

          .team-match-card::before {
            content: '';
            position: absolute;
            inset: 0 auto 0 0;
            width: 4px;
            background: currentColor;
          }

          .team-match-result {
            width: 28px;
            height: 28px;
            display: grid;
            place-items: center;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 950;
            background: rgba(255, 255, 255, 0.45);
          }

          .team-match-main {
            min-width: 0;
          }

          .team-match-main strong {
            display: block;
            overflow: hidden;
            color: #0f172a;
            font-size: 14px;
            font-weight: 900;
            line-height: 1.15;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .team-match-meta {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 5px;
            color: #64748b;
            font-size: 10px;
            font-weight: 800;
          }

          .team-match-meta span {
            padding: 3px 7px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.62);
          }

          .team-match-score-block {
            min-width: 72px;
            text-align: right;
          }

          .team-match-score-block strong {
            display: block;
            color: #0f172a;
            font-size: 20px;
            line-height: 1;
            font-weight: 950;
            font-variant-numeric: tabular-nums;
          }

          .team-match-score-block span {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 58px;
            margin-top: 5px;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 900;
            background: rgba(255, 255, 255, 0.74);
          }

          .result-win {
            color: #047857;
            background: #dcfce7;
          }

          .result-draw {
            color: #92400e;
            background: #fef3c7;
          }

          .result-loss {
            color: #b91c1c;
            background: #fee2e2;
          }

          .empty-form-card {
            padding: 16px;
            border-radius: 16px;
            color: #64748b;
            background: white;
            border: 1px dashed rgba(100, 116, 139, 0.4);
            font-weight: 800;
            text-align: center;
          }

          @media (max-width: 560px) {
            .team-modal-backdrop {
              padding: 10px;
            }

            .team-modal-title-row {
              align-items: stretch;
              flex-direction: column;
              gap: 12px;
            }

            .team-modal-heading h2 {
              max-width: 220px;
            }

            .team-ranking-card {
              width: 100%;
              text-align: left;
            }

            .team-form-summary {
              grid-template-columns: repeat(3, 1fr);
            }

            .team-match-card {
              grid-template-columns: 30px minmax(0, 1fr) auto;
              gap: 8px;
              padding: 8px 10px;
            }

            .team-match-score-block {
              min-width: 58px;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default TeamInfoModal;
