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

  const formatTimeBelge = (timestamp) => timestamp ? timestamp.substring(11, 16) : '--:--';
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

  const getRoundName = (matchId) => {
    if (matchId >= 73 && matchId <= 88) return '16e';
    if (matchId >= 89 && matchId <= 96) return '8e';
    if (matchId >= 97 && matchId <= 100) return 'Quart';
    if (matchId >= 101 && matchId <= 102) return 'Demi';
    if (matchId === 103) return '3e place';
    if (matchId === 104) return 'Finale';
    return null;
  };

  const getMatchLabel = (match) => {
    const roundName = getRoundName(match.id);
    if (roundName) return `Match ${match.id} · ${roundName}`;

    if (match.groupe1) {
      return `Groupe ${match.groupe1}`;
    }

    return match.description?.split('—')[0].trim() || 'Match';
  };

  const getPreviousRoundWinnerLabel = (firstPreviousMatchId, matchId, position) => {
    const previousMatchId = firstPreviousMatchId + ((matchId - firstPreviousMatchId - 16) * 2) + (position === 'team1' ? 0 : 1);
    return `Vainqueur Match ${previousMatchId}`;
  };

  const getKnockoutTeamLabel = (matchId, position) => {
    if (matchId >= 73 && matchId <= 88) {
      return position === 'team1' ? `Équipe 1 · Match ${matchId}` : `Équipe 2 · Match ${matchId}`;
    }

    if (matchId >= 89 && matchId <= 96) {
      const previousMatchId = 73 + ((matchId - 89) * 2) + (position === 'team1' ? 0 : 1);
      return `Vainqueur Match ${previousMatchId}`;
    }

    if (matchId >= 97 && matchId <= 100) {
      const previousMatchId = 89 + ((matchId - 97) * 2) + (position === 'team1' ? 0 : 1);
      return `Vainqueur Match ${previousMatchId}`;
    }

    if (matchId >= 101 && matchId <= 102) {
      const previousMatchId = 97 + ((matchId - 101) * 2) + (position === 'team1' ? 0 : 1);
      return `Vainqueur Match ${previousMatchId}`;
    }

    if (matchId === 103) {
      return position === 'team1' ? 'Perdant Match 101' : 'Perdant Match 102';
    }

    if (matchId === 104) {
      return position === 'team1' ? 'Vainqueur Match 101' : 'Vainqueur Match 102';
    }

    return 'À déterminer';
  };

  const getTeamLabel = (match, position) => {
    const teamName = position === 'team1' ? match.team1 : match.team2;
    if (teamName) return teamName;
    return getKnockoutTeamLabel(match.id, position);
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

      setPredictions(prev => ({ ...prev, [matchId]: saved }));
      setTempScores(prev => ({ ...prev, [matchId]: { team1: saved.team1_goals, team2: saved.team2_goals } }));
      setSaveStatus(prev => ({ ...prev, [matchId]: 'saved' }));
    } catch (error) {
      console.error('Save prediction error:', error);
      setSaveStatus(prev => ({ ...prev, [matchId]: error.response?.data?.error || 'error' }));
    }
  }, []);

  const scheduleAutosave = useCallback((matchId, nextScores) => {
    if (saveTimers.current[matchId]) clearTimeout(saveTimers.current[matchId]);
    setSaveStatus(prev => ({ ...prev, [matchId]: 'dirty' }));
    saveTimers.current[matchId] = setTimeout(() => savePrediction(matchId, nextScores), AUTOSAVE_DELAY_MS);
  }, [savePrediction]);

  const handleScoreChange = (match, team, value) => {
    const matchId = match.id;
    const isClosed = new Date(match.start_time) <= new Date();
    const hasKnownTeams = Boolean(match.team1 && match.team2);
    if (isClosed || !hasKnownTeams) return;

    const nextScores = {
      ...getScoresForMatch(matchId),
      [team]: normalizeScore(value)
    };

    setTempScores(prev => ({ ...prev, [matchId]: nextScores }));
    scheduleAutosave(matchId, nextScores);
  };

  const groupedMatches = useMemo(() => {
    const grouped = {};
    matches.forEach(match => {
      const date = formatDateBelge(match.start_time);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(match);
    });
    return grouped;
  }, [matches]);

  const totalPredictions = Object.keys(predictions).length;
  const playableMatches = matches.filter(m => m.team1 && m.team2).length;
  const lockedMatches = matches.filter(m => new Date(m.start_time) <= new Date()).length;

  const getStatusConfig = (match, scores) => {
    const status = saveStatus[match.id];
    const isClosed = new Date(match.start_time) <= new Date();
    const hasKnownTeams = Boolean(match.team1 && match.team2);
    const isSaved = isPredictionSaved(match.id, scores);

    if (!hasKnownTeams) return { label: 'Agenda', icon: '📅', className: 'prediction-status neutral' };
    if (isClosed) return { label: 'Fermé', icon: '🔒', className: 'prediction-status locked' };
    if (status === 'saving') return { label: 'Enregistrement...', icon: '⏳', className: 'prediction-status saving' };
    if (status === 'dirty') return { label: 'Modifié...', icon: '✍️', className: 'prediction-status dirty' };
    if (status && status !== 'saved') return { label: 'Erreur', icon: '⚠️', className: 'prediction-status error', detail: status };
    if (isSaved) return { label: 'Enregistré', icon: '✅', className: 'prediction-status saved' };
    return { label: 'À pronostiquer', icon: '🎯', className: 'prediction-status todo' };
  };

  const TeamBlock = ({ match, position, align }) => {
    const teamName = position === 'team1' ? match.team1 : match.team2;
    const label = getTeamLabel(match, position);
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
            <p>Entre tes scores, on s'occupe du reste. La sauvegarde est automatique et les pronostics se verrouillent au coup d'envoi.</p>
          </div>
          <div className="prediction-summary">
            <div><strong>{totalPredictions}</strong><span>pronos saisis</span></div>
            <div><strong>{playableMatches}</strong><span>matchs jouables</span></div>
            <div><strong>{lockedMatches}</strong><span>fermés</span></div>
          </div>
        </section>

        <div className="autosave-hint">
          <span>💾</span>
          <div>
            <strong>Sauvegarde automatique</strong>
            <p>Tu modifies un score, il est enregistré après une courte pause.</p>
          </div>
        </div>

        {Object.entries(groupedMatches).map(([date, dateMatches]) => (
          <section key={date} className="match-day-card">
            <div className="match-day-header">
              <div><span>📅 Journée</span><h2>{date}</h2></div>
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
                            <input type="number" min="0" max="20" value={scores.team1} onChange={(e) => handleScoreChange(match, 'team1', e.target.value)} disabled={disabled} aria-label={`Score ${match.team1}`} />
                            <span className="score-separator">-</span>
                            <input type="number" min="0" max="20" value={scores.team2} onChange={(e) => handleScoreChange(match, 'team2', e.target.value)} disabled={disabled} aria-label={`Score ${match.team2}`} />
                          </>
                        ) : (
                          <div className="unknown-match-note">Équipes à déterminer</div>
                        )}
                      </div>

                      <TeamBlock match={match} position="team2" />
                    </div>

                    <div className="match-status-zone">
                      <div className={statusConfig.className} title={statusConfig.detail || ''}>
                        <span>{statusConfig.icon}</span>{statusConfig.label}
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
          background: radial-gradient(circle at top left, rgba(217,119,6,.15), transparent 32%), radial-gradient(circle at top right, rgba(15,118,110,.18), transparent 32%), linear-gradient(135deg, #071b16 0%, #0f172a 45%, #111827 100%);
          padding: 24px 18px 42px;
          color: ${DARK};
        }
        .predictions-container { width: min(1180px, 100%); margin: 0 auto; }
        .predictions-hero { display: flex; justify-content: space-between; gap: 22px; align-items: stretch; margin-bottom: 16px; color: white; }
        .eyebrow { display: inline-flex; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #fde68a; margin-bottom: 10px; }
        .predictions-hero h1 { margin: 0 0 7px; font-size: clamp(28px, 3.4vw, 44px); line-height: 1; letter-spacing: -.04em; }
        .predictions-hero p { margin: 0; max-width: 620px; color: rgba(255,255,255,.76); font-size: 14px; line-height: 1.5; }
        .prediction-summary { display: grid; grid-template-columns: repeat(3, minmax(82px,1fr)); gap: 8px; min-width: 305px; }
        .prediction-summary div { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); border-radius: 14px; padding: 12px; backdrop-filter: blur(10px); box-shadow: 0 16px 38px rgba(0,0,0,.16); }
        .prediction-summary strong { display: block; font-size: 25px; color: #fde68a; line-height: 1; }
        .prediction-summary span { display: block; margin-top: 6px; color: rgba(255,255,255,.7); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
        .autosave-hint { display: flex; gap: 12px; align-items: center; background: rgba(255,255,255,.95); border-radius: 16px; padding: 12px 14px; margin-bottom: 16px; box-shadow: 0 18px 45px rgba(0,0,0,.19); }
        .autosave-hint > span { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; background: ${GRADIENT}; color: white; flex: 0 0 auto; }
        .autosave-hint strong { display: block; font-size: 13px; color: ${DARK}; }
        .autosave-hint p { margin: 2px 0 0; color: #64748b; font-size: 12px; }
        .match-day-card { background: rgba(255,255,255,.94); border-radius: 18px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 18px 55px rgba(0,0,0,.2); border: 1px solid rgba(255,255,255,.55); }
        .match-day-header { display: flex; justify-content: space-between; align-items: center; padding: 13px 17px; background: ${GRADIENT}; color: white; }
        .match-day-header span { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; opacity: .84; }
        .match-day-header h2 { margin: 2px 0 0; font-size: 16px; text-transform: capitalize; }
        .match-count { padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.18); }
        .match-list { padding: 6px; }
        .match-row { display: grid; grid-template-columns: 118px minmax(410px,1fr) 130px; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px; transition: background .16s ease, box-shadow .16s ease; }
        .match-row + .match-row { margin-top: 3px; }
        .match-row:hover { background: #f8fafc; box-shadow: inset 0 0 0 1px #e2e8f0; }
        .match-row-disabled { opacity: .72; }
        .match-meta { display: flex; align-items: center; gap: 8px; }
        .match-label { max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 5px 8px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .035em; }
        .match-time { font-variant-numeric: tabular-nums; color: ${DARK}; font-size: 14px; font-weight: 900; }
        .match-main { display: grid; grid-template-columns: minmax(150px,1fr) 112px minmax(150px,1fr); align-items: center; gap: 12px; }
        .team-block { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .team-block-right { justify-content: flex-end; text-align: right; }
        .team-name { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${DARK}; font-size: 13px; font-weight: 800; }
        .flag-shell { width: 28px; height: 28px; border-radius: 50%; flex: 0 0 auto; display: grid; place-items: center; background: #e2e8f0; border: 2px solid white; box-shadow: 0 5px 14px rgba(15,23,42,.16); overflow: hidden; color: #64748b; font-weight: 900; font-size: 11px; }
        .flag-shell img { width: 100%; height: 100%; object-fit: cover; }
        .score-zone { min-width: 112px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .score-zone input { width: 38px; height: 34px; border: 1.5px solid #d1d5db; border-radius: 11px; background: white; color: ${DARK}; text-align: center; font-size: 15px; font-weight: 900; outline: none; box-shadow: 0 6px 15px rgba(15,23,42,.07); transition: border-color .16s ease, transform .16s ease, box-shadow .16s ease; }
        .score-zone input:focus { border-color: ${SECONDARY}; transform: translateY(-1px); box-shadow: 0 9px 18px rgba(217,119,6,.16); }
        .score-zone input:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; box-shadow: none; }
        .score-zone input::-webkit-outer-spin-button, .score-zone input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .score-zone input[type=number] { -moz-appearance: textfield; }
        .score-separator { color: #94a3b8; font-size: 16px; font-weight: 900; }
        .unknown-match-note { width: 100%; padding: 8px 9px; border-radius: 11px; background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 800; text-align: center; white-space: nowrap; }
        .match-status-zone { display: flex; justify-content: flex-end; }
        .prediction-status { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-width: 110px; padding: 6px 9px; border-radius: 999px; font-size: 11px; font-weight: 900; white-space: nowrap; }
        .prediction-status.saved { background: #dcfce7; color: #047857; }
        .prediction-status.saving, .prediction-status.dirty { background: #fef3c7; color: #92400e; }
        .prediction-status.todo { background: #dbeafe; color: #1d4ed8; }
        .prediction-status.locked, .prediction-status.neutral { background: #f1f5f9; color: #64748b; }
        .prediction-status.error { background: #fee2e2; color: #b91c1c; }
        .loading-page { display: grid; place-items: center; }
        .loading-card { text-align: center; color: white; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); border-radius: 18px; padding: 30px 42px; box-shadow: 0 22px 65px rgba(0,0,0,.22); }
        .loading-ball { font-size: 42px; margin-bottom: 12px; animation: bounce 1s infinite; }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @media (max-width: 920px) {
          .predictions-hero { flex-direction: column; }
          .prediction-summary { min-width: 0; }
          .match-row { grid-template-columns: 1fr; gap: 10px; }
          .match-meta, .match-status-zone { justify-content: center; }
          .match-main { grid-template-columns: 1fr; gap: 8px; }
          .team-block, .team-block-right { justify-content: center; text-align: center; }
          .team-block-right { flex-direction: row-reverse; }
        }
        @media (max-width: 560px) {
          .predictions-page { padding: 18px 10px 36px; }
          .prediction-summary { grid-template-columns: 1fr; }
          .match-day-header { align-items: flex-start; flex-direction: column; gap: 8px; }
          .match-row { padding: 10px; }
        }
      `}</style>
    </div>
  );
}

export default Predictions;
