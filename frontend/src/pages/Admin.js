import React, { useEffect, useMemo, useState } from 'react';
import { matchesService, resultsService } from '../services/api';
import PageLoader from '../components/PageLoader';

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

const emptyScores = { team1: '', team2: '', penalty1: '', penalty2: '' };

function Admin() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulationDate, setSimulationDate] = useState('2026-06-20');
  const [simulationTime, setSimulationTime] = useState('20:59');
  const [includeMockResults, setIncludeMockResults] = useState(true);
  const [resultInputs, setResultInputs] = useState({});
  const [savingMatchId, setSavingMatchId] = useState(null);
  const [thirdPlaceSnapshot, setThirdPlaceSnapshot] = useState(null);
  const [thirdPlaceOrder, setThirdPlaceOrder] = useState([]);
  const [savingThirdPlaces, setSavingThirdPlaces] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const buildResultInputs = (items) => {
    const nextInputs = {};
    items.forEach(match => {
      nextInputs[match.id] = {
        team1: match.team1_goals !== null && match.team1_goals !== undefined ? String(match.team1_goals) : '',
        team2: match.team2_goals !== null && match.team2_goals !== undefined ? String(match.team2_goals) : '',
        penalty1: match.team1_penalty_goals !== null && match.team1_penalty_goals !== undefined ? String(match.team1_penalty_goals) : '',
        penalty2: match.team2_penalty_goals !== null && match.team2_penalty_goals !== undefined ? String(match.team2_penalty_goals) : ''
      };
    });
    return nextInputs;
  };

  const applyThirdPlaceSnapshot = (snapshot) => {
    setThirdPlaceSnapshot(snapshot);
    setThirdPlaceOrder((snapshot?.thirdTeams || []).map(team => team.group_code));
  };

  const loadThirdPlaces = async () => {
    try {
      const res = await resultsService.getThirdPlaces();
      applyThirdPlaceSnapshot(res.data);
    } catch (error) {
      console.warn('Third-place table not available yet:', error.response?.data || error);
      setThirdPlaceSnapshot(null);
      setThirdPlaceOrder([]);
    }
  };

  const loadAdminData = async () => {
    try {
      const [matchesRes, thirdPlacesRes] = await Promise.allSettled([
        matchesService.getAll(),
        resultsService.getThirdPlaces()
      ]);

      if (matchesRes.status === 'fulfilled') {
        setMatches(matchesRes.value.data);
        setResultInputs(buildResultInputs(matchesRes.value.data));
      } else {
        console.error('Error loading matches:', matchesRes.reason);
      }

      if (thirdPlacesRes.status === 'fulfilled') {
        applyThirdPlaceSnapshot(thirdPlacesRes.value.data);
      } else {
        setThirdPlaceSnapshot(null);
        setThirdPlaceOrder([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateResultInput = (matchId, field, value) => {
    const cleanedValue = String(value).replace(/[^0-9]/g, '').slice(0, 2);
    setResultInputs(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || emptyScores),
        [field]: cleanedValue
      }
    }));
  };

  const isValidResultInput = (score) => {
    const n = Number(score);
    return score !== '' && Number.isInteger(n) && n >= 0 && n <= 20;
  };

  const isValidPenaltyInput = (score) => {
    const n = Number(score);
    return score !== '' && Number.isInteger(n) && n >= 0 && n <= 30;
  };

  const isKnockoutMatch = (match) => Number(match.id) >= 73;

  const needsPenaltyShootout = (match, scores) => (
    isKnockoutMatch(match)
    && isValidResultInput(scores.team1)
    && isValidResultInput(scores.team2)
    && Number(scores.team1) === Number(scores.team2)
  );

  const hasValidPenaltyShootout = (scores) => (
    isValidPenaltyInput(scores.penalty1)
    && isValidPenaltyInput(scores.penalty2)
    && Number(scores.penalty1) !== Number(scores.penalty2)
  );

  const getResultChanged = (match, scores) => (
    String(match.team1_goals ?? '') !== scores.team1
    || String(match.team2_goals ?? '') !== scores.team2
    || String(match.team1_penalty_goals ?? '') !== scores.penalty1
    || String(match.team2_penalty_goals ?? '') !== scores.penalty2
  );

  const refreshAfterChange = async () => {
    const res = await matchesService.getAll();
    setMatches(res.data);
    setResultInputs(buildResultInputs(res.data));
    await loadThirdPlaces();
  };

  const handleSaveResult = async (match) => {
    const scores = resultInputs[match.id] || emptyScores;

    if (!isValidResultInput(scores.team1) || !isValidResultInput(scores.team2)) {
      alert('Encode un score valide entre 0 et 20 pour les deux équipes.');
      return;
    }

    const needsPenalties = needsPenaltyShootout(match, scores);
    if (needsPenalties && !hasValidPenaltyShootout(scores)) {
      alert('Encode un score de tirs au but valide. Les tirs au but ne peuvent pas être à égalité.');
      return;
    }

    try {
      setSavingMatchId(match.id);
      await resultsService.create({
        match_id: match.id,
        team1_goals: Number(scores.team1),
        team2_goals: Number(scores.team2),
        team1_penalty_goals: needsPenalties ? Number(scores.penalty1) : null,
        team2_penalty_goals: needsPenalties ? Number(scores.penalty2) : null
      });
      await refreshAfterChange();
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingMatchId(null);
    }
  };

  const handleClearResult = async (matchId) => {
    if (!window.confirm('Effacer ce résultat et recalculer le classement sans ce match ?')) {
      return;
    }

    try {
      setSavingMatchId(matchId);
      await resultsService.delete(matchId);
      await refreshAfterChange();
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setSavingMatchId(null);
    }
  };

  const resetResultInput = (match) => {
    setResultInputs(prev => ({
      ...prev,
      [match.id]: {
        team1: match.team1_goals !== null && match.team1_goals !== undefined ? String(match.team1_goals) : '',
        team2: match.team2_goals !== null && match.team2_goals !== undefined ? String(match.team2_goals) : '',
        penalty1: match.team1_penalty_goals !== null && match.team1_penalty_goals !== undefined ? String(match.team1_penalty_goals) : '',
        penalty2: match.team2_penalty_goals !== null && match.team2_penalty_goals !== undefined ? String(match.team2_penalty_goals) : ''
      }
    }));
  };

  const moveThirdPlace = (groupCode, direction) => {
    setThirdPlaceOrder(prev => {
      const next = [...prev];
      const index = next.indexOf(groupCode);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const saveThirdPlaceOrder = async () => {
    try {
      setSavingThirdPlaces(true);
      const res = await resultsService.saveThirdPlaceOrder(thirdPlaceOrder);
      applyThirdPlaceSnapshot(res.data);
      await refreshAfterChange();
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde des troisièmes');
    } finally {
      setSavingThirdPlaces(false);
    }
  };

  const resetThirdPlaceOrder = async () => {
    try {
      setSavingThirdPlaces(true);
      const res = await resultsService.saveThirdPlaceOrder([]);
      applyThirdPlaceSnapshot(res.data);
      await refreshAfterChange();
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la réinitialisation des troisièmes');
    } finally {
      setSavingThirdPlaces(false);
    }
  };

  const simulationUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('mockDate', simulationDate || '2026-06-20');
    params.set('mockTime', simulationTime || '12:00');
    if (includeMockResults) params.set('mockResults', '1');
    return `/predictions?${params.toString()}`;
  }, [simulationDate, simulationTime, includeMockResults]);

  const openSimulation = () => {
    window.location.href = simulationUrl;
  };

  const resetSimulation = () => {
    window.location.href = '/predictions?mockDate=clear';
  };

  const copySimulationUrl = async () => {
    const absoluteUrl = `${window.location.origin}${simulationUrl}`;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      alert('Lien copié');
    } catch {
      prompt('Copie le lien:', absoluteUrl);
    }
  };

  const getPhaseLabel = (match) => {
    const knockout = KNOCKOUT_MATCHES[match.id];
    if (knockout) return knockout.round;
    if (match.groupe1) return `Groupe ${match.groupe1}`;
    return 'Match';
  };

  const getTeamLabel = (match, position) => {
    const teamName = position === 'team1' ? match.team1 : match.team2;
    if (teamName) return teamName;

    const knockout = KNOCKOUT_MATCHES[match.id];
    if (knockout) return knockout[position];

    return 'À déterminer';
  };

  const getTimeLabel = (match) => match.start_time?.substring(0, 16).replace('T', ' ') || '--';
  const getStatusLabel = (match, hasResult) => hasResult ? 'Encodé' : 'À jouer';
  const isThirdPlaceDirty = useMemo(() => {
    const effective = (thirdPlaceSnapshot?.thirdTeams || []).map(team => team.group_code);
    return effective.join('|') !== thirdPlaceOrder.join('|');
  }, [thirdPlaceSnapshot, thirdPlaceOrder]);

  if (loading) return <PageLoader title="Chargement de l’admin..." icon="⚙️" subtitle="Préparation des résultats et des meilleurs troisièmes" />;

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Administration</span>
          <h1>⚙️ Panel Admin</h1>
          <p>Ajouter, modifier ou effacer les résultats officiels. Les points sont recalculés à chaque sauvegarde.</p>
        </div>
      </section>

      <section className="admin-card simulation-card">
        <div className="admin-card-title">
          <div>
            <span>🧪 Tests front</span>
            <h2>Simulation de date</h2>
          </div>
          <button type="button" className="button secondary" onClick={resetSimulation}>Réinitialiser</button>
        </div>

        <div className="simulation-grid">
          <label>
            Date simulée
            <input type="date" value={simulationDate} onChange={(event) => setSimulationDate(event.target.value)} />
          </label>

          <label>
            Heure simulée
            <input type="time" value={simulationTime} onChange={(event) => setSimulationTime(event.target.value)} />
          </label>

          <label className="checkbox-row">
            <input type="checkbox" checked={includeMockResults} onChange={(event) => setIncludeMockResults(event.target.checked)} />
            <span>Afficher des résultats simulés</span>
          </label>
        </div>

        <div className="simulation-preview">
          <code>{simulationUrl}</code>
        </div>

        <div className="admin-actions">
          <button type="button" className="button primary" onClick={openSimulation}>Ouvrir la simulation</button>
          <button type="button" className="button secondary" onClick={copySimulationUrl}>Copier le lien</button>
        </div>

        <p className="admin-help">
          Ces liens ne modifient pas la base de données. La vraie clôture des pronostics reste contrôlée côté serveur.
        </p>
      </section>

      <section className="admin-card thirds-card">
        <div className="admin-card-title compact-title">
          <div>
            <span>🥉 Meilleurs troisièmes</span>
            <h2>Ordre qualificatif</h2>
          </div>
          <div className="admin-actions">
            <button type="button" className="button secondary small" disabled={savingThirdPlaces} onClick={resetThirdPlaceOrder}>Auto</button>
            <button type="button" className="button primary small" disabled={savingThirdPlaces || !isThirdPlaceDirty} onClick={saveThirdPlaceOrder}>Valider l'ordre</button>
          </div>
        </div>

        {thirdPlaceSnapshot?.thirdTeams?.length ? (
          <div className="thirds-list">
            {thirdPlaceOrder.map((groupCode, index) => {
              const team = thirdPlaceSnapshot.thirdTeams.find(item => item.group_code === groupCode)
                || thirdPlaceSnapshot.autoThirdTeams?.find(item => item.group_code === groupCode);
              if (!team) return null;

              return (
                <div key={groupCode} className="third-row">
                  <div className="third-rank">#{index + 1}</div>
                  <div className="third-main">
                    <strong>{team.team_name}</strong>
                    <span>Groupe {team.group_code}</span>
                  </div>
                  <div className="third-stats">
                    <span>{team.points} pts</span>
                    <span>Diff {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}</span>
                    <span>BP {team.goals_for}</span>
                  </div>
                  <div className="third-actions">
                    <button type="button" className="button secondary tiny" disabled={index === 0 || savingThirdPlaces} onClick={() => moveThirdPlace(groupCode, -1)}>↑</button>
                    <button type="button" className="button secondary tiny" disabled={index === thirdPlaceOrder.length - 1 || savingThirdPlaces} onClick={() => moveThirdPlace(groupCode, 1)}>↓</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="admin-help">Encode d'abord tous les matchs d'un ou plusieurs groupes pour voir apparaître les troisièmes.</p>
        )}
      </section>

      <section className="admin-card results-card">
        <div className="admin-card-title compact-title">
          <div>
            <span>🏁 Résultats officiels</span>
            <h2>Encodage rapide</h2>
          </div>
        </div>

        <div className="results-table">
          <div className="results-header">
            <span>Phase</span>
            <span>N°</span>
            <span>Heure</span>
            <span>Équipes</span>
            <span>Statut</span>
            <span>Score</span>
            <span>TAB</span>
            <span>Action</span>
          </div>

          {matches.map(match => {
            const scores = resultInputs[match.id] || emptyScores;
            const hasResult = match.team1_goals !== null && match.team1_goals !== undefined;
            const isSaving = savingMatchId === match.id;
            const scoreChanged = getResultChanged(match, scores);
            const hasKnownTeams = Boolean(match.team1 && match.team2);
            const showPenalties = needsPenaltyShootout(match, scores) || (hasResult && match.team1_penalty_goals !== null && match.team1_penalty_goals !== undefined);
            const saveDisabled = !hasKnownTeams
              || isSaving
              || !isValidResultInput(scores.team1)
              || !isValidResultInput(scores.team2)
              || (showPenalties && !hasValidPenaltyShootout(scores))
              || (hasResult && !scoreChanged);
            const team1Label = getTeamLabel(match, 'team1');
            const team2Label = getTeamLabel(match, 'team2');

            return (
              <div key={match.id} className={`result-row ${hasResult ? 'finished' : ''} ${showPenalties ? 'has-penalties' : ''}`}>
                <div className="group-cell">{getPhaseLabel(match)}</div>
                <div className="match-number-cell">M{match.id}</div>
                <div className="time-cell">{getTimeLabel(match)}</div>
                <div className="teams-cell" title={`${team1Label} vs ${team2Label}`}>
                  <strong className={!match.team1 ? 'team-placeholder' : ''}>{team1Label}</strong>
                  <span>vs</span>
                  <strong className={!match.team2 ? 'team-placeholder' : ''}>{team2Label}</strong>
                </div>
                <div className={`status-cell ${hasResult ? 'done' : ''}`}>{getStatusLabel(match, hasResult)}</div>

                <div className="result-editor">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="2"
                    value={scores.team1}
                    disabled={!hasKnownTeams || isSaving}
                    aria-label={`Score ${team1Label}`}
                    onChange={(event) => updateResultInput(match.id, 'team1', event.target.value)}
                  />
                  <span>-</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="2"
                    value={scores.team2}
                    disabled={!hasKnownTeams || isSaving}
                    aria-label={`Score ${team2Label}`}
                    onChange={(event) => updateResultInput(match.id, 'team2', event.target.value)}
                  />
                </div>

                <div className="penalty-editor">
                  {showPenalties ? (
                    <>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="2"
                        value={scores.penalty1}
                        disabled={!hasKnownTeams || isSaving}
                        aria-label={`Tirs au but ${team1Label}`}
                        onChange={(event) => updateResultInput(match.id, 'penalty1', event.target.value)}
                      />
                      <span>-</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="2"
                        value={scores.penalty2}
                        disabled={!hasKnownTeams || isSaving}
                        aria-label={`Tirs au but ${team2Label}`}
                        onChange={(event) => updateResultInput(match.id, 'penalty2', event.target.value)}
                      />
                    </>
                  ) : <span className="penalty-placeholder">—</span>}
                </div>

                <div className="row-actions">
                  <button type="button" className="button primary tiny" disabled={saveDisabled} onClick={() => handleSaveResult(match)}>
                    {isSaving ? '...' : hasResult ? 'MAJ' : 'OK'}
                  </button>
                  <button type="button" className="button secondary tiny" disabled={!hasResult || isSaving} onClick={() => handleClearResult(match.id)}>Effacer</button>
                  {scoreChanged && hasResult && <button type="button" className="button secondary tiny" disabled={isSaving} onClick={() => resetResultInput(match)}>Annuler</button>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <style>{`
        .admin-page { min-height: 100vh; padding: 24px 18px 42px; background: radial-gradient(circle at top left, rgba(217,119,6,.13), transparent 32%), radial-gradient(circle at top right, rgba(15,118,110,.16), transparent 32%), linear-gradient(135deg, #071b16 0%, #0f172a 44%, #111827 100%); color: #0f172a; }
        .admin-hero { width: min(1220px, 100%); margin: 0 auto 16px; color: white; }
        .admin-eyebrow { display: inline-flex; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #fde68a; margin-bottom: 10px; }
        .admin-hero h1 { margin: 0 0 7px; font-size: clamp(28px, 3.4vw, 44px); line-height: 1; letter-spacing: -.04em; }
        .admin-hero p { margin: 0; color: rgba(255,255,255,.76); font-size: 14px; line-height: 1.5; }
        .admin-card { width: min(1220px, 100%); margin: 0 auto 16px; background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); border-radius: 18px; padding: 16px; box-shadow: 0 18px 55px rgba(0,0,0,.2); }
        .admin-card-title { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
        .admin-card-title span { display: block; color: #0f766e; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; }
        .admin-card-title h2 { margin: 2px 0 0; color: #0f172a; font-size: 20px; }
        .compact-title { align-items: center; }
        .simulation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
        .simulation-grid label { display: grid; gap: 6px; color: #334155; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
        .simulation-grid input[type="date"], .simulation-grid input[type="time"] { border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 9px 10px; font-size: 14px; font-weight: 850; color: #0f172a; }
        .checkbox-row { display: flex !important; align-items: center; gap: 8px; text-transform: none !important; letter-spacing: 0 !important; }
        .checkbox-row input { width: 18px; height: 18px; accent-color: #0f766e; }
        .simulation-preview { margin-top: 12px; padding: 10px 12px; border-radius: 12px; background: #f1f5f9; border: 1px solid #e2e8f0; overflow-x: auto; color: #334155; }
        .admin-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .simulation-card .admin-actions { margin-top: 12px; }
        .button { border: 0; border-radius: 999px; padding: 9px 13px; font-size: 12px; font-weight: 950; cursor: pointer; }
        .button.primary { background: linear-gradient(135deg, #0f766e, #d97706); color: white; box-shadow: 0 8px 18px rgba(15,118,110,.18); }
        .button.secondary { background: #e2e8f0; color: #334155; }
        .button.small { padding: 7px 11px; }
        .button.tiny { padding: 5px 8px; font-size: 10px; }
        .button:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
        .admin-help { margin: 10px 0 0; color: #64748b; font-size: 12px; font-weight: 800; }
        .thirds-list { display: grid; gap: 8px; }
        .third-row { display: grid; grid-template-columns: 48px minmax(170px, 1fr) auto auto; gap: 10px; align-items: center; padding: 10px; border-radius: 14px; border: 1px solid #e2e8f0; background: #f8fafc; }
        .third-rank { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; color: white; background: linear-gradient(135deg, #0f766e, #d97706); font-weight: 950; }
        .third-main strong { display: block; color: #0f172a; }
        .third-main span, .third-stats span { color: #64748b; font-size: 11px; font-weight: 850; }
        .third-stats { display: flex; gap: 8px; flex-wrap: wrap; }
        .third-actions { display: flex; gap: 5px; }
        .results-table { display: grid; gap: 6px; overflow-x: auto; }
        .results-header, .result-row { min-width: 980px; display: grid; grid-template-columns: 130px 54px 110px minmax(240px,1fr) 80px 106px 106px 170px; gap: 8px; align-items: center; }
        .results-header { padding: 9px 10px; color: #475569; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; }
        .result-row { padding: 9px 10px; border-radius: 14px; border: 1px solid #e2e8f0; background: #f8fafc; }
        .result-row.finished { background: linear-gradient(90deg, rgba(236,253,245,.75), rgba(255,255,255,.95)); }
        .group-cell, .time-cell, .match-number-cell, .status-cell { color: #334155; font-size: 11px; font-weight: 900; }
        .match-number-cell { color: #c2410c; }
        .teams-cell { display: grid; grid-template-columns: minmax(0,1fr) 20px minmax(0,1fr); gap: 8px; align-items: center; color: #0f172a; font-size: 12px; }
        .teams-cell strong { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .team-placeholder { color: #64748b; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
        .status-cell { padding: 5px 8px; border-radius: 999px; background: #fef3c7; color: #92400e; text-align: center; }
        .status-cell.done { background: #dcfce7; color: #047857; }
        .result-editor, .penalty-editor { display: flex; justify-content: center; align-items: center; gap: 5px; }
        .result-editor input, .penalty-editor input { width: 34px; height: 30px; border: 1.5px solid #cbd5e1; border-radius: 9px; text-align: center; font-weight: 950; color: #0f172a; }
        .penalty-placeholder { color: #94a3b8; font-weight: 950; }
        .row-actions { display: flex; gap: 5px; justify-content: flex-end; flex-wrap: wrap; }
        @media (max-width: 720px) { .admin-card-title, .compact-title { flex-direction: column; align-items: stretch; } .third-row { grid-template-columns: 44px 1fr; } .third-stats, .third-actions { grid-column: 2; } }
      `}</style>
    </div>
  );
}

export default Admin;
