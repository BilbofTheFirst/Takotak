import React, { useEffect, useState } from 'react';
import api from '../services/api';
import PageLoader from '../components/PageLoader';

const SYSTEM_BADGES = {
  current: 'Actuel',
  simple: '5/3/1',
  detailed: '3+1+1+1'
};

const formatDelta = (delta) => {
  const value = Number(delta || 0);
  if (value > 0) return `+${value}`;
  return String(value);
};

const getDeltaClass = (delta) => {
  const value = Number(delta || 0);
  if (value > 0) return 'delta-up';
  if (value < 0) return 'delta-down';
  return 'delta-flat';
};

function AdminRankingsComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setError('');
      const response = await api.get('/admin/rankings');
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des classements comparatifs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <PageLoader title="Chargement des classements..." icon="🏆" subtitle="Comparaison des systèmes de points" />;

  if (error) {
    return (
      <section className="admin-rankings-card admin-rankings-error">
        <div className="admin-rankings-title">
          <div><span>🏆 Classements</span><h2>Erreur</h2></div>
          <button type="button" onClick={loadData}>Réessayer</button>
        </div>
        <p>{error}</p>
        <style>{styles}</style>
      </section>
    );
  }

  const systems = data?.systems || [];
  const matchesScored = Number(data?.matches_scored || 0);

  return (
    <section className="admin-rankings-card">
      <div className="admin-rankings-title">
        <div>
          <span>🏆 Classements comparatifs</span>
          <h2>Tester les systèmes de scoring</h2>
          <p>
            Ces classements ne tiennent compte que des points marqués sur les matchs déjà encodés.
            Les bonus long terme et spéciaux J1/J2/J3 ne sont pas ajoutés ici.
          </p>
        </div>
        <button type="button" onClick={loadData}>Rafraîchir</button>
      </div>

      <div className="admin-rankings-summary">
        <div><strong>{matchesScored}</strong><span>matchs avec résultat</span></div>
        <div><strong>{systems.length}</strong><span>systèmes comparés</span></div>
      </div>

      <div className="scoring-grid">
        {systems.map(system => (
          <article key={system.key} className={`scoring-card system-${system.key}`}>
            <div className="scoring-card-header">
              <div>
                <span>{SYSTEM_BADGES[system.key] || system.key}</span>
                <h3>{system.title}</h3>
                <p>{system.description}</p>
              </div>
              <em>{system.max_points_per_match} pts max/match</em>
            </div>

            <div className="scoring-table-wrap">
              <table className="scoring-table">
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Joueur</th>
                    <th>Pts</th>
                    <th>Δ actuel</th>
                    <th>Exact</th>
                    <th>Résultat</th>
                    <th>Écart</th>
                    {system.key === 'detailed' && <th>Buts 1/2</th>}
                  </tr>
                </thead>
                <tbody>
                  {(system.rows || []).map(row => (
                    <tr key={`${system.key}-${row.id}`} className={row.rank <= 3 ? `top-row top-${row.rank}` : ''}>
                      <td><strong className="rank-pill">#{row.rank}</strong></td>
                      <td><strong>{row.username}</strong></td>
                      <td><strong className="points-pill">{row.points}</strong></td>
                      <td><span className={`delta-pill ${getDeltaClass(row.rank_delta_vs_current)}`}>{formatDelta(row.rank_delta_vs_current)}</span></td>
                      <td>{row.exact_scores}</td>
                      <td>{row.correct_results}</td>
                      <td>{row.correct_differences}</td>
                      {system.key === 'detailed' && <td>{row.correct_team1_goals}/{row.correct_team2_goals}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>

      <div className="admin-rankings-note">
        <strong>Lecture du Δ actuel :</strong> +2 veut dire que le joueur gagne deux places avec ce système par rapport au classement match actuel. 0 veut dire aucun changement de rang.
      </div>

      <style>{styles}</style>
    </section>
  );
}

const styles = `
  .admin-rankings-card {
    width: min(1220px, 100%);
    margin: 0 auto 16px;
    background: rgba(255,255,255,.96);
    border: 1px solid rgba(255,255,255,.55);
    border-radius: 18px;
    padding: 16px;
    box-shadow: 0 18px 55px rgba(0,0,0,.2);
    color: #0f172a;
  }

  .admin-rankings-title {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 14px;
  }

  .admin-rankings-title span,
  .scoring-card-header span {
    display: block;
    color: #0f766e;
    font-size: 10px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .06em;
  }

  .admin-rankings-title h2 {
    margin: 2px 0 6px;
    color: #0f172a;
    font-size: 22px;
  }

  .admin-rankings-title p {
    margin: 0;
    max-width: 760px;
    color: #64748b;
    font-size: 13px;
    line-height: 1.45;
    font-weight: 800;
  }

  .admin-rankings-title button {
    border: 0;
    border-radius: 999px;
    padding: 9px 13px;
    background: linear-gradient(135deg, #0f766e, #d97706);
    color: white;
    font-size: 12px;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 0 8px 18px rgba(15,118,110,.18);
  }

  .admin-rankings-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 14px;
  }

  .admin-rankings-summary div {
    border-radius: 16px;
    padding: 13px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .admin-rankings-summary strong {
    display: block;
    color: #d97706;
    font-size: 27px;
    line-height: 1;
  }

  .admin-rankings-summary span {
    display: block;
    margin-top: 7px;
    color: #475569;
    font-size: 10px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .05em;
  }

  .scoring-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .scoring-card {
    min-width: 0;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    background: #f8fafc;
    overflow: hidden;
  }

  .scoring-card-header {
    min-height: 128px;
    display: grid;
    gap: 10px;
    padding: 13px;
    background: linear-gradient(135deg, rgba(15,118,110,.08), rgba(217,119,6,.08));
    border-bottom: 1px solid #e2e8f0;
  }

  .scoring-card-header h3 {
    margin: 3px 0 5px;
    color: #0f172a;
    font-size: 18px;
    letter-spacing: -.03em;
  }

  .scoring-card-header p {
    margin: 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.35;
    font-weight: 850;
  }

  .scoring-card-header em {
    justify-self: start;
    display: inline-flex;
    padding: 5px 8px;
    border-radius: 999px;
    background: #fff7ed;
    color: #92400e;
    border: 1px solid #fed7aa;
    font-size: 10px;
    font-style: normal;
    font-weight: 950;
  }

  .scoring-table-wrap {
    overflow-x: auto;
  }

  .scoring-table {
    width: 100%;
    min-width: 560px;
    border-collapse: collapse;
  }

  .scoring-table th {
    padding: 9px 10px;
    color: #64748b;
    background: #f1f5f9;
    font-size: 9px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .05em;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }

  .scoring-table td {
    padding: 9px 10px;
    border-bottom: 1px solid #e2e8f0;
    color: #0f172a;
    font-size: 12px;
    font-weight: 850;
  }

  .top-row { background: linear-gradient(90deg, rgba(254,243,199,.55), rgba(255,255,255,.95)); }
  .rank-pill, .points-pill, .delta-pill {
    display: inline-flex;
    min-width: 34px;
    justify-content: center;
    padding: 4px 7px;
    border-radius: 999px;
    font-weight: 950;
  }

  .rank-pill { background: #e2e8f0; color: #334155; }
  .points-pill { background: #ecfdf5; color: #047857; }
  .delta-up { background: #dcfce7; color: #047857; }
  .delta-down { background: #fee2e2; color: #b91c1c; }
  .delta-flat { background: #f1f5f9; color: #64748b; }

  .admin-rankings-note {
    margin-top: 14px;
    padding: 10px 12px;
    border-radius: 14px;
    background: #eff6ff;
    color: #1e3a8a;
    border: 1px solid #bfdbfe;
    font-size: 12px;
    font-weight: 850;
  }

  .admin-rankings-error p { margin: 0; color: #991b1b; font-weight: 900; }

  @media (max-width: 1100px) {
    .scoring-grid { grid-template-columns: 1fr; }
    .scoring-card-header { min-height: 0; }
  }

  @media (max-width: 640px) {
    .admin-rankings-card { padding: 12px; }
    .admin-rankings-title { flex-direction: column; }
    .admin-rankings-title button { width: 100%; }
    .admin-rankings-summary { grid-template-columns: 1fr; }
  }
`;

export default AdminRankingsComparison;
