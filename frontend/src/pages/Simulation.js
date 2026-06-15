import React, { useEffect, useMemo, useState } from 'react';
import { matchesService, predictionsService } from '../services/api';
import { getFlag } from '../utils/countryFlags';
import TournamentBracket from '../components/TournamentBracket';
import TeamInfoModal from '../components/TeamInfoModal';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const PRIMARY = '#0f766e';
const SECONDARY = '#d97706';
const DARK = '#0f172a';
const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;
const defaultScore = { team1_goals: 0, team2_goals: 0 };

const hasRealResult = (match) => (
  match?.team1_goals !== null && match?.team1_goals !== undefined &&
  match?.team2_goals !== null && match?.team2_goals !== undefined
);

const getRealScore = (match) => {
  const score = {
    team1_goals: Number(match.team1_goals || 0),
    team2_goals: Number(match.team2_goals || 0)
  };

  if (Number(score.team1_goals) === Number(score.team2_goals)) {
    if (match.winner_team_id && Number(match.winner_team_id) === Number(match.team1_id)) score.winner = 'team1';
    if (match.winner_team_id && Number(match.winner_team_id) === Number(match.team2_id)) score.winner = 'team2';
  }

  return score;
};

function Simulation() {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [simulations, setSimulations] = useState({});
  const [koSimulations, setKoSimulations] = useState({});
  const [includeRealResults, setIncludeRealResults] = useState(() => localStorage.getItem('takotak_sim_include_real_results') !== '0');
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (Object.keys(simulations).length > 0) {
      localStorage.setItem('takotak_simulations', JSON.stringify(simulations));
      localStorage.setItem('takotak_ko_simulations', JSON.stringify(koSimulations));
    }
  }, [simulations, koSimulations]);

  useEffect(() => {
    localStorage.setItem('takotak_sim_include_real_results', includeRealResults ? '1' : '0');
  }, [includeRealResults]);

  const loadData = async () => {
    try {
      const [matchesRes, predictionsRes] = await Promise.all([matchesService.getAll(), predictionsService.getAll()]);
      const allMatches = matchesRes.data.sort((a, b) => Number(a.id) - Number(b.id));
      setMatches(allMatches);

      const predMap = {};
      predictionsRes.data.forEach(prediction => {
        predMap[prediction.match_id] = { ...prediction, team1_goals: Number(prediction.team1_goals), team2_goals: Number(prediction.team2_goals) };
      });
      setPredictions(predMap);

      const savedSims = localStorage.getItem('takotak_simulations');
      const savedKoSims = localStorage.getItem('takotak_ko_simulations');
      const initialSims = savedSims ? JSON.parse(savedSims) : {};

      allMatches.filter(match => Number(match.id) <= 72).forEach(match => {
        if (!initialSims[match.id]) initialSims[match.id] = { ...defaultScore };
      });

      setSimulations(initialSims);
      if (savedKoSims) setKoSimulations(JSON.parse(savedKoSims));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeScore = (value) => Math.max(0, Math.min(20, parseInt(value, 10) || 0));
  const selectScoreText = (event) => event.currentTarget.select();

  const handleSimulationChange = (matchId, field, value) => {
    setSimulations(prev => ({ ...prev, [matchId]: { ...(prev[matchId] || defaultScore), [field]: normalizeScore(value) } }));
  };

  const handleKoSimulationChange = (matchId, field, value) => {
    setKoSimulations(prev => {
      const current = prev[matchId] || defaultScore;
      if (field === 'winner') return { ...prev, [matchId]: { ...current, winner: value } };
      return { ...prev, [matchId]: { ...current, [field]: normalizeScore(value) } };
    });
  };

  const getEffectiveGroupSimulation = (match) => {
    if (includeRealResults && hasRealResult(match)) return getRealScore(match);
    return simulations[match.id] || defaultScore;
  };

  const effectiveKoSimulations = useMemo(() => {
    if (!includeRealResults) return koSimulations;

    const next = { ...koSimulations };
    matches
      .filter(match => Number(match.id) >= 73 && hasRealResult(match))
      .forEach(match => { next[match.id] = getRealScore(match); });

    return next;
  }, [includeRealResults, koSimulations, matches]);

  const realResultMatchIds = useMemo(() => new Set(
    includeRealResults
      ? matches.filter(hasRealResult).map(match => Number(match.id))
      : []
  ), [includeRealResults, matches]);

  const realGroupResultCount = useMemo(() => matches.filter(match => Number(match.id) <= 72 && hasRealResult(match)).length, [matches]);
  const realKoResultCount = useMemo(() => matches.filter(match => Number(match.id) >= 73 && hasRealResult(match)).length, [matches]);

  const calculatePoints = (prediction, result) => {
    if (!prediction) return null;
    const pred1 = Number(prediction.team1_goals);
    const pred2 = Number(prediction.team2_goals);
    const res1 = Number(result.team1_goals);
    const res2 = Number(result.team2_goals);
    if (pred1 === res1 && pred2 === res2) return 3;
    if ((pred1 - pred2) === (res1 - res2)) return 2;
    const predTendency = pred1 > pred2 ? 'team1' : pred1 < pred2 ? 'team2' : 'draw';
    const resTendency = res1 > res2 ? 'team1' : res1 < res2 ? 'team2' : 'draw';
    return predTendency === resTendency ? 1 : 0;
  };

  const getGroupMatches = (groupLetter) => matches.filter(match => (
    Number(match.id) <= 72 && match.groupe1 === groupLetter && match.groupe2 === groupLetter && match.team1 && match.team2
  ));

  const getTeamsInGroup = (groupLetter) => {
    const teams = new Set();
    getGroupMatches(groupLetter).forEach(match => {
      teams.add(match.team1);
      teams.add(match.team2);
    });
    return Array.from(teams);
  };

  const calculateGroupStats = (groupLetter) => {
    const groupMatches = getGroupMatches(groupLetter);
    const teams = getTeamsInGroup(groupLetter);
    const stats = {};

    teams.forEach(team => {
      stats[team] = { played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
    });

    groupMatches.forEach(match => {
      const sim = getEffectiveGroupSimulation(match);
      const g1 = Number(sim.team1_goals) || 0;
      const g2 = Number(sim.team2_goals) || 0;
      stats[match.team1].played += 1;
      stats[match.team1].goalsFor += g1;
      stats[match.team1].goalsAgainst += g2;
      stats[match.team2].played += 1;
      stats[match.team2].goalsFor += g2;
      stats[match.team2].goalsAgainst += g1;
      if (g1 > g2) {
        stats[match.team1].won += 1;
        stats[match.team1].points += 3;
        stats[match.team2].lost += 1;
      } else if (g2 > g1) {
        stats[match.team2].won += 1;
        stats[match.team2].points += 3;
        stats[match.team1].lost += 1;
      } else {
        stats[match.team1].draw += 1;
        stats[match.team1].points += 1;
        stats[match.team2].draw += 1;
        stats[match.team2].points += 1;
      }
    });

    return stats;
  };

  const getGroupClassification = (groupLetter) => {
    const stats = calculateGroupStats(groupLetter);
    return getTeamsInGroup(groupLetter)
      .map(team => ({ team, group: groupLetter, ...stats[team], diff: stats[team].goalsFor - stats[team].goalsAgainst }))
      .sort((a, b) => b.points - a.points || b.diff - a.diff || b.goalsFor - a.goalsFor || b.won - a.won || a.team.localeCompare(b.team, 'fr'));
  };

  const groupsData = useMemo(() => {
    const data = {};
    GROUPS.forEach(group => { data[group] = getGroupClassification(group); });
    return data;
  }, [simulations, includeRealResults, matches]);

  const allThirdPlaces = useMemo(() => {
    const seenTeams = new Set();
    const thirds = GROUPS
      .map(group => groupsData[group]?.[2])
      .filter(Boolean)
      .filter(team => {
        if (seenTeams.has(team.team)) return false;
        seenTeams.add(team.team);
        return true;
      })
      .map(team => ({ team: team.team, group: team.group, points: team.points, gf: team.goalsFor, ga: team.goalsAgainst, diff: team.diff, won: team.won }));

    return thirds.sort((a, b) => b.points - a.points || b.diff - a.diff || b.gf - a.gf || b.won - a.won || a.team.localeCompare(b.team, 'fr'));
  }, [groupsData]);

  const totalSimulatedPoints = useMemo(() => {
    return matches.filter(match => Number(match.id) <= 72).reduce((total, match) => {
      const points = calculatePoints(predictions[match.id], getEffectiveGroupSimulation(match));
      return total + (points || 0);
    }, 0);
  }, [matches, predictions, simulations, includeRealResults]);

  const clearSimulation = () => {
    localStorage.removeItem('takotak_simulations');
    localStorage.removeItem('takotak_ko_simulations');
    const resetSims = {};
    matches.filter(match => Number(match.id) <= 72).forEach(match => { resetSims[match.id] = { ...defaultScore }; });
    setSimulations(resetSims);
    setKoSimulations({});
    setSaveMessage('Simulation réinitialisée');
    setTimeout(() => setSaveMessage(''), 2200);
  };

  const renderFlag = (team, className = 'sim-flag') => {
    const flag = team ? getFlag(team) : null;
    return flag ? <img className={className} src={flag} alt={team} /> : <span className={className}>?</span>;
  };

  const formatMatchDateTime = (timestamp) => {
    if (!timestamp) return '--/-- --:--';
    return `${timestamp.substring(8, 10)}/${timestamp.substring(5, 7)} ${timestamp.substring(11, 16)}`;
  };

  if (loading) {
    return (
      <div className="simulation-page loading-page">
        <div className="simulation-loading-card"><div className="simulation-ball">⚽</div><p>Chargement de la simulation...</p></div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="simulation-page">
      <div className="simulation-container">
        <section className="simulation-hero">
          <div>
            <span className="simulation-eyebrow">Mode bac à sable</span>
            <h1>🎮 Simulation Coupe du Monde</h1>
            <p>Teste tous les scores, observe les classements évoluer et construis ton tableau final. Les résultats réels déjà encodés peuvent servir de base.</p>
          </div>
          <div className="simulation-summary">
            <div><strong>{totalSimulatedPoints}</strong><span>points simulés</span></div>
            <div><strong>{allThirdPlaces.slice(0, 8).length}</strong><span>troisièmes qualifiés</span></div>
            <button type="button" onClick={clearSimulation}>🔄 Réinitialiser</button>
          </div>
        </section>

        <section className="simulation-options-card">
          <label className="real-results-toggle">
            <input type="checkbox" checked={includeRealResults} onChange={(event) => setIncludeRealResults(event.target.checked)} />
            <span>
              <strong>Utiliser les résultats réels déjà encodés</strong>
              <em>{realGroupResultCount} match{realGroupResultCount > 1 ? 's' : ''} de groupes · {realKoResultCount} match{realKoResultCount > 1 ? 's' : ''} à élimination directe</em>
            </span>
          </label>
          <p>{includeRealResults ? 'Les matchs réels sont verrouillés dans la simulation. Tu simules uniquement la suite.' : 'Mode libre : même les matchs déjà encodés peuvent être modifiés dans la simulation.'}</p>
        </section>

        {saveMessage && <div className="simulation-toast">✅ {saveMessage}</div>}

        <section className="simulation-section">
          <div className="simulation-section-title"><span>🏆 Phase de groupes</span><h2>Groupes A à L</h2></div>
          <div className="groups-grid">
            {GROUPS.map(groupLetter => {
              const groupMatches = getGroupMatches(groupLetter);
              const classification = groupsData[groupLetter] || [];
              if (groupMatches.length === 0) return null;
              return (
                <article key={groupLetter} className="group-card">
                  <header className="group-card-header"><div><span>Groupe</span><h3>{groupLetter}</h3></div><strong>{classification.length} équipes</strong></header>
                  <div className="group-card-body">
                    <div className="group-matches">
                      {groupMatches.map(match => {
                        const sim = getEffectiveGroupSimulation(match);
                        const prediction = predictions[match.id];
                        const points = calculatePoints(prediction, sim);
                        const isRealResult = includeRealResults && hasRealResult(match);
                        return (
                          <div key={match.id} className={`simulation-match-line ${isRealResult ? 'real-result-line' : ''}`}>
                            <span className="match-schedule">{formatMatchDateTime(match.start_time)}</span>
                            <span className="match-team-name match-team-left" title={match.team1}>{match.team1}</span>
                            {renderFlag(match.team1)}
                            <input type="text" inputMode="numeric" maxLength="2" value={sim.team1_goals} disabled={isRealResult} onFocus={selectScoreText} onChange={(e) => handleSimulationChange(match.id, 'team1_goals', e.target.value)} aria-label={`Score ${match.team1}`} />
                            <span className="score-separator">-</span>
                            <input type="text" inputMode="numeric" maxLength="2" value={sim.team2_goals} disabled={isRealResult} onFocus={selectScoreText} onChange={(e) => handleSimulationChange(match.id, 'team2_goals', e.target.value)} aria-label={`Score ${match.team2}`} />
                            {renderFlag(match.team2)}
                            <span className="match-team-name match-team-right" title={match.team2}>{match.team2}</span>
                            <span className={`prediction-pill ${isRealResult ? 'real-pill' : ''}`}>{isRealResult ? 'Résultat réel' : prediction ? `Prono ${prediction.team1_goals}-${prediction.team2_goals}` : 'Pas de prono'}</span>
                            <strong className={`sim-points points-${points ?? 0}`}>{points === null ? '—' : `${points} pt${points > 1 ? 's' : ''}`}</strong>
                          </div>
                        );
                      })}
                    </div>
                    <div className="group-standings">
                      <div className="standing-header"><span>Équipe</span><span>J</span><span>G</span><span>N</span><span>P</span><span>BP</span><span>BC</span><span>Diff</span><span>Pts</span></div>
                      {classification.map((data, index) => (
                        <button key={`${groupLetter}-${data.team}`} type="button" className={`standing-row rank-${index + 1}`} onClick={() => setSelectedTeam(data)}>
                          <span className="team-standing-name"><em>{index + 1}</em>{renderFlag(data.team)}<strong>{data.team}</strong></span>
                          <span>{data.played}</span><span>{data.won}</span><span>{data.draw}</span><span>{data.lost}</span><span>{data.goalsFor}</span><span>{data.goalsAgainst}</span><span className={data.diff > 0 ? 'positive' : data.diff < 0 ? 'negative' : ''}>{data.diff > 0 ? '+' : ''}{data.diff}</span><strong>{data.points}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="simulation-section thirds-section">
          <div className="simulation-section-title"><span>🥉 Meilleurs troisièmes</span><h2>8 qualifiés sur 12</h2></div>
          <div className="thirds-grid">
            {allThirdPlaces.map((team, index) => (
              <button key={`${team.group}-${team.team}`} type="button" className={`third-card ${index < 8 ? 'qualified' : 'out'}`} onClick={() => setSelectedTeam(team)}>
                <strong>#{index + 1}</strong>{renderFlag(team.team)}<span>{team.team}</span><em>Groupe {team.group}</em><small>{team.points} pts · diff {team.diff > 0 ? '+' : ''}{team.diff} · BP {team.gf}</small><b>{index < 8 ? 'Qualifié' : 'Éliminé'}</b>
              </button>
            ))}
          </div>
        </section>

        <TournamentBracket groupsData={groupsData} allThirdPlaces={allThirdPlaces} koSimulations={effectiveKoSimulations} onScoreChange={handleKoSimulationChange} matchSchedule={matches} lockedRealMatchIds={realResultMatchIds} />
      </div>

      {selectedTeam && <TeamInfoModal teamId={selectedTeam.team} teamName={selectedTeam.team} onClose={() => setSelectedTeam(null)} />}
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .simulation-page { min-height: 100vh; background: radial-gradient(circle at top left, rgba(217,119,6,.15), transparent 32%), radial-gradient(circle at top right, rgba(15,118,110,.18), transparent 32%), linear-gradient(135deg, #071b16 0%, #0f172a 45%, #111827 100%); padding: 24px 18px 42px; color: ${DARK}; }
  .simulation-container { width: min(1480px, 100%); margin: 0 auto; }
  .simulation-hero { display: flex; justify-content: space-between; gap: 22px; align-items: stretch; margin-bottom: 18px; color: white; }
  .simulation-eyebrow { display: inline-flex; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; color: #fde68a; margin-bottom: 10px; }
  .simulation-hero h1 { margin: 0 0 7px; font-size: clamp(28px, 3.4vw, 44px); line-height: 1; letter-spacing: -.04em; }
  .simulation-hero p { margin: 0; max-width: 760px; color: rgba(255,255,255,.76); font-size: 14px; line-height: 1.5; }
  .simulation-summary { min-width: 340px; display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
  .simulation-summary div, .simulation-summary button { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); border-radius: 15px; padding: 13px; color: white; box-shadow: 0 16px 38px rgba(0,0,0,.16); }
  .simulation-summary strong { display: block; font-size: 26px; color: #fde68a; line-height: 1; }
  .simulation-summary span { display: block; margin-top: 6px; color: rgba(255,255,255,.7); font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; }
  .simulation-summary button { grid-column: span 2; cursor: pointer; font-weight: 950; background: linear-gradient(135deg, rgba(239,68,68,.9), rgba(185,28,28,.9)); }
  .simulation-options-card { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 16px; padding: 13px 15px; border-radius: 18px; background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); box-shadow: 0 14px 36px rgba(0,0,0,.14); }
  .real-results-toggle { display: flex; align-items: center; gap: 11px; cursor: pointer; }
  .real-results-toggle input { width: 20px; height: 20px; accent-color: ${PRIMARY}; }
  .real-results-toggle strong { display: block; color: ${DARK}; font-size: 14px; }
  .real-results-toggle em { display: block; margin-top: 3px; color: #64748b; font-style: normal; font-size: 11px; font-weight: 850; }
  .simulation-options-card p { margin: 0; color: #475569; font-size: 12px; font-weight: 850; line-height: 1.35; text-align: right; }
  .simulation-toast { margin-bottom: 16px; padding: 10px 14px; border-radius: 14px; color: #064e3b; background: #dcfce7; border: 1px solid rgba(34,197,94,.35); font-size: 12px; font-weight: 950; }
  .simulation-section { margin-bottom: 26px; }
  .simulation-section-title { color: white; margin-bottom: 12px; }
  .simulation-section-title span { color: #fde68a; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
  .simulation-section-title h2 { margin: 4px 0 0; font-size: 25px; letter-spacing: -.04em; }
  .groups-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
  .group-card { overflow: hidden; border-radius: 20px; background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); box-shadow: 0 18px 55px rgba(0,0,0,.2); }
  .group-card-header { display: flex; justify-content: space-between; align-items: center; padding: 13px 16px; background: ${GRADIENT}; color: white; }
  .group-card-header span { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; opacity: .8; }
  .group-card-header h3 { margin: 0; font-size: 23px; }
  .group-card-header strong { padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,.16); font-size: 11px; }
  .group-card-body { display: grid; grid-template-columns: 1fr; }
  .group-matches { padding: 7px 9px; border-bottom: 1px solid #e2e8f0; }
  .simulation-match-line { display: grid; grid-template-columns: 64px minmax(98px, 1fr) 24px 36px 10px 36px 24px minmax(98px, 1fr) 72px 48px; align-items: center; gap: 5px; padding: 5px 2px; border-bottom: 1px solid #eef2f7; }
  .simulation-match-line.real-result-line { background: #ecfdf5; border-radius: 10px; padding-inline: 5px; }
  .simulation-match-line:last-child { border-bottom: 0; }
  .match-schedule { color: #64748b; font-size: 10px; font-weight: 900; white-space: nowrap; }
  .match-team-name { min-width: 0; color: #0f172a; font-size: 12px; font-weight: 950; line-height: 1.12; }
  .match-team-left { text-align: right; }
  .match-team-right { text-align: left; }
  .score-separator { color: #94a3b8; font-size: 13px; font-weight: 950; text-align: center; }
  .sim-flag { width: 23px; height: 23px; border-radius: 999px; object-fit: cover; flex: 0 0 auto; border: 2px solid white; box-shadow: 0 5px 12px rgba(15,23,42,.14); background: #e2e8f0; display: grid; place-items: center; font-size: 10px; font-weight: 900; color: #64748b; }
  .simulation-match-line input { width: 36px; height: 30px; border: 1.5px solid #cbd5e1; border-radius: 9px; text-align: center; color: #0f172a; background: white; font-size: 13px; font-weight: 950; outline: none; box-shadow: 0 6px 14px rgba(15,23,42,.06); }
  .simulation-match-line input:focus { border-color: ${SECONDARY}; }
  .simulation-match-line input:disabled { color: #047857; background: white; border-color: #bbf7d0; }
  .prediction-pill { justify-self: center; padding: 4px 7px; border-radius: 999px; background: #e2e8f0; color: #475569; font-size: 9px; font-weight: 900; white-space: nowrap; }
  .prediction-pill.real-pill { background: #bbf7d0; color: #047857; }
  .sim-points { min-width: 42px; padding: 4px 6px; border-radius: 9px; font-size: 9px; font-weight: 950; text-align: center; }
  .points-3 { background: #dcfce7; color: #047857; } .points-2 { background: #dbeafe; color: #1d4ed8; } .points-1 { background: #fef3c7; color: #92400e; } .points-0 { background: #fee2e2; color: #b91c1c; }
  .group-standings { padding: 10px; background: #f8fafc; }
  .standing-header, .standing-row { display: grid; grid-template-columns: minmax(240px,1fr) 34px 34px 34px 34px 42px 42px 52px 42px; gap: 6px; align-items: center; }
  .standing-header { padding: 5px 8px 8px; color: #64748b; font-size: 9px; font-weight: 950; text-transform: uppercase; }
  .standing-header span:not(:first-child) { text-align: center; }
  .standing-row { width: 100%; border: 0; border-top: 1px solid #e2e8f0; background: white; padding: 7px 8px; cursor: pointer; text-align: left; font-size: 11px; color: #0f172a; }
  .standing-row.rank-1, .standing-row.rank-2 { background: #ecfdf5; } .standing-row.rank-3 { background: #fff7ed; }
  .team-standing-name { display: flex; align-items: center; gap: 6px; min-width: 0; font-weight: 900; }
  .team-standing-name strong { white-space: normal; overflow: visible; text-overflow: unset; }
  .team-standing-name em { width: 20px; height: 20px; border-radius: 999px; background: #e2e8f0; display: grid; place-items: center; font-style: normal; font-size: 10px; flex: 0 0 auto; }
  .team-standing-name img { width: 20px; height: 20px; }
  .standing-row span:not(.team-standing-name), .standing-row strong:not(.team-standing-name strong) { text-align: center; font-weight: 900; }
  .positive { color: #047857; } .negative { color: #b91c1c; }
  .thirds-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(185px, 1fr)); gap: 10px; }
  .third-card { display: grid; grid-template-columns: 34px 28px minmax(0,1fr); align-items: center; gap: 7px; padding: 10px; border-radius: 16px; border: 1px solid #e2e8f0; background: rgba(255,255,255,.96); cursor: pointer; text-align: left; box-shadow: 0 10px 24px rgba(0,0,0,.12); }
  .third-card.qualified { border-color: #bbf7d0; background: #ecfdf5; } .third-card.out { opacity: .72; }
  .third-card strong { width: 30px; height: 28px; border-radius: 10px; display: grid; place-items: center; color: #92400e; background: #fef3c7; font-size: 12px; }
  .third-card span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 950; }
  .third-card em, .third-card small, .third-card b { grid-column: 3; font-style: normal; font-size: 10px; color: #64748b; font-weight: 800; }
  .third-card b { color: #047857; } .third-card.out b { color: #b91c1c; }
  .loading-page { display: grid; place-items: center; } .simulation-loading-card { text-align: center; color: white; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); border-radius: 18px; padding: 30px 42px; box-shadow: 0 22px 65px rgba(0,0,0,.22); } .simulation-ball { font-size: 42px; margin-bottom: 12px; animation: bounce 1s infinite; }
  @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @media (max-width: 1180px) { .groups-grid { grid-template-columns: 1fr; } }
  @media (max-width: 780px) { .simulation-hero, .simulation-options-card { flex-direction: column; align-items: stretch; } .simulation-options-card p { text-align: left; } .simulation-summary { min-width: 0; } .simulation-match-line { grid-template-columns: 64px 1fr 23px 36px 10px 36px 23px 1fr; } .prediction-pill, .sim-points { grid-column: auto; } .standing-header, .standing-row { grid-template-columns: minmax(190px,1fr) repeat(8, 34px); } }
`;

export default Simulation;
