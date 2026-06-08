import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { matchesService, predictionsService } from '../services/api';
import { getFlag } from '../utils/countryFlags';

const PRIMARY = '#0f766e';
const SECONDARY = '#d97706';
const DARK = '#0f172a';
const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;
const AUTOSAVE_DELAY_MS = 700;

function Predictions() {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [tempScores, setTempScores] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const saveTimers = useRef({});

  const formatDateBelge = (timestamp) => {
    if (!timestamp) return '';
    const dateStr = timestamp.substring(0, 10);
    const [year, month, day] = dateStr.split('-');

    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${days[date.getDay()]} ${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
  };

  const formatTimeBelge = (timestamp) => {
    if (!timestamp) return '--:--';
    return timestamp.substring(11, 16);
  };

  const normalizeScore = (value) => Math.max(0, Math.min(20, Number.parseInt(value, 10) || 0));

  const loadData = useCallback(async () => {
    try {
      const [matchesRes, predictionsRes] = await Promise.all([
        matchesService.getAll(),
        predictionsService.getAll()
      ]);

      setMatches(matchesRes.data);

      const predMap = {};
      const tempMap = {};

      predictionsRes.data.forEach(p => {
        const prediction = {
          ...p,
          team1_goals: Number(p.team1_goals),
          team2_goals: Number(p.team2_goals)
        };
        predMap[p.match_id] = prediction;
        tempMap[p.match_id] = {
          team1: prediction.team1_goals,
          team2: prediction.team2_goals
        };
      });

      setPredictions(predMap);
      setTempScores(tempMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    return () => {
      Object.values(saveTimers.current).forEach(clearTimeout);
    };
  }, [loadData]);

  const getMatchLabel = (match) => {
    if (match.description) {
      return match.description.split('—')[0].trim();
    }

    if (match.groupe1) {
      return `Groupe ${match.groupe1}`;
    }

    return 'Match';
  };

  const getTeamLabel = (matchId, position, teamName) => {
    if (teamName) return teamName;

    const koId = matchId - 72;
    if (koId <= 0) return 'À déterminer';

    if (koId <= 16) {
      const groupIndex = Math.floor((koId - 1) / 2);
      return position === 'team1'
        ? `1er Groupe ${String.fromCharCode(65 + groupIndex * 2)}`
        : `2e Groupe ${String.fromCharCode(65 + groupIndex * 2 + 1)}`;
    }

    if (koId <= 24) {
      return `Vainqueur 16e ${Math.ceil(koId / 2)}`;
    }

    if (koId <= 28) {
      return `Vainqueur 8e ${koId - 16}`;
    }

    if (koId <= 30) {
      return `Vainqueur quart ${koId - 20}`;
    }

    return 'À déterminer';
  };

  const getScoresForMatch = (matchId) => {
    const pred = predictions[matchId];
    return tempScores[matchId] || {
      team1: pred?.team1_goals ?? 0,
      team2: pred?.team2_goals ?? 0
    };
  };

  const isPredictionSaved = (matchId, scores) => {
    const pred = predictions[matchId];
    return !!pred && Number(pred.team1_goals) === Number(scores.team1) && Number(pred.team2_goals) === Number(scores.team2);
  };

  const savePrediction = useCallback(async (matchId, scores) => {
    setSaveStatus(prev => ({ ...prev, [matchId]: 'saving' }));

    try {
      const response = await predictionsService.create(matchId, scores.team1, scores.team2);
      const saved = {
        ...response.data,
        team1_goals: Number(response.data.team1_goals),
        team2_goals: Number(response.data.team2_goals)
      };

      setPredictions(prev => ({
        ...prev,
        [matchId]: saved
      }));

      setTempScores(prev => ({
        ...prev,
        [matchId]: {
          team1: saved.team1_goals,
          team2: saved.team2_goals
        }
      }));

      setSaveStatus(prev => ({ ...prev, [matchId]: 'saved' }));
    } catch (error) {
      console.error('Save prediction error:', error);
      setSaveStatus(prev => ({
        ...prev,
        [matchId]: error.response?.data?.error || 'error'
      }));
    }
  }, []);

  const scheduleAutosave = useCallback((matchId, nextScores) => {
    if (saveTimers.current[matchId]) {
      clearTimeout(saveTimers.current[matchId]);
    }

    setSaveStatus(prev => ({ ...prev, [matchId]: 'dirty' }));

    saveTimers.current[matchId] = setTimeout(() => {
      savePrediction(matchId, nextScores);
    }, AUTOSAVE_DELAY_MS);
  }, [savePrediction]);

  const handleScoreChange = (match, team, value) => {
    const matchId = match.id;
    const isClosed = new Date(match.start_time) <= new Date();
    const hasKnownTeams = Boolean(match.team1 && match.team2);

    if (isClosed || !hasKnownTeams) return;

    const currentScores = getScoresForMatch(matchId);
    const nextScores = {
      ...currentScores,
      [team]: normalizeScore(value)
    };

    setTempScores(prev => ({
      ...prev,
      [matchId]: nextScores
    }));

    scheduleAutosave(matchId, nextScores);
  };

  const groupByDate = (items) => {
    const grouped = {};
    items.forEach(match => {
      const date = formatDateBelge(match.start_time);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(match);
    });
    return grouped;
  };

  const groupedMatches = useMemo(() => groupByDate(matches), [matches]);
  const totalPredictions = Object.keys(predictions).length;
  const playableMatches = matches.filter(m => m.team1 && m.team2).length;
  const lockedMatches = matches.filter(m => new Date(m.start_time) <= new Date()).length;

  const getStatusConfig = (match, scores) => {
    const status = saveStatus[match.id];
    const isClosed = new Date(match.start_time) <= new Date();
    const hasKnownTeams = Boolean(match.team1 && match.team2);
    const isSaved = isPredictionSaved(match.id, scores);

    if (!hasKnownTeams) {
      return { label: 'Agenda', icon: '📅', className: 'prediction-status neutral' };
    }

    if (isClosed) {
      return { label: 'Fermé', icon: '🔒', className: 'prediction-status locked' };
    }

    if (status === 'saving') {
      return { label: 'Enregistrement...', icon: '⏳', className: 'prediction-status saving' };
    }

    if (status === 'dirty') {
      return { label: 'Modifié...', icon: '✍️', className: 'prediction-status dirty' };
    }

    if (status && status !== 'saved') {
      return { label: 'Erreur', icon: '⚠️', className: 'prediction-status error', detail: status };
    }

    if (isSaved) {
      return { label: 'Enregistré', icon: '✅', className: 'prediction-status saved' };
    }

    return { label: 'À pronostiquer', icon: '🎯', className: 'prediction-status todo' };
  };

  const TeamBlock = ({ match, position, align }) => {
    const teamName = position === 'team1' ? match.team1 : match.team2;
    const label = getTeamLabel(match.id, position, teamName);
    const flag = teamName ? getFlag(teamName) : null;

    return (
      <div className={`team-block ${align === 'right' ? 'team-block-right' : ''}`}>
        {align === 'right' && <span className="team-name">{label}</span>}
        <span className="flag-shell">
          {flag ? <img src={flag} alt={teamName} /> : <span>?</span>}
        </span>
        {align !== 'right' && <span className="team-name">{label}</span>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="predictions-page loading-page">
        <div className="loading-card">
          <div className="loading-ball">⚽</div>
          <p>Chargement des matchs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="predictions-page">
      <div className="predictions-container">
        <section className="predictions-hero">
          <div>
            <span className="eyebrow">Coupe du Monde 2026</span>
            <h1>🎯 Mes pronostics</h1>
            <p>
              Entre tes scores, on s'occupe du reste. La sauvegarde est automatique et les pronostics se verrouillent au coup d'envoi.
            </p>
          </div>
          <div className="prediction-summary">
            <div>
              <strong>{totalPredictions}</strong>
              <span>pronos saisis</span>
            </div>
            <div>
              <strong>{playableMatches}</strong>
              <span>matchs jouables</span>
            </div>
            <div>
              <strong>{lockedMatches}</strong>
              <span>fermés</span>
            </div>
          </div>
        </section>

        <div className="autosave-hint">
          <span>💾</span>
          <div>
            <strong>Sauvegarde automatique</strong>
            <p>Tu modifies un score, il est enregistré après une courte pause. Plus besoin de bouton moche.</p>
          </div>
        </div>

        {Object.entries(groupedMatches).map(([date, dateMatches]) => (
          <section key={date} className="match-day-card">
            <div className="match-day-header">
              <div>
                <span>📅 Journée</span>
                <h2>{date}</h2>
              </div>
              <span className="match-count">{dateMatches.length} match{dateMatches.length > 1 ? 's' : ''}</span>
            </div>

            <div className="match-list">
              {dateMatches.map(match => {
                const scores = getScoresForMatch(match.id);
                const isClosed = new Date(match.start_time) <= new Date();
                const hasKnownTeams = Boolean(match.team1 && match.team2);
                const disabled = isClosed || !hasKnownTeams;
                const statusConfig = getStatusConfig(match, scores);

                return (
                  <article key={match.id} className={`match-row ${disabled ? 'match-row-disabled' : ''}`}>
                    <div className="match-meta">
                      <span className="match-label">{getMatchLabel(match)}</span>
                      <span className="match-time">{formatTimeBelge(match.start_time)}</span>
                    </div>

                    <div className="match-main">
                      <TeamBlock match={match} position="team1" align="right" />

                      <div className="score-zone">
                        {hasKnownTeams ? (
                          <>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={scores.team1}
                              onChange={(e) => handleScoreChange(match, 'team1', e.target.value)}
                              disabled={disabled}
                              aria-label={`Score ${match.team1}`}
                            />
                            <span className="score-separator">-</span>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={scores.team2}
                              onChange={(e) => handleScoreChange(match, 'team2', e.target.value)}
                              disabled={disabled}
                              aria-label={`Score ${match.team2}`}
                            />
                          </>
                        ) : (
                          <div className="unknown-match-note">Équipes à déterminer</div>
                        )}
                      </div>

                      <TeamBlock match={match} position="team2" />
                    </div>

                    <div className="match-status-zone">
                      <div className={statusConfig.className} title={statusConfig.detail || ''}>
                        <span>{statusConfig.icon}</span>
                        {statusConfig.label}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <style>{`
        .predictions-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(217, 119, 6, 0.18), transparent 34%),
            radial-gradient(circle at top right, rgba(15, 118, 110, 0.22), transparent 32%),
            linear-gradient(135deg, #071b16 0%, #0f172a 42%, #111827 100%);
          padding: 34px 20px 56px;
          color: #0f172a;
        }

        .predictions-container {
          width: min(1220px, 100%);
          margin: 0 auto;
        }

        .predictions-hero {
          display: flex;
          justify-content: space-between;
          gap: 28px;
          align-items: stretch;
          margin-bottom: 22px;
          color: white;
        }

        .eyebrow {
          display: inline-flex;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #fde68a;
          margin-bottom: 12px;
        }

        .predictions-hero h1 {
          margin: 0 0 8px;
          font-size: clamp(32px, 4vw, 52px);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .predictions-hero p {
          margin: 0;
          max-width: 650px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 16px;
          line-height: 1.55;
        }

        .prediction-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(92px, 1fr));
          gap: 10px;
          min-width: 340px;
        }

        .prediction-summary div {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 18px;
          padding: 18px;
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
        }

        .prediction-summary strong {
          display: block;
          font-size: 30px;
          color: #fde68a;
          line-height: 1;
        }

        .prediction-summary span {
          display: block;
          margin-top: 8px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .autosave-hint {
          display: flex;
          gap: 14px;
          align-items: center;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          padding: 16px 18px;
          margin-bottom: 22px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
        }

        .autosave-hint > span {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: ${GRADIENT};
          color: white;
          flex: 0 0 auto;
        }

        .autosave-hint strong {
          display: block;
          font-size: 14px;
          color: ${DARK};
        }

        .autosave-hint p {
          margin: 3px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .match-day-card {
          background: rgba(255, 255, 255, 0.94);
          border-radius: 24px;
          overflow: hidden;
          margin-bottom: 22px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.24);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .match-day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 22px;
          background: ${GRADIENT};
          color: white;
        }

        .match-day-header span {
          display: block;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.84;
        }

        .match-day-header h2 {
          margin: 3px 0 0;
          font-size: 19px;
          text-transform: capitalize;
        }

        .match-count {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .match-list {
          padding: 8px;
        }

        .match-row {
          display: grid;
          grid-template-columns: 132px minmax(420px, 1fr) 150px;
          align-items: center;
          gap: 16px;
          padding: 14px 16px;
          border-radius: 18px;
          transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }

        .match-row + .match-row {
          margin-top: 6px;
        }

        .match-row:hover {
          background: #f8fafc;
          box-shadow: inset 0 0 0 1px #e2e8f0;
        }

        .match-row-disabled {
          opacity: 0.72;
        }

        .match-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .match-label {
          max-width: 82px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 6px 9px;
          border-radius: 999px;
          background: #ecfdf5;
          color: #047857;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .match-time {
          font-variant-numeric: tabular-nums;
          color: ${DARK};
          font-size: 15px;
          font-weight: 900;
        }

        .match-main {
          display: grid;
          grid-template-columns: minmax(150px, 1fr) 126px minmax(150px, 1fr);
          align-items: center;
          gap: 18px;
        }

        .team-block {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .team-block-right {
          justify-content: flex-end;
          text-align: right;
        }

        .team-name {
          display: block;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: ${DARK};
          font-size: 15px;
          font-weight: 800;
        }

        .flag-shell {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          background: #e2e8f0;
          border: 2px solid white;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
          overflow: hidden;
          color: #64748b;
          font-weight: 900;
        }

        .flag-shell img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .score-zone {
          min-width: 126px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .score-zone input {
          width: 46px;
          height: 42px;
          border: 2px solid #d1d5db;
          border-radius: 14px;
          background: white;
          color: ${DARK};
          text-align: center;
          font-size: 18px;
          font-weight: 900;
          outline: none;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
          transition: border-color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
        }

        .score-zone input:focus {
          border-color: ${SECONDARY};
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(217, 119, 6, 0.18);
        }

        .score-zone input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        .score-zone input::-webkit-outer-spin-button,
        .score-zone input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .score-zone input[type=number] {
          -moz-appearance: textfield;
        }

        .score-separator {
          color: #94a3b8;
          font-size: 18px;
          font-weight: 900;
        }

        .unknown-match-note {
          width: 100%;
          padding: 9px 10px;
          border-radius: 12px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          text-align: center;
          white-space: nowrap;
        }

        .match-status-zone {
          display: flex;
          justify-content: flex-end;
        }

        .prediction-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: 128px;
          padding: 8px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }

        .prediction-status.saved {
          background: #dcfce7;
          color: #047857;
        }

        .prediction-status.saving,
        .prediction-status.dirty {
          background: #fef3c7;
          color: #92400e;
        }

        .prediction-status.todo {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .prediction-status.locked,
        .prediction-status.neutral {
          background: #f1f5f9;
          color: #64748b;
        }

        .prediction-status.error {
          background: #fee2e2;
          color: #b91c1c;
        }

        .loading-page {
          display: grid;
          place-items: center;
        }

        .loading-card {
          text-align: center;
          color: white;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 22px;
          padding: 34px 46px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
        }

        .loading-ball {
          font-size: 48px;
          margin-bottom: 14px;
          animation: bounce 1s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @media (max-width: 920px) {
          .predictions-hero {
            flex-direction: column;
          }

          .prediction-summary {
            min-width: 0;
          }

          .match-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .match-meta,
          .match-status-zone {
            justify-content: center;
          }

          .match-main {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .team-block,
          .team-block-right {
            justify-content: center;
            text-align: center;
          }

          .team-block-right {
            flex-direction: row-reverse;
          }
        }

        @media (max-width: 560px) {
          .predictions-page {
            padding: 22px 12px 42px;
          }

          .prediction-summary {
            grid-template-columns: 1fr;
          }

          .match-day-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }

          .match-row {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default Predictions;
