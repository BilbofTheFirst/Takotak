import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { matchesService, predictionsService } from '../services/api';
import { getFlag } from '../utils/countryFlags';

const PRIMARY = '#0f766e';
const SECONDARY = '#d97706';
const DARK = '#0f172a';
const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;
const AUTOSAVE_DELAY_MS = 900;

const KNOCKOUT_MATCHES = {
  73: { round: '16e de finale', team1: '2A', team2: '2B' },
  74: { round: '16e de finale', team1: '1E', team2: '3A/B/C/D/F' },
  75: { round: '16e de finale', team1: '1F', team2: '2C' },
  76: { round: '16e de finale', team1: '1C', team2: '2F' },
  77: { round: '16e de finale', team1: '1I', team2: '3C/D/F/G/H' },
  78: { round: '16e de finale', team1: '2E', team2: '2I' },
  79: { round: '16e de finale', team1: '1A', team2: '3C/E/F/H/I' },
  80: { round: '16e de finale', team1: '1L', team2: '3E/H/I/J/K' },
  81: { round: '16e de finale', team1: '1D', team2: '3B/E/F/I/J' },
  82: { round: '16e de finale', team1: '1G', team2: '3A/E/H/I/J' },
  83: { round: '16e de finale', team1: '2K', team2: '2L' },
  84: { round: '16e de finale', team1: '1H', team2: '2J' },
  85: { round: '16e de finale', team1: '1B', team2: '3E/F/G/I/J' },
  86: { round: '16e de finale', team1: '1J', team2: '2H' },
  87: { round: '16e de finale', team1: '1K', team2: '3D/E/I/J/L' },
  88: { round: '16e de finale', team1: '2D', team2: '2G' },
  89: { round: '8e de finale', team1: 'V74', team2: 'V77' },
  90: { round: '8e de finale', team1: 'V73', team2: 'V75' },
  91: { round: '8e de finale', team1: 'V76', team2: 'V78' },
  92: { round: '8e de finale', team1: 'V79', team2: 'V80' },
  93: { round: '8e de finale', team1: 'V83', team2: 'V84' },
  94: { round: '8e de finale', team1: 'V81', team2: 'V82' },
  95: { round: '8e de finale', team1: 'V86', team2: 'V88' },
  96: { round: '8e de finale', team1: 'V85', team2: 'V87' },
  97: { round: 'Quart de finale', team1: 'V89', team2: 'V90' },
  98: { round: 'Quart de finale', team1: 'V93', team2: 'V94' },
  99: { round: 'Quart de finale', team1: 'V91', team2: 'V92' },
  100: { round: 'Quart de finale', team1: 'V95', team2: 'V96' },
  101: { round: 'Demi-finale', team1: 'V97', team2: 'V98' },
  102: { round: 'Demi-finale', team1: 'V99', team2: 'V100' },
  103: { round: '3e place', team1: 'P101', team2: 'P102' },
  104: { round: 'Finale', team1: 'V101', team2: 'V102' }
};

function Predictions() {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [tempScores, setTempScores] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [showPastDays, setShowPastDays] = useState(false);
  const saveTimers = useRef({});
  const dateRefs = useRef({});
  const hasAutoScrolled = useRef(false);

  const formatDateBelge = (timestamp) => {
    if (!timestamp) return '';
    const dateStr = timestamp.substring(0, 10);
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${days[date.getDay()]} ${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
  };

  const getDateKey = (timestamp) => timestamp ? timestamp.substring(0, 10) : 'unknown';
  const formatTimeBelge = (timestamp) => timestamp ? timestamp.substring(11, 16) : '--:--';
  const isKnockoutMatch = (matchId) => Boolean(KNOCKOUT_MATCHES[matchId]);
  const hasResult = (match) => match.team1_goals !== null && match.team1_goals !== undefined && match.team2_goals !== null && match.team2_goals !== undefined;
  const isValidScoreValue = (value) => /^\d{1,2}$/.test(String(value)) && Number(value) >= 0 && Number(value) <= 99;

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
          team1: String(prediction.team1_goals),
          team2: String(prediction.team2_goals)
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
    return () => Object.values(saveTimers.current).forEach(clearTimeout);
  }, [loadData]);

  const getMatchLabel = (match) => {
    if (KNOCKOUT_MATCHES[match.id]) return KNOCKOUT_MATCHES[match.id].round;
    if (match.groupe1) return `Groupe ${match.groupe1}`;
    return match.description?.split('—')[0].trim() || 'Match';
  };

  const getTeamLabel = (match, position) => {
    const teamName = position === 'team1' ? match.team1 : match.team2;
    if (teamName) return teamName;
    const knockout = KNOCKOUT_MATCHES[match.id];
    if (knockout) return knockout[position];
    return 'À déterminer';
  };

  const getScoresForMatch = (matchId) => {
    const pred = predictions[matchId];
    return tempScores[matchId] || {
      team1: pred ? String(pred.team1_goals) : '0',
      team2: pred ? String(pred.team2_goals) : '0'
    };
  };

  const isPredictionSaved = (matchId, scores) => {
    const pred = predictions[matchId];
    return !!pred && String(pred.team1_goals) === String(scores.team1) && String(pred.team2_goals) === String(scores.team2);
  };

  const calculatePredictionPoints = (match, prediction) => {
    if (!prediction || !hasResult(match)) return null;

    const predictedHome = Number(prediction.team1_goals);
    const predictedAway = Number(prediction.team2_goals);
    const actualHome = Number(match.team1_goals);
    const actualAway = Number(match.team2_goals);

    if (predictedHome === actualHome && predictedAway === actualAway) return 3;

    const predictedDiff = predictedHome - predictedAway;
    const actualDiff = actualHome - actualAway;
    if (predictedDiff === actualDiff) return 2;

    const predictedOutcome = Math.sign(predictedDiff);
    const actualOutcome = Math.sign(actualDiff);
    if (predictedOutcome === actualOutcome) return 1;

    return 0;
  };

  const savePrediction = useCallback(async (matchId, scores) => {
    if (!isValidScoreValue(scores.team1) || !isValidScoreValue(scores.team2)) {
      setSaveStatus(prev => ({ ...prev, [matchId]: 'invalid' }));
      return;
    }

    setSaveStatus(prev => ({ ...prev, [matchId]: 'saving' }));

    try {
      const response = await predictionsService.create(matchId, Number(scores.team1), Number(scores.team2));
      const saved = {
        ...response.data,
        team1_goals: Number(response.data.team1_goals),
        team2_goals: Number(response.data.team2_goals)
      };

      setPredictions(prev => ({ ...prev, [matchId]: saved }));
      setTempScores(prev => ({ ...prev, [matchId]: { team1: String(saved.team1_goals), team2: String(saved.team2_goals) } }));
      setSaveStatus(prev => ({ ...prev, [matchId]: 'saved' }));
    } catch (error) {
      console.error('Save prediction error:', error);
      setSaveStatus(prev => ({ ...prev, [matchId]: error.response?.data?.error || 'error' }));
    }
  }, []);

  const scheduleAutosave = useCallback((matchId, nextScores) => {
    if (saveTimers.current[matchId]) clearTimeout(saveTimers.current[matchId]);

    if (!isValidScoreValue(nextScores.team1) || !isValidScoreValue(nextScores.team2)) {
      setSaveStatus(prev => ({ ...prev, [matchId]: 'editing' }));
      return;
    }

    setSaveStatus(prev => ({ ...prev, [matchId]: 'dirty' }));
    saveTimers.current[matchId] = setTimeout(() => savePrediction(matchId, nextScores), AUTOSAVE_DELAY_MS);
  }, [savePrediction]);

  const handleScoreChange = (match, team, value) => {
    const matchId = match.id;
    const isClosed = new Date(match.start_time) <= new Date();
    const hasKnownTeams = Boolean(match.team1 && match.team2);
    if (isClosed || !hasKnownTeams || hasResult(match)) return;

    const cleanedValue = String(value).replace(/\D/g, '').slice(0, 2);
    const nextScores = {
      ...getScoresForMatch(matchId),
      [team]: cleanedValue
    };

    setTempScores(prev => ({ ...prev, [matchId]: nextScores }));
    scheduleAutosave(matchId, nextScores);
  };

  const dayGroups = useMemo(() => {
    const grouped = new Map();

    matches.forEach(match => {
      const key = getDateKey(match.start_time);
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          label: formatDateBelge(match.start_time),
          date: new Date(`${key}T00:00:00`),
          matches: []
        });
      }
      grouped.get(key).matches.push(match);
    });

    return Array.from(grouped.values()).sort((a, b) => a.date - b.date);
  }, [matches]);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isPastGroup = useCallback((group) => group.matches.every(match => new Date(match.start_time) < todayStart), [todayStart]);
  const hiddenPastGroupsCount = dayGroups.filter(isPastGroup).length;
  const visibleDayGroups = showPastDays ? dayGroups : dayGroups.filter(group => !isPastGroup(group));

  const firstRelevantDateKey = useMemo(() => {
    const now = new Date();
    const nextGroup = dayGroups.find(group => group.matches.some(match => new Date(match.start_time) >= now || !hasResult(match)));
    return nextGroup?.key || dayGroups[0]?.key;
  }, [dayGroups]);

  const scrollToRelevantDate = useCallback(() => {
    const target = dateRefs.current[firstRelevantDateKey];
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [firstRelevantDateKey]);

  useEffect(() => {
    if (!loading && firstRelevantDateKey && !hasAutoScrolled.current) {
      hasAutoScrolled.current = true;
      setTimeout(() => scrollToRelevantDate(), 250);
    }
  }, [loading, firstRelevantDateKey, scrollToRelevantDate]);

  const totalPredictions = Object.keys(predictions).length;
  const playableMatches = matches.filter(m => m.team1 && m.team2 && !hasResult(m)).length;
  const lockedMatches = matches.filter(m => new Date(m.start_time) <= new Date() || hasResult(m)).length;

  const getStatusConfig = (match, scores) => {
    const status = saveStatus[match.id];
    const isClosed = new Date(match.start_time) <= new Date();
    const hasKnownTeams = Boolean(match.team1 && match.team2);
    const prediction = predictions[match.id];
    const isSaved = isPredictionSaved(match.id, scores);
    const points = calculatePredictionPoints(match, prediction);

    if (!hasKnownTeams) return null;
    if (points !== null) return { label: `+${points} pt${points > 1 ? 's' : ''}`, icon: '🏆', className: `prediction-status points points-${points}` };
    if (isClosed) return { label: 'Fermé', icon: '🔒', className: 'prediction-status locked' };
    if (status === 'saving') return { label: 'Enregistrement...', icon: '⏳', className: 'prediction-status saving' };
    if (status === 'dirty') return { label: 'Modifié...', icon: '✍️', className: 'prediction-status dirty' };
    if (status === 'editing') return { label: 'Saisie...', icon: '⌨️', className: 'prediction-status dirty' };
    if (status === 'invalid') return { label: 'Score incomplet', icon: '⚠️', className: 'prediction-status error' };
    if (status && status !== 'saved') return { label: 'Erreur', icon: '⚠️', className: 'prediction-status error', detail: status };
    if (isSaved) return { label: 'Enregistré', icon: '✅', className: 'prediction-status saved' };
    return { label: 'À pronostiquer', icon: '🎯', className: 'prediction-status todo' };
  };

  const TeamBlock = ({ match, position, align }) => {
    const teamName = position === 'team1' ? match.team1 : match.team2;
    const label = getTeamLabel(match, position);
    const flag = teamName ? getFlag(teamName) : null;
    const knockoutPlaceholder = !teamName && isKnockoutMatch(match.id);

    return (
      <div className={`team-block ${align === 'right' ? 'team-block-right' : ''}`}>
        {align === 'right' && <span className={`team-name ${knockoutPlaceholder ? 'team-placeholder' : ''}`}>{label}</span>}
        <span className="flag-shell">
          {flag ? <img src={flag} alt={teamName} /> : <span>{knockoutPlaceholder ? 'KO' : '?'}</span>}
        </span>
        {align !== 'right' && <span className={`team-name ${knockoutPlaceholder ? 'team-placeholder' : ''}`}>{label}</span>}
      </div>
    );
  };

  const ScoreZone = ({ match, scores, hasKnownTeams, disabled }) => {
    const prediction = predictions[match.id];
    const points = calculatePredictionPoints(match, prediction);

    if (!hasKnownTeams) {
      return <div className="unknown-match-note">À définir</div>;
    }

    if (hasResult(match)) {
      return (
        <div className="result-zone">
          <div className="real-score">{match.team1_goals}-{match.team2_goals}</div>
          <div className="prediction-recap">
            {prediction ? `Prono ${prediction.team1_goals}-${prediction.team2_goals}` : 'Pas de prono'}
          </div>
          {points !== null && <div className={`points-chip points-${points}`}>+{points} pt{points > 1 ? 's' : ''}</div>}
        </div>
      );
    }

    return (
      <>
        <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength="2" value={scores.team1} onChange={(e) => handleScoreChange(match, 'team1', e.target.value)} disabled={disabled} aria-label={`Score ${match.team1}`} />
        <span className="score-separator">-</span>
        <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength="2" value={scores.team2} onChange={(e) => handleScoreChange(match, 'team2', e.target.value)} disabled={disabled} aria-label={`Score ${match.team2}`} />
      </>
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
            <p>La page se place automatiquement sur les prochains matchs. Les journées terminées sont masquées par défaut, mais restent consultables.</p>
          </div>
          <div className="prediction-summary">
            <div><strong>{totalPredictions}</strong><span>pronos saisis</span></div>
            <div><strong>{playableMatches}</strong><span>matchs jouables</span></div>
            <div><strong>{lockedMatches}</strong><span>fermés/résultats</span></div>
          </div>
        </section>

        <div className="prediction-toolbar">
          <button type="button" onClick={scrollToRelevantDate}>🎯 Aller aux prochains matchs</button>
          {hiddenPastGroupsCount > 0 && (
            <button type="button" onClick={() => setShowPastDays(prev => !prev)}>
              {showPastDays ? 'Masquer les journées passées' : `Afficher les journées passées (${hiddenPastGroupsCount})`}
            </button>
          )}
          <div className="autosave-inline"><span>💾</span> Sauvegarde automatique</div>
        </div>

        {visibleDayGroups.map(group => (
          <section key={group.key} ref={el => { dateRefs.current[group.key] = el; }} className={`match-day-card ${isPastGroup(group) ? 'past-day-card' : ''}`}>
            <div className="match-day-header">
              <div><span>📅 Journée</span><h2>{group.label}</h2></div>
              <span className="match-count">{group.matches.length} match{group.matches.length > 1 ? 's' : ''}</span>
            </div>

            <div className="match-list">
              {group.matches.map(match => {
                const scores = getScoresForMatch(match.id);
                const isClosed = new Date(match.start_time) <= new Date();
                const hasKnownTeams = Boolean(match.team1 && match.team2);
                const disabled = isClosed || !hasKnownTeams || hasResult(match);
                const statusConfig = getStatusConfig(match, scores);
                const knockout = isKnockoutMatch(match.id);
                const resultAvailable = hasResult(match);

                return (
                  <article key={match.id} className={`match-row ${disabled ? 'match-row-disabled' : ''} ${resultAvailable ? 'match-row-result' : ''}`}>
                    <div className="match-meta">
                      <span className="match-label">{getMatchLabel(match)}</span>
                      <span className="match-time">{formatTimeBelge(match.start_time)}</span>
                    </div>

                    <div className="match-main">
                      <TeamBlock match={match} position="team1" align="right" />
                      <div className="score-zone"><ScoreZone match={match} scores={scores} hasKnownTeams={hasKnownTeams} disabled={disabled} /></div>
                      <TeamBlock match={match} position="team2" />
                    </div>

                    <div className="match-status-zone">
                      {knockout && <span className="match-number">M{match.id}</span>}
                      {statusConfig && (
                        <div className={statusConfig.className} title={statusConfig.detail || ''}>
                          <span>{statusConfig.icon}</span>{statusConfig.label}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <style>{`
        .predictions-page { min-height: 100vh; background: radial-gradient(circle at top left, rgba(217,119,6,.15), transparent 32%), radial-gradient(circle at top right, rgba(15,118,110,.18), transparent 32%), linear-gradient(135deg, #071b16 0%, #0f172a 45%, #111827 100%); padding: 24px 18px 42px; color: ${DARK}; }
        .predictions-container { width: min(1220px, 100%); margin: 0 auto; scroll-margin-top: 20px; }
        .predictions-hero { display: flex; justify-content: space-between; gap: 22px; align-items: stretch; margin-bottom: 16px; color: white; }
        .eyebrow { display: inline-flex; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #fde68a; margin-bottom: 10px; }
        .predictions-hero h1 { margin: 0 0 7px; font-size: clamp(28px, 3.4vw, 44px); line-height: 1; letter-spacing: -.04em; }
        .predictions-hero p { margin: 0; max-width: 650px; color: rgba(255,255,255,.76); font-size: 14px; line-height: 1.5; }
        .prediction-summary { display: grid; grid-template-columns: repeat(3, minmax(82px,1fr)); gap: 8px; min-width: 330px; }
        .prediction-summary div { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); border-radius: 14px; padding: 12px; backdrop-filter: blur(10px); box-shadow: 0 16px 38px rgba(0,0,0,.16); }
        .prediction-summary strong { display: block; font-size: 25px; color: #fde68a; line-height: 1; }
        .prediction-summary span { display: block; margin-top: 6px; color: rgba(255,255,255,.7); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
        .prediction-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; background: rgba(255,255,255,.95); border-radius: 16px; padding: 10px 12px; margin-bottom: 16px; box-shadow: 0 18px 45px rgba(0,0,0,.19); }
        .prediction-toolbar button { border: 0; border-radius: 999px; padding: 8px 12px; background: ${GRADIENT}; color: white; font-size: 12px; font-weight: 900; cursor: pointer; box-shadow: 0 8px 18px rgba(15,118,110,.18); }
        .prediction-toolbar button + button { background: #e2e8f0; color: #334155; box-shadow: none; }
        .autosave-inline { margin-left: auto; color: #64748b; font-size: 12px; font-weight: 800; }
        .match-day-card { background: rgba(255,255,255,.94); border-radius: 18px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 18px 55px rgba(0,0,0,.2); border: 1px solid rgba(255,255,255,.55); scroll-margin-top: 18px; }
        .past-day-card { opacity: .92; }
        .match-day-header { display: flex; justify-content: space-between; align-items: center; padding: 13px 17px; background: ${GRADIENT}; color: white; }
        .match-day-header span { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; opacity: .84; }
        .match-day-header h2 { margin: 2px 0 0; font-size: 16px; text-transform: capitalize; }
        .match-count { padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.18); }
        .match-list { padding: 6px; }
        .match-row { display: grid; grid-template-columns: 190px minmax(430px,1fr) 185px; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px; transition: background .16s ease, box-shadow .16s ease; }
        .match-row + .match-row { margin-top: 3px; }
        .match-row:hover { background: #f8fafc; box-shadow: inset 0 0 0 1px #e2e8f0; }
        .match-row-disabled { opacity: .76; }
        .match-row-result { background: linear-gradient(90deg, rgba(236,253,245,.75), rgba(255,255,255,.95)); }
        .match-meta { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .match-label { min-width: 112px; max-width: 145px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 5px 8px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .035em; text-align: center; }
        .match-number { padding: 4px 7px; border-radius: 8px; background: #fff7ed; color: #c2410c; font-size: 10px; font-weight: 900; }
        .match-time { font-variant-numeric: tabular-nums; color: ${DARK}; font-size: 14px; font-weight: 900; min-width: 45px; }
        .match-main { display: grid; grid-template-columns: minmax(165px,1fr) 124px minmax(165px,1fr); align-items: center; gap: 12px; }
        .team-block { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .team-block-right { justify-content: flex-end; text-align: right; }
        .team-name { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${DARK}; font-size: 13px; font-weight: 800; }
        .team-placeholder { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #334155; letter-spacing: -.02em; }
        .flag-shell { width: 28px; height: 28px; border-radius: 50%; flex: 0 0 auto; display: grid; place-items: center; background: #e2e8f0; border: 2px solid white; box-shadow: 0 5px 14px rgba(15,23,42,.16); overflow: hidden; color: #64748b; font-weight: 900; font-size: 9px; }
        .flag-shell img { width: 100%; height: 100%; object-fit: cover; }
        .score-zone { min-width: 124px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .score-zone input { width: 42px; height: 34px; border: 1.5px solid #d1d5db; border-radius: 11px; background: white; color: ${DARK}; text-align: center; font-size: 15px; font-weight: 900; outline: none; box-shadow: 0 6px 15px rgba(15,23,42,.07); transition: border-color .16s ease, transform .16s ease, box-shadow .16s ease; }
        .score-zone input:focus { border-color: ${SECONDARY}; transform: translateY(-1px); box-shadow: 0 9px 18px rgba(217,119,6,.16); }
        .score-zone input:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; box-shadow: none; }
        .score-separator { color: #94a3b8; font-size: 16px; font-weight: 900; }
        .unknown-match-note { width: 100%; padding: 8px 9px; border-radius: 11px; background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 800; text-align: center; white-space: nowrap; }
        .result-zone { display: grid; place-items: center; gap: 2px; min-width: 124px; }
        .real-score { padding: 4px 10px; border-radius: 11px; background: ${DARK}; color: white; font-size: 17px; line-height: 1; font-weight: 950; font-variant-numeric: tabular-nums; }
        .prediction-recap { color: #64748b; font-size: 10px; font-weight: 800; white-space: nowrap; }
        .points-chip { padding: 2px 7px; border-radius: 999px; font-size: 10px; font-weight: 950; }
        .points-3 { background: #dcfce7; color: #047857; }
        .points-2 { background: #dbeafe; color: #1d4ed8; }
        .points-1 { background: #fef3c7; color: #92400e; }
        .points-0 { background: #fee2e2; color: #b91c1c; }
        .match-status-zone { display: flex; justify-content: flex-end; align-items: center; gap: 8px; min-width: 0; }
        .prediction-status { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-width: 112px; padding: 6px 9px; border-radius: 999px; font-size: 11px; font-weight: 900; white-space: nowrap; }
        .prediction-status.saved { background: #dcfce7; color: #047857; }
        .prediction-status.saving, .prediction-status.dirty { background: #fef3c7; color: #92400e; }
        .prediction-status.todo { background: #dbeafe; color: #1d4ed8; }
        .prediction-status.locked { background: #f1f5f9; color: #64748b; }
        .prediction-status.error { background: #fee2e2; color: #b91c1c; }
        .prediction-status.points { min-width: 92px; }
        .loading-page { display: grid; place-items: center; }
        .loading-card { text-align: center; color: white; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); border-radius: 18px; padding: 30px 42px; box-shadow: 0 22px 65px rgba(0,0,0,.22); }
        .loading-ball { font-size: 42px; margin-bottom: 12px; animation: bounce 1s infinite; }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @media (max-width: 1060px) { .match-row { grid-template-columns: 1fr; gap: 10px; } .match-meta, .match-status-zone { justify-content: center; } }
        @media (max-width: 920px) { .predictions-hero { flex-direction: column; } .prediction-summary { min-width: 0; } .match-main { grid-template-columns: 1fr; gap: 8px; } .team-block, .team-block-right { justify-content: center; text-align: center; } .team-block-right { flex-direction: row-reverse; } .autosave-inline { margin-left: 0; } }
        @media (max-width: 560px) { .predictions-page { padding: 18px 10px 36px; } .prediction-summary { grid-template-columns: 1fr; } .match-day-header { align-items: flex-start; flex-direction: column; gap: 8px; } .match-row { padding: 10px; } .prediction-toolbar button { width: 100%; } }
      `}</style>
    </div>
  );
}

export default Predictions;
