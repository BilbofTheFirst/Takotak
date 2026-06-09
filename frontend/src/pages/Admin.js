import React, { useEffect, useMemo, useState } from 'react';
import { matchesService, resultsService } from '../services/api';

function Admin() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulationDate, setSimulationDate] = useState('2026-06-20');
  const [simulationTime, setSimulationTime] = useState('20:59');
  const [includeMockResults, setIncludeMockResults] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const res = await matchesService.getAll();
      setMatches(res.data);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = async (matchId) => {
    const team1 = prompt('Buts de l\'équipe 1:');
    const team2 = prompt('Buts de l\'équipe 2:');
    if (team1 !== null && team2 !== null) {
      try {
        await resultsService.create(matchId, parseInt(team1, 10), parseInt(team2, 10));
        alert('Résultat enregistré et points calculés!');
        loadMatches();
      } catch (error) {
        alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
      }
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

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Chargement...</div>;

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Administration</span>
          <h1>⚙️ Panel Admin</h1>
          <p>Ajouter les résultats des matchs et accéder rapidement aux outils de simulation.</p>
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

      <section className="admin-card">
        <div className="admin-card-title">
          <div>
            <span>🏁 Résultats officiels</span>
            <h2>Matchs</h2>
          </div>
        </div>

        <div className="match-admin-list">
          {matches.map(match => (
            <div key={match.id} className={`match-admin-row ${match.team1_goals !== null ? 'finished' : ''}`}>
              <div>
                <h3>{match.team1 || 'À déterminer'} vs {match.team2 || 'À déterminer'}</h3>
                <p>{match.start_time?.substring(0, 16).replace('T', ' ')} · Statut: <strong>{match.status}</strong></p>
              </div>

              {match.team1_goals !== null ? (
                <div className="result-pill">{match.team1_goals} - {match.team2_goals}</div>
              ) : (
                <button type="button" className="button primary" onClick={() => handleSaveResult(match.id)}>
                  Ajouter résultat
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .admin-page {
          min-height: 100vh;
          padding: 28px 18px 42px;
          color: #0f172a;
          background:
            radial-gradient(circle at top left, rgba(251, 191, 36, 0.16), transparent 34%),
            radial-gradient(circle at top right, rgba(15, 118, 110, 0.22), transparent 30%),
            linear-gradient(135deg, #071b16 0%, #0f172a 55%, #111827 100%);
        }

        .admin-hero,
        .admin-card {
          width: min(1100px, 100%);
          margin: 0 auto 18px;
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
          margin: 8px 0 6px;
          font-size: 38px;
          letter-spacing: -0.05em;
        }

        .admin-hero p {
          margin: 0;
          color: rgba(255, 255, 255, 0.72);
        }

        .admin-card {
          padding: 18px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.58);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
        }

        .admin-card-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
        }

        .admin-card-title span {
          color: #0f766e;
        }

        .admin-card-title h2 {
          margin: 3px 0 0;
          font-size: 24px;
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

        .admin-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 13px;
        }

        .button {
          border: 0;
          border-radius: 999px;
          padding: 9px 14px;
          cursor: pointer;
          font-weight: 900;
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

        .admin-help {
          margin: 12px 0 0;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .match-admin-list {
          display: grid;
          gap: 10px;
        }

        .match-admin-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 12px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .match-admin-row.finished {
          background: #ecfdf5;
          border-color: #bbf7d0;
        }

        .match-admin-row h3 {
          margin: 0;
          font-size: 16px;
        }

        .match-admin-row p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
        }

        .result-pill {
          min-width: 72px;
          padding: 7px 12px;
          border-radius: 999px;
          color: white;
          background: #0f172a;
          text-align: center;
          font-size: 18px;
          font-weight: 950;
          font-variant-numeric: tabular-nums;
        }

        @media (max-width: 760px) {
          .simulation-grid {
            grid-template-columns: 1fr;
          }

          .match-admin-row,
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
