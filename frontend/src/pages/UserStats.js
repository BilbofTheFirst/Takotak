import React, { useEffect, useState } from 'react';
import { resultsService } from '../services/api';

function UserStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await resultsService.getUserStats();
      setStats(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-shell"><div className="page-container">Chargement...</div></div>;
  if (!stats) return <div className="page-shell"><div className="page-container">Pas de stats pour le moment</div></div>;

  const statCards = [
    { label: 'Points totaux', value: stats.total_points || 0, icon: '🏆' },
    { label: 'Classement', value: stats.rank ? `#${stats.rank}` : '-', icon: '🥇' },
    { label: 'Matchs scorés', value: stats.matches_played || 0, icon: '⚽' },
    { label: 'Moyenne / match', value: stats.avg_points_per_match || 0, icon: '📈' }
  ];

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="section-title">
          <div>
            <h1>📊 Mes statistiques</h1>
            <p>Suivi des points calculés après encodage des résultats officiels.</p>
          </div>
          <button className="button" onClick={loadStats}>Rafraîchir</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '15px', marginBottom: '24px' }}>
          {statCards.map(card => (
            <div className="card" key={card.label}>
              <div style={{ fontSize: 26 }}>{card.icon}</div>
              <h2 style={{ margin: '6px 0', color: 'var(--grass-900)' }}>{card.value}</h2>
              <p style={{ margin: 0, color: 'var(--muted)' }}>{card.label}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Précision des pronostics</h2>
          <table className="table-modern">
            <tbody>
              <tr>
                <td>✓ Scores exacts</td>
                <td><strong>{stats.exact_scores || 0}</strong> × 3 pts</td>
              </tr>
              <tr>
                <td>≈ Bonnes différences</td>
                <td><strong>{stats.correct_differences || 0}</strong> × 2 pts</td>
              </tr>
              <tr>
                <td>→ Bons vainqueurs / bons nuls simples</td>
                <td><strong>{stats.correct_winners || 0}</strong> × 1 pt</td>
              </tr>
              <tr>
                <td>✗ Mauvais pronostics</td>
                <td><strong>{stats.wrong_predictions || 0}</strong> × 0 pt</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserStats;
