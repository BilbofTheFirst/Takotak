import React, { useEffect, useMemo, useState } from 'react';
import { resultsService } from '../services/api';
import PageLoader from '../components/PageLoader';
import UserAvatar from '../components/UserAvatar';

const PRIMARY = '#0f766e';
const SECONDARY = '#d97706';
const DARK = '#0f172a';
const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;
const CHART_COLORS = ['#0f766e', '#d97706', '#2563eb', '#db2777', '#7c3aed', '#16a34a', '#dc2626', '#0891b2'];

const getTrendConfig = (trend) => {
  if (trend > 0) return { label: `+${trend}`, icon: '▲', className: 'trend-up' };
  if (trend < 0) return { label: `${trend}`, icon: '▼', className: 'trend-down' };
  return { label: '0', icon: '•', className: 'trend-flat' };
};

function ScoreProgressionChart({ progression, rankedUsers }) {
  const topUsers = useMemo(() => rankedUsers.slice(0, 8), [rankedUsers]);
  const usersById = useMemo(() => new Map((progression?.users || []).map(user => [Number(user.id), user])), [progression]);
  const series = topUsers
    .map((user, index) => ({ ...user, color: CHART_COLORS[index % CHART_COLORS.length], data: usersById.get(Number(user.id))?.series || [] }))
    .filter(user => user.data.length > 0);

  const maxX = Math.max(1, ...(progression?.matches || []).map(match => Number(match.match_number || 0)));
  const maxY = Math.max(3, ...series.flatMap(user => user.data.map(point => Number(point.points || 0))));
  const width = 880;
  const height = 310;
  const padLeft = 44;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 38;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const xFor = (value) => padLeft + (Number(value || 0) / maxX) * chartWidth;
  const yFor = (value) => padTop + chartHeight - (Number(value || 0) / maxY) * chartHeight;

  if (!series.length) {
    return <div className="empty-chart">Le graphique apparaîtra dès que des résultats seront encodés.</div>;
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <span>📈 Progression</span>
          <h2>Évolution des scores</h2>
        </div>
        <p>Top {series.length} · axe X = matchs joués · axe Y = points cumulés</p>
      </div>

      <div className="chart-scroll">
        <svg viewBox={`0 0 ${width} ${height}`} className="progression-chart" role="img" aria-label="Graphique d'évolution des scores">
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = padTop + chartHeight - ratio * chartHeight;
            const value = Math.round(maxY * ratio);
            return (
              <g key={ratio}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} className="chart-grid" />
                <text x={padLeft - 10} y={y + 4} className="chart-axis-label" textAnchor="end">{value}</text>
              </g>
            );
          })}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const x = padLeft + ratio * chartWidth;
            const value = Math.round(maxX * ratio);
            return (
              <g key={`x-${ratio}`}>
                <line x1={x} y1={padTop} x2={x} y2={padTop + chartHeight} className="chart-grid soft" />
                <text x={x} y={height - 12} className="chart-axis-label" textAnchor="middle">{value}</text>
              </g>
            );
          })}

          <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartHeight} className="chart-axis" />
          <line x1={padLeft} y1={padTop + chartHeight} x2={width - padRight} y2={padTop + chartHeight} className="chart-axis" />

          {series.map(user => {
            const points = user.data.map(point => `${xFor(point.match_number)},${yFor(point.points)}`).join(' ');
            const lastPoint = user.data[user.data.length - 1];
            return (
              <g key={user.id}>
                <polyline points={points} fill="none" stroke={user.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                {lastPoint && <circle cx={xFor(lastPoint.match_number)} cy={yFor(lastPoint.points)} r="4.5" fill={user.color} />}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="chart-legend">
        {series.map(user => (
          <div key={user.id} className="legend-item">
            <span style={{ background: user.color }} />
            <strong>{user.username}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function PodiumPerson({ user, place }) {
  if (!user) return <div className={`podium-person place-${place} empty`} />;
  const labels = { 1: 'Champion provisoire', 2: 'Deuxième', 3: 'Troisième' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className={`podium-person place-${place}`}>
      <div className="podium-character">
        <div className="podium-head">
          <UserAvatar user={user} size={68} />
        </div>
        <div className="podium-body">
          <span className="podium-arm left" />
          <span className="podium-torso" />
          <span className="podium-arm right" />
        </div>
      </div>
      <div className="podium-label">
        <span>{medals[place]} {labels[place]}</span>
        <strong>{user.username}</strong>
        <em>{user.total_points || 0} pts</em>
      </div>
      <div className="podium-step"><strong>{place}</strong></div>
    </div>
  );
}

function Rankings() {
  const [rankings, setRankings] = useState([]);
  const [progression, setProgression] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const [rankingRes, progressionRes] = await Promise.all([
        resultsService.getLeaderboard(),
        resultsService.getLeaderboardProgression()
      ]);
      setRankings(rankingRes.data || []);
      setProgression(progressionRes.data || null);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const topThree = rankings.slice(0, 3);
  const leader = topThree[0];
  const totalPlayers = rankings.length;
  const totalPredictions = rankings.reduce((sum, user) => sum + Number(user.matches_predicted || 0), 0);
  const totalPoints = rankings.reduce((sum, user) => sum + Number(user.total_points || 0), 0);

  if (loading) return <PageLoader title="Chargement du classement..." icon="🏆" subtitle="Calcul des points et des bonus" />;

  return (
    <div className="rankings-page">
      <div className="rankings-container">
        <section className="rankings-hero">
          <div>
            <span className="rankings-eyebrow">Course au trophée</span>
            <h1>🏆 Classement général</h1>
            <p>Le tableau de chasse des pronostiqueurs : points de matchs, bonus, dynamique et progression globale.</p>
          </div>
          <div className="rankings-summary">
            <div><strong>{totalPlayers}</strong><span>joueurs</span></div>
            <div><strong>{totalPredictions}</strong><span>pronos scorés</span></div>
            <div><strong>{totalPoints}</strong><span>points distribués</span></div>
          </div>
        </section>

        <section className="podium-card">
          <div className="podium-title">
            <span>🎖️ Top 3</span>
            <h2>{leader ? `${leader.username} mène la danse` : 'Le podium arrive bientôt'}</h2>
          </div>
          <div className="podium-stage">
            <PodiumPerson user={topThree[1]} place={2} />
            <PodiumPerson user={topThree[0]} place={1} />
            <PodiumPerson user={topThree[2]} place={3} />
          </div>
        </section>

        <section className="ranking-table-card">
          <div className="table-title">
            <div><span>📋 Tous les joueurs</span><h2>Classement détaillé</h2></div>
            <p>Tendance calculée par rapport au classement avant le dernier match encodé.</p>
          </div>

          <div className="ranking-table-wrap">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Tendance</th>
                  <th>Joueur</th>
                  <th>Total</th>
                  <th>Matchs</th>
                  <th>Bonus</th>
                  <th>Pronos</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((user, idx) => {
                  const trend = getTrendConfig(Number(user.trend || 0));
                  return (
                    <tr key={user.id} className={idx < 3 ? `top-row top-${idx + 1}` : ''}>
                      <td><span className="rank-pill">#{user.rank || idx + 1}</span></td>
                      <td><span className={`trend-pill ${trend.className}`}><b>{trend.icon}</b>{trend.label}</span></td>
                      <td>
                        <div className="player-cell">
                          <UserAvatar user={user} size={38} />
                          <div><strong>{user.username}</strong><span>{idx === 0 ? 'Leader provisoire' : `Ancien rang #${user.previous_rank || user.rank || idx + 1}`}</span></div>
                        </div>
                      </td>
                      <td><strong className="total-score">{user.total_points || 0}</strong></td>
                      <td>{user.match_points || 0}</td>
                      <td>{user.bonus_points || 0}</td>
                      <td>{user.matches_predicted || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <ScoreProgressionChart progression={progression} rankedUsers={rankings} />
      </div>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .rankings-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(217,119,6,.18), transparent 32%),
      radial-gradient(circle at top right, rgba(15,118,110,.2), transparent 34%),
      linear-gradient(135deg, #071b16 0%, #0f172a 45%, #111827 100%);
    padding: 24px 18px 42px;
    color: ${DARK};
  }

  .rankings-container { width: min(1220px, 100%); margin: 0 auto; }

  .rankings-hero {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    gap: 22px;
    margin-bottom: 18px;
    color: white;
  }

  .rankings-eyebrow,
  .podium-title span,
  .table-title span,
  .chart-header span {
    display: inline-flex;
    color: #fde68a;
    font-size: 11px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .rankings-eyebrow {
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    margin-bottom: 10px;
  }

  .rankings-hero h1 { margin: 0 0 7px; font-size: clamp(30px, 3.6vw, 48px); line-height: 1; letter-spacing: -.05em; }
  .rankings-hero p { margin: 0; max-width: 680px; color: rgba(255,255,255,.76); font-size: 14px; line-height: 1.5; }

  .rankings-summary {
    min-width: 360px;
    display: grid;
    grid-template-columns: repeat(3, minmax(86px, 1fr));
    gap: 9px;
  }

  .rankings-summary div {
    padding: 13px;
    border-radius: 16px;
    background: rgba(255,255,255,.1);
    border: 1px solid rgba(255,255,255,.16);
    box-shadow: 0 16px 38px rgba(0,0,0,.16);
  }

  .rankings-summary strong { display: block; color: #fde68a; font-size: 26px; line-height: 1; }
  .rankings-summary span { display: block; margin-top: 6px; color: rgba(255,255,255,.72); font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; }

  .podium-card,
  .ranking-table-card,
  .chart-card {
    margin-bottom: 18px;
    border-radius: 22px;
    background: rgba(255,255,255,.96);
    border: 1px solid rgba(255,255,255,.55);
    box-shadow: 0 18px 55px rgba(0,0,0,.2);
    overflow: hidden;
  }

  .podium-title,
  .table-title,
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding: 18px 20px;
    background: linear-gradient(135deg, rgba(15,118,110,.08), rgba(217,119,6,.08));
    border-bottom: 1px solid #e2e8f0;
  }

  .podium-title h2,
  .table-title h2,
  .chart-header h2 { margin: 4px 0 0; font-size: 23px; letter-spacing: -.04em; }
  .table-title p,
  .chart-header p { margin: 0; max-width: 420px; color: #64748b; font-size: 12px; font-weight: 800; line-height: 1.45; }

  .podium-stage {
    min-height: 360px;
    display: grid;
    grid-template-columns: 1fr 1.15fr 1fr;
    align-items: end;
    gap: 18px;
    padding: 28px 22px 22px;
    background:
      radial-gradient(circle at center top, rgba(251,191,36,.22), transparent 35%),
      linear-gradient(180deg, #ffffff, #f8fafc);
  }

  .podium-person { display: grid; justify-items: center; gap: 10px; align-items: end; }
  .place-1 { transform: translateY(-20px); }
  .place-2 { transform: translateY(18px); }
  .place-3 { transform: translateY(38px); }

  .podium-character { display: grid; justify-items: center; gap: 0; position: relative; z-index: 2; }
  .podium-head { padding: 5px; border-radius: 999px; background: white; box-shadow: 0 10px 28px rgba(15,23,42,.18); }
  .place-1 .podium-head { box-shadow: 0 0 0 4px rgba(251,191,36,.35), 0 14px 34px rgba(15,23,42,.2); }

  .podium-body { position: relative; width: 86px; height: 74px; display: grid; place-items: center; }
  .podium-torso { width: 52px; height: 64px; border-radius: 24px 24px 16px 16px; background: ${GRADIENT}; box-shadow: inset 0 -10px 18px rgba(0,0,0,.14); }
  .podium-arm { position: absolute; top: 14px; width: 16px; height: 48px; border-radius: 999px; background: #d97706; }
  .podium-arm.left { left: 8px; transform: rotate(18deg); }
  .podium-arm.right { right: 8px; transform: rotate(-18deg); }

  .podium-label { text-align: center; max-width: 210px; }
  .podium-label span { display: block; color: #64748b; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; }
  .podium-label strong { display: block; margin-top: 4px; color: #0f172a; font-size: 16px; line-height: 1.05; }
  .podium-label em { display: block; margin-top: 5px; color: #0f766e; font-style: normal; font-weight: 950; }

  .podium-step { width: 100%; max-width: 250px; display: grid; place-items: center; border-radius: 18px 18px 8px 8px; color: white; background: ${GRADIENT}; box-shadow: 0 16px 32px rgba(15,23,42,.18); }
  .podium-step strong { font-size: 36px; line-height: 1; padding: 28px 0; }
  .place-1 .podium-step strong { padding: 48px 0; font-size: 46px; }
  .place-3 .podium-step strong { padding: 20px 0; }

  .ranking-table-wrap { overflow-x: auto; }
  .ranking-table { width: 100%; border-collapse: collapse; min-width: 820px; }
  .ranking-table th { padding: 12px 14px; color: #64748b; background: #f8fafc; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; text-align: left; border-bottom: 1px solid #e2e8f0; }
  .ranking-table td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 850; }
  .ranking-table tr:last-child td { border-bottom: 0; }
  .top-row { background: linear-gradient(90deg, rgba(254,243,199,.55), rgba(255,255,255,.95)); }

  .rank-pill { display: inline-flex; min-width: 44px; justify-content: center; padding: 6px 8px; border-radius: 999px; background: #e2e8f0; color: #334155; font-weight: 950; }
  .top-1 .rank-pill { background: #fef3c7; color: #92400e; }
  .top-2 .rank-pill { background: #e0f2fe; color: #0369a1; }
  .top-3 .rank-pill { background: #ffedd5; color: #c2410c; }

  .trend-pill { display: inline-flex; align-items: center; gap: 5px; min-width: 54px; justify-content: center; padding: 6px 8px; border-radius: 999px; font-size: 11px; font-weight: 950; }
  .trend-up { background: #dcfce7; color: #047857; }
  .trend-down { background: #fee2e2; color: #b91c1c; }
  .trend-flat { background: #f1f5f9; color: #64748b; }

  .player-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .player-cell strong { display: block; font-size: 14px; }
  .player-cell span { display: block; margin-top: 2px; color: #64748b; font-size: 10px; font-weight: 800; }
  .total-score { color: #0f766e; font-size: 18px; }

  .chart-card { padding-bottom: 16px; }
  .chart-scroll { overflow-x: auto; padding: 12px 18px 4px; }
  .progression-chart { width: 100%; min-width: 720px; display: block; }
  .chart-grid { stroke: #e2e8f0; stroke-width: 1; }
  .chart-grid.soft { stroke: #f1f5f9; }
  .chart-axis { stroke: #94a3b8; stroke-width: 1.2; }
  .chart-axis-label { fill: #64748b; font-size: 10px; font-weight: 800; }

  .chart-legend { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 18px; }
  .legend-item { display: inline-flex; align-items: center; gap: 7px; padding: 6px 9px; border-radius: 999px; background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; font-size: 11px; }
  .legend-item span { width: 10px; height: 10px; border-radius: 999px; }
  .empty-chart { padding: 28px 18px; color: #64748b; font-weight: 850; text-align: center; }

  @media (max-width: 920px) {
    .rankings-hero { flex-direction: column; }
    .rankings-summary { min-width: 0; }
    .podium-stage { grid-template-columns: 1fr; min-height: 0; gap: 24px; }
    .place-1, .place-2, .place-3 { transform: none; }
    .podium-person { grid-template-columns: 96px 1fr; grid-template-areas: 'character label' 'step step'; justify-items: start; align-items: center; }
    .podium-character { grid-area: character; }
    .podium-label { grid-area: label; text-align: left; }
    .podium-step { grid-area: step; max-width: none; }
    .podium-step strong, .place-1 .podium-step strong, .place-3 .podium-step strong { padding: 12px 0; font-size: 28px; }
    .podium-title, .table-title, .chart-header { flex-direction: column; }
  }

  @media (max-width: 560px) {
    .rankings-page { padding: 18px 10px 36px; }
    .rankings-summary { grid-template-columns: 1fr; }
    .podium-title, .table-title, .chart-header { padding: 15px; }
    .podium-stage { padding: 20px 14px; }
    .podium-person { grid-template-columns: 82px 1fr; }
    .podium-head .user-avatar { width: 58px !important; height: 58px !important; min-width: 58px !important; }
    .podium-body { width: 70px; height: 58px; }
    .podium-torso { width: 42px; height: 50px; }
    .podium-arm { height: 38px; }
    .chart-scroll { padding: 10px; }
  }
`;

export default Rankings;
