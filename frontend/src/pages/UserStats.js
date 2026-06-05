import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function UserStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/results/user/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Chargement...</div>;
  if (!stats) return <div style={{ textAlign: 'center', padding: '20px' }}>Pas de stats pour le moment</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>📊 Vos Statistiques</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
          <h3>🏆 {stats.total_points || 0}</h3>
          <p>Points totaux</p>
        </div>
        <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
          <h3>🥇 #{stats.rank || '-'}</h3>
          <p>Votre classement</p>
        </div>
        <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
          <h3>⚽ {stats.matches_played || 0}</h3>
          <p>Matchs pronostiqués</p>
        </div>
        <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
          <h3>📈 {stats.avg_points_per_match || 0}</h3>
          <p>Pts moyens/Match</p>
        </div>
      </div>

      <h2>Précision des pronostics</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr style={{ background: '#e8f5e9' }}>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>✓ Scores exacts</td>
            <td style={{ border: '1px solid #ddd', padding: '10px', fontWeight: 'bold' }}>{stats.exact_scores || 0} (3 pts chacun)</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>≈ Bonnes différences</td>
            <td style={{ border: '1px solid #ddd', padding: '10px', fontWeight: 'bold' }}>{stats.correct_differences || 0} (2 pts chacun)</td>
          </tr>
          <tr style={{ background: '#fff3e0' }}>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>→ Bons vainqueurs</td>
            <td style={{ border: '1px solid #ddd', padding: '10px', fontWeight: 'bold' }}>{stats.correct_winners || 0} (1 pt chacun)</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '10px' }}>✗ Mauvais pronostics</td>
            <td style={{ border: '1px solid #ddd', padding: '10px', fontWeight: 'bold' }}>{stats.wrong_predictions || 0} (0 pt)</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default UserStats;
