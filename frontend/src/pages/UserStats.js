import React, { useEffect, useMemo, useState } from 'react';
import { resultsService } from '../services/api';
import PageLoader from '../components/PageLoader';
import UserAvatar from '../components/UserAvatar';

const PRIMARY = '#0f766e';
const SECONDARY = '#d97706';
const DARK = '#0f172a';
const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;

const number = (value) => Number(value || 0);
const pct = (value, total) => total > 0 ? Math.round((value / total) * 100) : 0;
const formatOneDecimal = (value) => Number(value || 0).toFixed(1).replace('.0', '');
const sortBy = (items, field) => [...items].sort((a, b) => number(b[field]) - number(a[field]) || a.username.localeCompare(b.username, 'fr'));

function AwardCard({ icon, title, user, value, suffix = 'pts' }) {
  return (
    <article className="award-card">
      <div className="award-icon">{icon}</div>
      <div className="award-content">
        <span>{title}</span>
        {user ? (
          <div className="award-user">
            <UserAvatar user={user} size={34} />
            <div>
              <strong>{user.username}</strong>
              <em>{value} {suffix}</em>
            </div>
          </div>
        ) : <strong>À venir</strong>}
      </div>
    </article>
  );
}

function StatPill({ label, value, icon, featured }) {
  return (
    <article className={`stat-pill ${featured ? 'featured' : ''}`}>
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <em>{label}</em>
      </div>
    </article>
  );
}

function UserStats() {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
      return null;
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [statsResponse, leaderboardResponse] = await Promise.all([
        resultsService.getUserStats(),
        resultsService.getLeaderboard()
      ]);
      setStats(statsResponse.data);
      setLeaderboard(leaderboardResponse.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const overview = useMemo(() => {
    const totalPlayers = leaderboard.length;
    const totalPoints = leaderboard.reduce((sum, user) => sum + number(user.total_points), 0);
    const totalMatchPoints = leaderboard.reduce((sum, user) => sum + number(user.match_points), 0);
    const totalBonusPoints = leaderboard.reduce((sum, user) => sum + number(user.bonus_points), 0);
    const totalSpecialPoints = leaderboard.reduce((sum, user) => sum + number(user.special_points), 0);
    const totalScoredPredictions = leaderboard.reduce((sum, user) => sum + number(user.matches_predicted), 0);
    const leader = leaderboard[0] || null;
    const activePlayers = leaderboard.filter(user => number(user.matches_predicted) > 0).length;

    return {
      totalPlayers,
      activePlayers,
      totalPoints,
      totalMatchPoints,
      totalBonusPoints,
      totalSpecialPoints,
      totalScoredPredictions,
      leader,
      averagePoints: totalPlayers ? totalPoints / totalPlayers : 0
    };
  }, [leaderboard]);

  const awards = useMemo(() => {
    const efficiencyCandidates = leaderboard
      .filter(user => number(user.matches_predicted) > 0)
      .map(user => ({ ...user, efficiency: number(user.total_points) / Math.max(1, number(user.matches_predicted)) }));

    return {
      matchBoss: sortBy(leaderboard, 'match_points')[0],
      bonusBoss: sortBy(leaderboard, 'bonus_points')[0],
      specialBoss: sortBy(leaderboard, 'special_points')[0],
      volumeBoss: sortBy(leaderboard, 'matches_predicted')[0],
      efficiencyBoss: [...efficiencyCandidates].sort((a, b) => b.efficiency - a.efficiency || a.username.localeCompare(b.username, 'fr'))[0]
    };
  }, [leaderboard]);

  const currentUserId = Number(storedUser?.id || 0);
  const myLeaderboardRow = leaderboard.find(user => Number(user.id) === currentUserId);
  const userDisplay = myLeaderboardRow || storedUser || { username: 'Moi' };
  const myRankIndex = leaderboard.findIndex(user => Number(user.id) === currentUserId);
  const playerAhead = myRankIndex > 0 ? leaderboard[myRankIndex - 1] : null;
  const playerBehind = myRankIndex >= 0 && myRankIndex < leaderboard.length - 1 ? leaderboard[myRankIndex + 1] : null;
  const pointsToNext = playerAhead ? Math.max(0, number(playerAhead.total_points) - number(myLeaderboardRow?.total_points) + 1) : 0;

  if (loading) return <PageLoader title="Chargement des stats..." icon="📊" subtitle="Analyse du jeu et des performances" />;
  if (!stats) return <div className="stats-page"><div className="stats-container"><div className="stats-card">Pas de stats pour le moment</div></div><style>{styles}</style></div>;

  const distributionTotal = overview.totalMatchPoints + overview.totalSpecialPoints + overview.totalBonusPoints;
  const topFive = leaderboard.slice(0, 5);

  const personalCards = [
    { label: 'Mes points', value: stats.total_points || 0, icon: '🏆', featured: true },
    { label: 'Mon rang', value: stats.rank ? `#${stats.rank}` : '-', icon: '🥇' },
    { label: 'Scores exacts', value: stats.exact_scores || 0, icon: '🎯' },
    { label: 'Moyenne / match', value: stats.avg_points_per_match || 0, icon: '📈' }
  ];

  const precisionRows = [
    { label: 'Scores exacts', value: `${stats.exact_scores || 0} × 3 pts`, icon: '🎯', className: 'exact' },
    { label: 'Bonnes différences', value: `${stats.correct_differences || 0} × 2 pts`, icon: '⚖️', className: 'difference' },
    { label: 'Bons vainqueurs / bons nuls simples', value: `${stats.correct_winners || 0} × 1 pt`, icon: '✅', className: 'winner' },
    { label: 'Mauvais pronostics', value: `${stats.wrong_predictions || 0} × 0 pt`, icon: '💩', className: 'wrong' }
  ];

  return (
    <div className="stats-page">
      <div className="stats-container">
        <section className="stats-hero">
          <div>
            <span className="stats-eyebrow">Stats du jeu</span>
            <h1>📊 Le tableau de bord Takotak</h1>
            <p>Vue globale du concours, meilleurs chasseurs de points, répartition des scores et ton bilan personnel.</p>
          </div>
          <button className="stats-refresh" onClick={loadStats}>Rafraîchir</button>
        </section>

        <section className="game-overview">
          <article className="leader-card">
            <span className="leader-label">Leader actuel</span>
            {overview.leader ? (
              <>
                <UserAvatar user={overview.leader} size={62} />
                <div>
                  <strong>{overview.leader.username}</strong>
                  <em>{overview.leader.total_points || 0} points</em>
                </div>
              </>
            ) : <strong>À venir</strong>}
          </article>

          <StatPill label="Joueurs" value={overview.totalPlayers} icon="👥" />
          <StatPill label="Joueurs actifs" value={overview.activePlayers} icon="🔥" />
          <StatPill label="Pronos scorés" value={overview.totalScoredPredictions} icon="🎯" />
          <StatPill label="Points distribués" value={overview.totalPoints} icon="💰" featured />
          <StatPill label="Moyenne joueur" value={formatOneDecimal(overview.averagePoints)} icon="📈" />
        </section>

        <section className="stats-layout">
          <div className="main-column">
            <section className="stats-card">
              <div className="stats-card-title">
                <div>
                  <span>Classement parallèle</span>
                  <h2>Les awards du concours</h2>
                </div>
              </div>
              <div className="awards-grid">
                <AwardCard icon="⚽" title="Boss des matchs" user={awards.matchBoss} value={awards.matchBoss?.match_points || 0} />
                <AwardCard icon="🎁" title="Roi du bonus" user={awards.bonusBoss} value={awards.bonusBoss?.bonus_points || 0} />
                <AwardCard icon="⚡" title="Spécialiste J1" user={awards.specialBoss} value={awards.specialBoss?.special_points || 0} />
                <AwardCard icon="🧱" title="Le plus assidu" user={awards.volumeBoss} value={awards.volumeBoss?.matches_predicted || 0} suffix="pronos" />
                <AwardCard icon="🧪" title="Meilleur rendement" user={awards.efficiencyBoss} value={awards.efficiencyBoss ? formatOneDecimal(awards.efficiencyBoss.efficiency) : 0} suffix="pt/match" />
              </div>
            </section>

            <section className="stats-card">
              <div className="stats-card-title">
                <div>
                  <span>Répartition</span>
                  <h2>D'où viennent les points ?</h2>
                </div>
              </div>
              <div className="distribution-list">
                <div className="distribution-row match"><span>⚽ Matchs</span><div><em style={{ width: `${pct(overview.totalMatchPoints, distributionTotal)}%` }} /></div><strong>{overview.totalMatchPoints} pts</strong></div>
                <div className="distribution-row special"><span>⚡ Spéciaux</span><div><em style={{ width: `${pct(overview.totalSpecialPoints, distributionTotal)}%` }} /></div><strong>{overview.totalSpecialPoints} pts</strong></div>
                <div className="distribution-row bonus"><span>🎁 Bonus</span><div><em style={{ width: `${pct(overview.totalBonusPoints, distributionTotal)}%` }} /></div><strong>{overview.totalBonusPoints} pts</strong></div>
              </div>
            </section>

            <section className="stats-card">
              <div className="stats-card-title">
                <div>
                  <span>Top 5</span>
                  <h2>La course en tête</h2>
                </div>
              </div>
              <div className="mini-ranking">
                {topFive.map(user => (
                  <div key={user.id} className={`mini-ranking-row ${Number(user.id) === currentUserId ? 'is-me' : ''}`}>
                    <span>#{user.rank}</span>
                    <UserAvatar user={user} size={34} />
                    <strong>{user.username}</strong>
                    <em>{user.total_points || 0} pts</em>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="side-column">
            <section className="stats-card my-card">
              <div className="my-card-header">
                <UserAvatar user={userDisplay} size={58} />
                <div>
                  <span>Mon bilan</span>
                  <strong>{userDisplay.username}</strong>
                </div>
              </div>
              <div className="personal-grid">
                {personalCards.map(card => <StatPill key={card.label} {...card} />)}
              </div>
              <div className="chase-box">
                {playerAhead ? (
                  <p>Encore <strong>{pointsToNext} point{pointsToNext > 1 ? 's' : ''}</strong> pour dépasser <strong>{playerAhead.username}</strong>.</p>
                ) : (
                  <p>Tu es devant dans ce filtre. Il faut tenir maintenant 😎</p>
                )}
                {playerBehind && <small>{playerBehind.username} est juste derrière avec {playerBehind.total_points || 0} pts.</small>}
              </div>
            </section>

            <section className="stats-card precision-card">
              <div className="stats-card-title compact">
                <div>
                  <span>Personnel</span>
                  <h2>Précision</h2>
                </div>
              </div>
              <div className="precision-list">
                {precisionRows.map(row => (
                  <div className={`precision-row ${row.className}`} key={row.label}>
                    <span className="precision-label"><em>{row.icon}</em>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .stats-page { min-height: 100vh; background: radial-gradient(circle at top left, rgba(217,119,6,.15), transparent 32%), radial-gradient(circle at top right, rgba(15,118,110,.18), transparent 32%), linear-gradient(135deg, #071b16 0%, #0f172a 45%, #111827 100%); padding: 24px 18px 42px; color: ${DARK}; }
  .stats-container { width: min(1220px, 100%); margin: 0 auto; }
  .stats-hero { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; margin-bottom: 16px; color: white; }
  .stats-eyebrow { display: inline-flex; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #fde68a; margin-bottom: 10px; }
  .stats-hero h1 { margin: 0 0 7px; font-size: clamp(30px, 3.6vw, 48px); line-height: 1; letter-spacing: -.05em; }
  .stats-hero p { margin: 0; max-width: 720px; color: rgba(255,255,255,.76); font-size: 14px; line-height: 1.5; }
  .stats-refresh { border: 0; border-radius: 999px; padding: 10px 14px; color: white; background: ${GRADIENT}; font-weight: 950; cursor: pointer; box-shadow: 0 12px 28px rgba(0,0,0,.18); }
  .game-overview { display: grid; grid-template-columns: 1.45fr repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
  .leader-card, .stat-pill, .stats-card { background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); border-radius: 20px; box-shadow: 0 18px 55px rgba(0,0,0,.2); }
  .leader-card { display: flex; align-items: center; gap: 13px; padding: 15px; min-width: 0; }
  .leader-label, .stats-card-title span, .my-card-header span { display: block; color: ${PRIMARY}; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .07em; }
  .leader-card strong, .my-card-header strong { display: block; margin-top: 3px; color: ${DARK}; font-size: 19px; line-height: 1.05; }
  .leader-card em { display: block; margin-top: 4px; color: ${SECONDARY}; font-style: normal; font-size: 13px; font-weight: 950; }
  .stat-pill { display: flex; gap: 10px; align-items: center; padding: 14px; min-height: 90px; }
  .stat-pill > span { width: 38px; height: 38px; border-radius: 14px; display: grid; place-items: center; background: #f1f5f9; font-size: 21px; flex: 0 0 auto; }
  .stat-pill strong { display: block; color: ${DARK}; font-size: 26px; line-height: 1; letter-spacing: -.04em; }
  .stat-pill em { display: block; margin-top: 5px; color: #64748b; font-style: normal; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; }
  .stat-pill.featured { color: white; background: ${GRADIENT}; }
  .stat-pill.featured > span { background: rgba(255,255,255,.16); }
  .stat-pill.featured strong { color: white; }
  .stat-pill.featured em { color: rgba(255,255,255,.76); }
  .stats-layout { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 16px; align-items: start; }
  .main-column, .side-column { display: grid; gap: 16px; }
  .stats-card { padding: 16px; }
  .stats-card-title { display: flex; justify-content: space-between; gap: 12px; align-items: start; margin-bottom: 13px; }
  .stats-card-title h2 { margin: 2px 0 0; color: ${DARK}; font-size: 22px; letter-spacing: -.03em; }
  .stats-card-title.compact h2 { font-size: 19px; }
  .awards-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
  .award-card { display: grid; gap: 10px; min-width: 0; padding: 12px; border-radius: 16px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .award-icon { width: 36px; height: 36px; border-radius: 13px; display: grid; place-items: center; background: white; box-shadow: inset 0 0 0 1px #e2e8f0; font-size: 20px; }
  .award-content > span { display: block; color: #64748b; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 8px; }
  .award-user { display: flex; gap: 9px; align-items: center; min-width: 0; }
  .award-user strong { display: block; color: ${DARK}; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
  .award-user em { display: block; margin-top: 2px; color: ${SECONDARY}; font-style: normal; font-size: 11px; font-weight: 950; }
  .distribution-list { display: grid; gap: 10px; }
  .distribution-row { display: grid; grid-template-columns: 120px minmax(0, 1fr) 80px; gap: 12px; align-items: center; }
  .distribution-row span { color: #334155; font-size: 13px; font-weight: 950; }
  .distribution-row > div { height: 12px; overflow: hidden; border-radius: 999px; background: #e2e8f0; }
  .distribution-row em { display: block; height: 100%; min-width: 4px; border-radius: 999px; background: ${PRIMARY}; }
  .distribution-row.special em { background: #2563eb; }
  .distribution-row.bonus em { background: ${SECONDARY}; }
  .distribution-row strong { color: ${DARK}; text-align: right; font-size: 13px; font-weight: 950; }
  .mini-ranking { display: grid; gap: 8px; }
  .mini-ranking-row { display: grid; grid-template-columns: 42px 34px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 10px; border-radius: 15px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .mini-ranking-row.is-me { background: #ecfdf5; border-color: rgba(15,118,110,.35); }
  .mini-ranking-row > span { display: grid; place-items: center; min-width: 38px; padding: 5px 7px; border-radius: 999px; background: #e2e8f0; color: #334155; font-size: 11px; font-weight: 950; }
  .mini-ranking-row strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${DARK}; font-size: 13px; }
  .mini-ranking-row em { color: ${PRIMARY}; font-style: normal; font-size: 13px; font-weight: 950; }
  .my-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .personal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
  .personal-grid .stat-pill { min-height: 84px; padding: 12px; }
  .chase-box { margin-top: 12px; padding: 12px; border-radius: 16px; background: #fff7ed; border: 1px solid #fed7aa; color: #7c2d12; }
  .chase-box p { margin: 0; font-size: 13px; line-height: 1.4; font-weight: 850; }
  .chase-box small { display: block; margin-top: 6px; color: #9a3412; font-weight: 800; }
  .precision-list { display: grid; gap: 8px; }
  .precision-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 10px 12px; border-radius: 15px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .precision-label { display: inline-flex; align-items: center; gap: 9px; color: #334155; font-size: 12px; font-weight: 900; }
  .precision-label em { width: 31px; height: 31px; display: grid; place-items: center; border-radius: 11px; font-style: normal; font-size: 16px; background: #e2e8f0; }
  .precision-row strong { color: ${SECONDARY}; white-space: nowrap; font-size: 12px; font-weight: 950; }
  .precision-row.exact .precision-label em { background: #dcfce7; }
  .precision-row.difference .precision-label em { background: #e0f2fe; }
  .precision-row.winner .precision-label em { background: #ccfbf1; }
  .precision-row.wrong .precision-label em { background: #fee2e2; }
  @media (max-width: 1180px) { .game-overview { grid-template-columns: repeat(3, minmax(0, 1fr)); } .leader-card { grid-column: span 3; } .stats-layout { grid-template-columns: 1fr; } .side-column { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 900px) { .stats-hero { flex-direction: column; } .awards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .side-column { grid-template-columns: 1fr; } }
  @media (max-width: 620px) { .stats-page { padding: 18px 10px 36px; } .game-overview { grid-template-columns: 1fr; } .leader-card { grid-column: auto; } .awards-grid, .personal-grid { grid-template-columns: 1fr; } .distribution-row { grid-template-columns: 1fr; gap: 6px; } .distribution-row strong { text-align: left; } .mini-ranking-row { grid-template-columns: 38px 34px minmax(0, 1fr); } .mini-ranking-row em { grid-column: 3; } .precision-row { flex-direction: column; align-items: flex-start; } }
`;

export default UserStats;
