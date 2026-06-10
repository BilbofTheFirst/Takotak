import React, { useEffect, useState } from 'react';
import { resultsService } from '../services/api';
import PageLoader from '../components/PageLoader';

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

  if (loading) return <PageLoader title="Chargement de tes stats..." icon="📊" subtitle="Calcul de tes points, bonus et classement" />;
  if (!stats) return <div className="stats-page"><div className="stats-container"><div className="stats-card">Pas de stats pour le moment</div></div><style>{styles}</style></div>;

  const statCards = [
    { label: 'Points totaux', value: stats.total_points || 0, icon: '🏆', featured: true },
    { label: 'Classement', value: stats.rank ? `#${stats.rank}` : '-', icon: '🥇' },
    { label: 'Points matchs', value: stats.match_points || 0, icon: '⚽' },
    { label: 'Points bonus', value: stats.bonus_points || 0, icon: '🎁' },
    { label: 'Moyenne / match', value: stats.avg_points_per_match || 0, icon: '📈' }
  ];

  return (
    <div className="stats-page">
      <div className="stats-container">
        <section className="stats-hero">
          <div>
            <span className="stats-eyebrow">Performance personnelle</span>
            <h1>📊 Mes statistiques</h1>
            <p>Suivi de tes points calculés après encodage des résultats officiels, bonus inclus.</p>
          </div>
          <button className="stats-refresh" onClick={loadStats}>Rafraîchir</button>
        </section>

        <section className="stats-grid">
          {statCards.map(card => (
            <article className={`stats-card stat-card ${card.featured ? 'featured' : ''}`} key={card.label}>
              <div className="stat-icon">{card.icon}</div>
              <div>
                <strong>{card.value}</strong>
                <span>{card.label}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="stats-card precision-card">
          <div className="stats-card-title">
            <div>
              <span>Détail des points</span>
              <h2>Précision des pronostics</h2>
            </div>
          </div>

          <div className="precision-list">
            <div><span>✓ Scores exacts</span><strong>{stats.exact_scores || 0} × 3 pts</strong></div>
            <div><span>≈ Bonnes différences</span><strong>{stats.correct_differences || 0} × 2 pts</strong></div>
            <div><span>→ Bons vainqueurs / bons nuls simples</span><strong>{stats.correct_winners || 0} × 1 pt</strong></div>
            <div><span>🎁 Bonus compétition</span><strong>{stats.bonus_points || 0} pts</strong></div>
            <div><span>✗ Mauvais pronostics</span><strong>{stats.wrong_predictions || 0} × 0 pt</strong></div>
          </div>
        </section>
      </div>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .stats-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(217,119,6,.15), transparent 32%),
      radial-gradient(circle at top right, rgba(15,118,110,.18), transparent 32%),
      linear-gradient(135deg, #071b16 0%, #0f172a 45%, #111827 100%);
    padding: 24px 18px 42px;
    color: #0f172a;
  }

  .stats-container { width: min(1120px, 100%); margin: 0 auto; }

  .stats-hero {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
    margin-bottom: 16px;
    color: white;
  }

  .stats-eyebrow {
    display: inline-flex;
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #fde68a;
    margin-bottom: 10px;
  }

  .stats-hero h1 { margin: 0 0 7px; font-size: clamp(28px, 3.4vw, 44px); line-height: 1; letter-spacing: -.04em; }
  .stats-hero p { margin: 0; max-width: 680px; color: rgba(255,255,255,.76); font-size: 14px; line-height: 1.5; }
  .stats-refresh { border: 0; border-radius: 999px; padding: 10px 14px; color: white; background: linear-gradient(135deg, #0f766e, #d97706); font-weight: 950; cursor: pointer; box-shadow: 0 12px 28px rgba(0,0,0,.18); }

  .stats-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
  .stats-card { background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); border-radius: 18px; padding: 16px; box-shadow: 0 18px 55px rgba(0,0,0,.2); }
  .stat-card { display: grid; gap: 10px; min-height: 128px; }
  .stat-card.featured { color: white; background: linear-gradient(135deg, #0f766e, #d97706); }
  .stat-icon { width: 38px; height: 38px; border-radius: 13px; display: grid; place-items: center; background: rgba(15,23,42,.08); font-size: 22px; }
  .featured .stat-icon { background: rgba(255,255,255,.14); }
  .stat-card strong { display: block; color: #0f172a; font-size: 30px; line-height: 1; letter-spacing: -.04em; }
  .featured strong { color: #fff7ed; }
  .stat-card span { display: block; margin-top: 6px; color: #64748b; font-size: 11px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; }
  .featured span { color: rgba(255,255,255,.78); }

  .stats-card-title span { display: block; color: #0f766e; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; }
  .stats-card-title h2 { margin: 2px 0 14px; color: #0f172a; font-size: 22px; }
  .precision-list { display: grid; gap: 8px; }
  .precision-list div { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 11px 12px; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .precision-list span { color: #334155; font-weight: 850; }
  .precision-list strong { color: #d97706; white-space: nowrap; }

  @media (max-width: 920px) { .stats-hero { flex-direction: column; } .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 560px) { .stats-page { padding: 18px 10px 36px; } .stats-grid { grid-template-columns: 1fr; } .precision-list div { flex-direction: column; align-items: flex-start; } }
`;

export default UserStats;
