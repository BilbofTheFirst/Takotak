import React, { useEffect, useMemo, useState } from 'react';
import { matchesService, resultsService } from '../services/api';

function Admin() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulationDate, setSimulationDate] = useState('2026-06-20');
  const [simulationTime, setSimulationTime] = useState('20:59');
  const [includeMockResults, setIncludeMockResults] = useState(true);
  const [resultInputs, setResultInputs] = useState({});
  const [savingMatchId, setSavingMatchId] = useState(null);

  useEffect(() => {
    loadMatches();
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

  const loadMatches = async () => {
    try {
      const res = await matchesService.getAll();
      setMatches(res.data);
      setResultInputs(buildResultInputs(res.data));
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateResultInput = (matchId, field, value) => {
    const cleanedValue = String(value).replace(/[^0-9]/g, '').slice(0, 2);
    setResultInputs(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { team1: '', team2: '', penalty1: '', penalty2: '' }),
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

  const handleSaveResult = async (match) => {
    const scores = resultInputs[match.id] || { team1: '', team2: '', penalty1: '', penalty2: '' };

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
      await loadMatches();
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
      await loadMatches();
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

  const getGroupLabel = (match) => match.groupe1 ? `Groupe ${match.groupe1}` : 'Match';
  const getTimeLabel = (match) => match.start_time?.substring(0, 16).replace('T', ' ') || '--';
  const getStatusLabel = (match, hasResult) => hasResult ? 'Encodé' : 'À jouer';

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Chargement...</div>;

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

      <section className="admin-card results-card">
        <div className="admin-card-title compact-title">
          <div>
            <span>🏁 Résultats officiels</span>
            <h2>Encodage rapide</h2>
          </div>
        </div>

        <div className="results-table">
          <div className="results-header">
            <span>Groupe</span>
            <span>Heure</span>
            <span>Équipes</span>
            <span>Statut</span>
            <span>Score</span>
            <span>TAB</span>
            <span>Action</span>
          </div>

          {matches.map(match => {
            const scores = resultInputs[match.id] || { team1: '', team2: '', penalty1: '', penalty2: '' };
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

            return (
              <div key={match.id} className={`result-row ${hasResult ? 'finished' : ''} ${showPenalties ? 'has-penalties' : ''}`}>
                <div className="group-cell">{getGroupLabel(match)}</div>
                <div className="time-cell">{getTimeLabel(match)}</div>
                <div className="teams-cell" title={`${match.team1 || 'À déterminer'} vs ${match.team2 || 'À déterminer'}`}>
                  <strong>{match.team1 || 'À déterminer'}</strong>
                  <span>vs</span>
                  <strong>{match.team2 || 'À déterminer'}</strong>
                </div>
                <div className={`status-cell ${hasResult ? 'done' : ''}`}>{getStatusLabel(match, hasResult)}</div>

                <div className="result-editor">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="2"
                    value={scores.team1}
                    disabled={!hasKnownTeams || isSaving}
                    aria-label={`Score ${match.team1 || 'équipe 1'}`}
                    onChange={(event) => updateResultInput(match.id, 'team1', event.target.value)}
                  />
                  <span>-</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="2"
                    value={scores.team2}
                    disabled={!hasKnownTeams || isSaving}
                    aria-label={`Score ${match.team2 || 'équipe 2'}`}
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
                        aria-label={`Tirs au but ${match.team1 || 'équipe 1'}`}
                        onChange={(event) => updateResultInput(match.id, 'penalty1', event.target.value)}
                      />
                      <span>-</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="2"
                        value={scores.penalty2}
                        disabled={!hasKnownTeams || isSaving}
                        aria-label={`Tirs au but ${match.team2 || 'équipe 2'}`}
                        onChange={(event) => updateResultInput(match.id, 'penalty2', event.target.value)}
                      />
                    </>
                  ) : (
                    <span className="no-penalties">—</span>
                  )}
                </div>

                <div className="result-actions">
                  <button
                    type="button"
                    className="button primary small"
                    disabled={saveDisabled}
                    onClick={() => handleSaveResult(match)}
                  >
                    {isSaving ? '...' : hasResult ? 'Modifier' : 'Sauver'}
                  </button>

                  {hasResult && scoreChanged && (
                    <button type="button" className="button secondary small" disabled={isSaving} onClick={() => resetResultInput(match)}>
                      Annuler
                    </button>
                  )}

                  {hasResult && (
                    <button type="button" className="button danger small" disabled={isSaving} onClick={() => handleClearResult(match.id)}>
                      Effacer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style>{`
        .admin-page {
          min-height: 100vh;
          padding: 22px 14px 36px;
          color: #0f172a;
          background:
            radial-gradient(circle at top left, rgba(251, 191, 36, 0.16), transparent 34%),
            radial-gradient(circle at top right, rgba(15, 118, 110, 0.22), transparent 30%),
            linear-gradient(135deg, #071b16 0%, #0f172a 55%, #111827 100%);
        }

        .admin-hero,
        .admin-card {
          width: min(1400px, 100%);
          margin: 0 auto 14px;
        }

        .admin-hero {
          color: white;
        }

        .admin-eyebrow,
        .admin-card-title span {
          display: inline-flex;
          color: #fde68a;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .admin-hero h1 {
          margin: 7px 0 5px;
          font-size: 34px;
          letter-spacing: -0.05em;
        }

        .admin-hero p {
          margin: 0;
          color: rgba(255, 255, 255, 0.72);
        }

        .admin-card {
          padding: 15px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.58);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
        }

        .admin-card-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .compact-title {
          margin-bottom: 10px;
        }

        .admin-card-title span {
          color: #0f766e;
        }

        .admin-card-title h2 {
          margin: 2px 0 0;
          font-size: 22px;
          letter-spacing: -0.04em;
        }

        .simulation-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          align-items: end;
        }

        .simulation-grid label {
          display: grid;
          gap: 6px;
          color: #334155;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .simulation-grid input[type="date"],
        .simulation-grid input[type="time"] {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          background: white;
        }

        .checkbox-row {
          display: flex !important;
          align-items: center;
          gap: 9px !important;
          min-height: 42px;
          padding: 10px 12px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          text-transform: none !important;
          letter-spacing: 0 !important;
        }

        .checkbox-row input {
          width: 18px;
          height: 18px;
        }

        .simulation-preview {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          background: #0f172a;
          color: #e2e8f0;
          overflow: auto;
        }

        .simulation-preview code {
          font-size: 12px;
          font-weight: 800;
        }

        .admin-actions,
        .result-actions {
          display: flex;
          flex-wrap: nowrap;
          gap: 6px;
          align-items: center;
        }

        .admin-actions {
          margin-top: 13px;
          flex-wrap: wrap;
        }

        .button {
          border: 0;
          border-radius: 999px;
          padding: 9px 14px;
          cursor: pointer;
          font-weight: 900;
        }

        .button.small {
          padding: 7px 10px;
          font-size: 12px;
        }

        .button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .button.primary {
          color: white;
          background: linear-gradient(135deg, #0f766e, #d97706);
          box-shadow: 0 8px 18px rgba(15, 118, 110, 0.2);
        }

        .button.secondary {
          color: #334155;
          background: #e2e8f0;
        }

        .button.danger {
          color: white;
          background: linear-gradient(135deg, #ef4444, #b91c1c);
        }

        .admin-help {
          margin: 12px 0 0;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .results-card {
          overflow-x: auto;
        }

        .results-table {
          min-width: 1200px;
        }

        .results-header,
        .result-row {
          display: grid;
          grid-template-columns: 95px 135px minmax(300px, 1fr) 82px 112px 112px 230px;
          gap: 10px;
          align-items: center;
        }

        .results-header {
          padding: 0 10px 7px;
          color: #64748b;
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .result-row {
          min-height: 46px;
          padding: 7px 10px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .result-row + .result-row {
          margin-top: 6px;
        }

        .result-row.finished {
          background: #ecfdf5;
          border-color: #bbf7d0;
        }

        .result-row.has-penalties {
          background: #fff7ed;
          border-color: #fed7aa;
        }

        .group-cell,
        .time-cell,
        .status-cell {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 900;
        }

        .group-cell {
          color: #0f766e;
          text-transform: uppercase;
        }

        .time-cell {
          color: #475569;
          font-variant-numeric: tabular-nums;
        }

        .teams-cell {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
          overflow: hidden;
          color: #0f172a;
          font-size: 14px;
          font-weight: 900;
          white-space: nowrap;
        }

        .teams-cell strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .teams-cell span {
          flex: 0 0 auto;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 900;
        }

        .status-cell {
          justify-self: start;
          padding: 4px 8px;
          border-radius: 999px;
          background: #e2e8f0;
          color: #475569;
        }

        .status-cell.done {
          background: #bbf7d0;
          color: #047857;
        }

        .result-editor,
        .penalty-editor {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .result-editor input,
        .penalty-editor input {
          width: 43px;
          height: 34px;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          text-align: center;
          color: #0f172a;
          background: white;
          font-size: 15px;
          font-weight: 950;
          outline: none;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
        }

        .penalty-editor input {
          border-color: #fdba74;
          background: #fffbeb;
        }

        .result-editor input:focus,
        .penalty-editor input:focus {
          border-color: #d97706;
        }

        .result-editor input:disabled,
        .penalty-editor input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
        }

        .result-editor span,
        .penalty-editor span {
          color: #94a3b8;
          font-weight: 950;
        }

        .no-penalties {
          color: #cbd5e1 !important;
        }

        @media (max-width: 760px) {
          .simulation-grid {
            grid-template-columns: 1fr;
          }

          .admin-card-title {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default Admin;
