import React, { useEffect, useMemo, useState } from 'react';
import { statsService } from '../services/api';
import PageLoader from '../components/PageLoader';
import UserAvatar from '../components/UserAvatar';

const PRIMARY = '#0f766e';
const SECONDARY = '#d97706';
const DARK = '#0f172a';
const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;

const TABS = [
  { value: 'overview', label: 'Vue d’ensemble', icon: '📊' },
  { value: 'rankings', label: 'Classements', icon: '🏆' },
  { value: 'badges', label: 'Badges', icon: '🎖️' },
  { value: 'community', label: 'Communauté', icon: '👥' },
  { value: 'me', label: 'Moi', icon: '🧑' }
];

const RANKING_CONFIGS = [
  { key: 'total_points', title: 'Classement général', value: 'total_points', suffix: 'pts' },
  { key: 'exact_scores', title: 'Scores exacts', value: 'exact_scores', suffix: 'scores exacts' },
  { key: 'correct_differences', title: 'Bonnes différences', value: 'correct_differences', suffix: 'différences' },
  { key: 'correct_winners', title: 'Bons vainqueurs', value: 'correct_winners', suffix: 'bons résultats' },
  { key: 'draw_hits', title: 'Roi du nul', value: 'draw_hits', suffix: 'nuls trouvés' },
  { key: 'best_streak', title: 'Meilleure série', value: 'best_streak', suffix: 'matchs' },
  { key: 'efficiency', title: 'Rendement', value: 'efficiency', suffix: 'pt/match' },
  { key: 'bonus_points', title: 'Bonus', value: 'bonus_points', suffix: 'pts' },
  { key: 'special_points', title: 'Spéciaux J1', value: 'special_points', suffix: 'pts' },
  { key: 'total_predictions', title: 'Assiduité', value: 'total_predictions', suffix: 'pronos' }
];

const BADGE_DEFINITIONS = [
  { code: 'sniper', icon: '🎯', title: 'Sniper', description: 'Au moins 3 scores exacts.' },
  { code: 'hot_streak', icon: '🔥', title: 'Série chaude', description: 'Au moins 3 matchs consécutifs avec points.' },
  { code: 'draw_king', icon: '🤝', title: 'Roi du nul', description: 'Au moins 2 matchs nuls bien lus.' },
  { code: 'assidu', icon: '🧱', title: 'Assidu', description: 'Présent sur tous les matchs scorés.' },
  { code: 'strategist', icon: '🎁', title: 'Stratège', description: 'Des points marqués via les bonus.' },
  { code: 'specialist', icon: '⚡', title: 'Spécialiste', description: 'Des points marqués sur les pronostics spéciaux.' },
  { code: 'podium', icon: '🏆', title: 'Podium', description: 'Dans le top 3 du classement général.' }
];

const number = (value) => Number(value || 0);
const pct = (value, total) => total > 0 ? Math.round((number(value) / total) * 100) : 0;
const formatValue = (value) => Number(value || 0).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');

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

function FunCard({ icon, label, value, detail }) {
  return (
    <article className="fun-card">
      <span>{icon}</span>
      <div>
        <em>{label}</em>
        <strong title={value}>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </article>
  );
}

function AwardCard({ award }) {
  const displayedWinner = award.winner || award.winners?.[0];
  const isTie = award.status === 'tie';

  return (
    <article className={`award-card ${isTie ? 'is-tie' : ''}`} title={award.definition}>
      <div className="award-icon">{award.icon}</div>
      <div className="award-content">
        <span>{award.title} <b className="info-dot">?</b></span>
        {isTie ? (
          <div className="award-tie">
            <strong>Égalité entre {award.tie_count || 0} joueurs</strong>
            <em>{formatValue(award.value)} {award.unit}</em>
          </div>
        ) : displayedWinner ? (
          <div className="award-user">
            <UserAvatar user={displayedWinner} size={34} />
            <div>
              <strong>{displayedWinner.username}</strong>
              <em>{formatValue(award.value)} {award.unit}</em>
            </div>
          </div>
        ) : <strong>À venir</strong>}
      </div>
    </article>
  );
}

function RankingBlock({ title, rows = [], valueKey, suffix }) {
  return (
    <section className="stats-card ranking-block">
      <div className="stats-card-title compact"><h2>{title}</h2></div>
      <div className="mini-ranking">
        {rows.slice(0, 5).map((user, index) => (
          <div key={`${title}-${user.id}`} className="mini-ranking-row">
            <span>#{index + 1}</span>
            <UserAvatar user={user} size={32} />
            <strong>{user.username}</strong>
            <em>{formatValue(user[valueKey])} {suffix}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function UserStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await statsService.getOverview();
      setData(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const overview = data?.overview || {};
  const me = data?.me || null;
  const awards = data?.awards || [];
  const rankings = data?.rankings || {};
  const community = data?.community || {};
  const badgeUsers = data?.badges?.users || [];
  const rawBadgeCatalog = data?.badges?.catalog || [];
  const badgeCatalog = BADGE_DEFINITIONS.map(definition => {
    const earned = rawBadgeCatalog.find(badge => badge.code === definition.code);
    return { ...definition, ...(earned || {}), count: earned?.count || 0 };
  });
  const topFive = rankings.total_points?.slice(0, 5) || [];
  const distributionTotal = number(overview.total_match_points) + number(overview.total_special_points) + number(overview.total_bonus_points);

  if (loading) return <PageLoader title="Chargement des stats..." icon="📊" subtitle="Analyse du jeu et des performances" />;
  if (!data) return <div className="stats-page"><div className="stats-container"><div className="stats-card">Pas de stats pour le moment</div></div><style>{styles}</style></div>;

  const personalCards = [
    { label: 'Mes points', value: me?.total_points || 0, icon: '🏆', featured: true },
    { label: 'Mon rang', value: me?.rank ? `#${me.rank}` : '-', icon: '🥇' },
    { label: 'Scores exacts', value: me?.exact_scores || 0, icon: '🎯' },
    { label: 'Meilleure série', value: me?.best_streak || 0, icon: '🔥' }
  ];

  return (
    <div className="stats-page">
      <div className="stats-container">
        <section className="stats-hero">
          <div>
            <span className="stats-eyebrow">Stats du jeu</span>
            <h1>📊 Le tableau de bord Takotak</h1>
            <p>Vue globale, classements secondaires, badges, stats communauté et ton bilan personnel.</p>
          </div>
          <button className="stats-refresh" onClick={loadStats}>Rafraîchir</button>
        </section>

        <nav className="stats-tabs" aria-label="Sections statistiques">
          {TABS.map(tab => (
            <button key={tab.value} type="button" className={activeTab === tab.value ? 'active' : ''} onClick={() => setActiveTab(tab.value)}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'overview' && (
          <>
            <section className="game-overview">
              <article className="leader-card">
                <span className="leader-label">Leader actuel</span>
                {overview.leader ? <><UserAvatar user={overview.leader} size={62} /><div><strong>{overview.leader.username}</strong><em>{overview.leader.total_points || 0} points</em></div></> : <strong>À venir</strong>}
              </article>
              <StatPill label="Joueurs" value={overview.total_players || 0} icon="👥" />
              <StatPill label="Joueurs actifs" value={overview.active_players || 0} icon="🔥" />
              <StatPill label="Matchs finis" value={overview.finished_matches || 0} icon="⚽" />
              <StatPill label="Points distribués" value={overview.total_points || 0} icon="💰" featured />
              <StatPill label="Moyenne joueur" value={formatValue(overview.average_points_per_player)} icon="📈" />
            </section>

            <section className="stats-layout">
              <div className="main-column">
                <section className="stats-card">
                  <div className="stats-card-title"><div><span>Classement parallèle</span><h2>Les awards du concours</h2></div></div>
                  <div className="awards-grid">{awards.map(award => <AwardCard key={award.code} award={award} />)}</div>
                </section>
                <section className="stats-card">
                  <div className="stats-card-title"><div><span>Répartition</span><h2>D'où viennent les points ?</h2></div></div>
                  <div className="distribution-list">
                    <div className="distribution-row match"><span>⚽ Matchs</span><div><em style={{ width: `${pct(overview.total_match_points, distributionTotal)}%` }} /></div><strong>{overview.total_match_points || 0} pts</strong></div>
                    <div className="distribution-row special"><span>⚡ Spéciaux</span><div><em style={{ width: `${pct(overview.total_special_points, distributionTotal)}%` }} /></div><strong>{overview.total_special_points || 0} pts</strong></div>
                    <div className="distribution-row bonus"><span>🎁 Bonus</span><div><em style={{ width: `${pct(overview.total_bonus_points, distributionTotal)}%` }} /></div><strong>{overview.total_bonus_points || 0} pts</strong></div>
                  </div>
                </section>
              </div>
              <aside className="side-column single">
                <section className="stats-card">
                  <div className="stats-card-title"><div><span>Top 5</span><h2>La course en tête</h2></div></div>
                  <div className="mini-ranking">
                    {topFive.map((user, index) => <div key={user.id} className="mini-ranking-row"><span>#{index + 1}</span><UserAvatar user={user} size={34} /><strong>{user.username}</strong><em>{user.total_points || 0} pts</em></div>)}
                  </div>
                </section>
              </aside>
            </section>
          </>
        )}

        {activeTab === 'rankings' && (
          <section className="ranking-grid">
            {RANKING_CONFIGS.map(config => <RankingBlock key={config.key} title={config.title} rows={rankings[config.key] || []} valueKey={config.value} suffix={config.suffix} />)}
          </section>
        )}

        {activeTab === 'badges' && (
          <section className="stats-layout">
            <div className="main-column">
              <section className="stats-card">
                <div className="stats-card-title"><div><span>Catalogue</span><h2>Badges disponibles</h2></div></div>
                <div className="badge-catalog">
                  {badgeCatalog.map(badge => <div key={badge.code} className={`badge-chip ${badge.count === 0 ? 'is-locked' : ''}`} title={badge.description}><span>{badge.icon}</span><strong>{badge.title}</strong><em>{badge.count > 0 ? `${badge.count} joueur${badge.count > 1 ? 's' : ''}` : '0 joueur'}</em></div>)}
                </div>
              </section>
            </div>
            <aside className="side-column single">
              <section className="stats-card">
                <div className="stats-card-title"><div><span>Joueurs</span><h2>Badges par joueur</h2></div></div>
                <div className="player-badges-list">
                  {badgeUsers.map(user => <div key={user.id} className="player-badges-row"><UserAvatar user={user} size={34} /><strong>{user.username}</strong><div>{user.badges?.length ? user.badges.map(badge => <span key={badge.code} title={badge.description}>{badge.icon}</span>) : <em>Aucun</em>}</div></div>)}
                </div>
              </section>
            </aside>
          </section>
        )}

        {activeTab === 'community' && (
          <section className="stats-layout">
            <div className="main-column">
              <section className="stats-card">
                <div className="stats-card-title"><div><span>Stats fun</span><h2>La communauté en chiffres</h2></div></div>
                <div className="fun-grid">
                  <FunCard icon="🔮" label="Score le plus joué" value={community.most_predicted_score?.score || '-'} detail={community.most_predicted_score ? `${community.most_predicted_score.count} fois pronostiqué` : 'Aucun prono analysé'} />
                  <FunCard icon="💀" label="Match le plus dur" value={community.hardest_match?.label || '-'} detail={community.hardest_match ? `${formatValue(community.hardest_match.average_points)} pt de moyenne · résultat ${community.hardest_match.result}` : 'Aucun match terminé'} />
                  <FunCard icon="😎" label="Match le plus facile" value={community.easiest_match?.label || '-'} detail={community.easiest_match ? `${formatValue(community.easiest_match.average_points)} pt de moyenne · résultat ${community.easiest_match.result}` : 'Aucun match terminé'} />
                </div>
              </section>
              <section className="stats-card">
                <div className="stats-card-title"><div><span>Par match</span><h2>Réactions de la communauté</h2></div></div>
                <div className="community-list">
                  {(community.recent_matches || []).map(match => <div key={match.match_id} className="community-row"><div><strong>{match.label}</strong><span>Résultat {match.result} · {match.total_predictions} pronos · score le plus joué : {match.most_predicted_score?.score || '-'}</span></div><em>{match.exact_count} exacts · {match.average_points} pt moy.</em></div>)}
                </div>
              </section>
            </div>
          </section>
        )}

        {activeTab === 'me' && (
          <section className="stats-layout">
            <div className="main-column">
              <section className="stats-card my-card">
                <div className="my-card-header"><UserAvatar user={me} size={58} /><div><span>Mon bilan</span><strong>{me?.username || 'Moi'}</strong></div></div>
                <div className="personal-grid">{personalCards.map(card => <StatPill key={card.label} {...card} />)}</div>
                <div className="chase-box">{me?.player_ahead ? <p>Encore <strong>{me.points_to_next_rank} point{me.points_to_next_rank > 1 ? 's' : ''}</strong> pour dépasser <strong>{me.player_ahead.username}</strong>.</p> : <p>Tu es devant dans ce filtre. Il faut tenir maintenant 😎</p>}{me?.player_behind && <small>{me.player_behind.username} est juste derrière avec {me.player_behind.total_points || 0} pts.</small>}</div>
              </section>
              <section className="stats-card">
                <div className="stats-card-title"><div><span>Ce que tu fais bien / mal</span><h2>Lecture perso</h2></div></div>
                <div className="insight-list">{(me?.insights || []).map(insight => <div key={insight.title} className={`insight-row ${insight.type}`}><span>{insight.icon}</span><div><strong>{insight.title}</strong><em>{insight.text}</em></div></div>)}</div>
              </section>
            </div>
            <aside className="side-column single"><section className="stats-card"><div className="stats-card-title"><div><span>Mes badges</span><h2>Collection</h2></div></div><div className="badge-catalog">{me?.badges?.length ? me.badges.map(badge => <div key={badge.code} className="badge-chip"><span>{badge.icon}</span><strong>{badge.title}</strong><em>{badge.description}</em></div>) : <p className="empty-note">Aucun badge pour le moment.</p>}</div></section></aside>
          </section>
        )}
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
  .stats-tabs { display: flex; gap: 8px; flex-wrap: wrap; padding: 8px; margin-bottom: 16px; border-radius: 18px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); }
  .stats-tabs button { border: 0; border-radius: 999px; padding: 9px 12px; display: inline-flex; gap: 7px; align-items: center; color: rgba(255,255,255,.78); background: rgba(255,255,255,.08); font-size: 12px; font-weight: 950; cursor: pointer; }
  .stats-tabs button.active { color: #0f172a; background: white; box-shadow: 0 10px 24px rgba(0,0,0,.18); }
  .game-overview { display: grid; grid-template-columns: 1.45fr repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
  .leader-card, .stat-pill, .fun-card, .stats-card { background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); border-radius: 20px; box-shadow: 0 18px 55px rgba(0,0,0,.2); }
  .leader-card { display: flex; align-items: center; gap: 13px; padding: 15px; min-width: 0; }
  .leader-label, .stats-card-title span, .my-card-header span { display: block; color: ${PRIMARY}; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .07em; }
  .leader-card strong, .my-card-header strong { display: block; margin-top: 3px; color: ${DARK}; font-size: 19px; line-height: 1.05; }
  .leader-card em, .award-user em, .award-tie em { display: block; margin-top: 4px; color: ${SECONDARY}; font-style: normal; font-size: 12px; font-weight: 950; }
  .stat-pill, .fun-card { display: flex; gap: 10px; align-items: center; padding: 14px; min-height: 90px; }
  .stat-pill > span, .fun-card > span { width: 38px; height: 38px; border-radius: 14px; display: grid; place-items: center; background: #f1f5f9; font-size: 21px; flex: 0 0 auto; }
  .stat-pill strong { display: block; color: ${DARK}; font-size: 25px; line-height: 1; letter-spacing: -.04em; }
  .stat-pill em { display: block; margin-top: 5px; color: #64748b; font-style: normal; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; }
  .fun-card { min-width: 0; }
  .fun-card em { display: block; color: #64748b; font-style: normal; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; }
  .fun-card strong { display: block; margin-top: 4px; color: ${DARK}; font-size: 18px; line-height: 1.05; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
  .fun-card small { display: block; margin-top: 5px; color: ${SECONDARY}; font-size: 11px; font-weight: 950; }
  .stat-pill.featured { color: white; background: ${GRADIENT}; }
  .stat-pill.featured > span { background: rgba(255,255,255,.16); }
  .stat-pill.featured strong { color: white; }
  .stat-pill.featured em { color: rgba(255,255,255,.76); }
  .stats-layout { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 16px; align-items: start; }
  .main-column, .side-column { display: grid; gap: 16px; }
  .side-column.single { grid-template-columns: 1fr; }
  .stats-card { padding: 16px; }
  .stats-card-title { display: flex; justify-content: space-between; gap: 12px; align-items: start; margin-bottom: 13px; }
  .stats-card-title h2 { margin: 2px 0 0; color: ${DARK}; font-size: 22px; letter-spacing: -.03em; }
  .stats-card-title.compact h2 { font-size: 17px; margin-bottom: 0; }
  .awards-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; }
  .award-card { display: grid; gap: 10px; min-width: 0; padding: 12px; border-radius: 16px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .award-card.is-tie { background: #fff7ed; border-color: #fed7aa; }
  .award-icon { width: 36px; height: 36px; border-radius: 13px; display: grid; place-items: center; background: white; box-shadow: inset 0 0 0 1px #e2e8f0; font-size: 20px; }
  .award-content > span { display: block; color: #64748b; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 8px; }
  .info-dot { display: inline-grid; place-items: center; width: 15px; height: 15px; border-radius: 999px; background: #e2e8f0; color: #334155; font-size: 10px; }
  .award-user { display: flex; gap: 9px; align-items: center; min-width: 0; }
  .award-user strong, .award-tie strong { display: block; color: ${DARK}; font-size: 13px; }
  .distribution-list, .mini-ranking, .community-list, .player-badges-list, .insight-list { display: grid; gap: 9px; }
  .distribution-row { display: grid; grid-template-columns: 120px minmax(0, 1fr) 80px; gap: 12px; align-items: center; }
  .distribution-row span { color: #334155; font-size: 13px; font-weight: 950; }
  .distribution-row > div { height: 12px; overflow: hidden; border-radius: 999px; background: #e2e8f0; }
  .distribution-row em { display: block; height: 100%; min-width: 4px; border-radius: 999px; background: ${PRIMARY}; }
  .distribution-row.special em { background: #2563eb; }
  .distribution-row.bonus em { background: ${SECONDARY}; }
  .distribution-row strong { color: ${DARK}; text-align: right; font-size: 13px; font-weight: 950; }
  .ranking-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .mini-ranking-row, .community-row, .player-badges-row, .insight-row { display: grid; align-items: center; gap: 10px; padding: 10px; border-radius: 15px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .mini-ranking-row { grid-template-columns: 42px 34px minmax(0, 1fr) auto; }
  .mini-ranking-row > span { display: grid; place-items: center; min-width: 38px; padding: 5px 7px; border-radius: 999px; background: #e2e8f0; color: #334155; font-size: 11px; font-weight: 950; }
  .mini-ranking-row strong, .community-row strong, .player-badges-row strong, .insight-row strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${DARK}; font-size: 13px; }
  .mini-ranking-row em, .community-row em, .player-badges-row em, .insight-row em { color: ${PRIMARY}; font-style: normal; font-size: 12px; font-weight: 900; }
  .fun-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .community-row { grid-template-columns: minmax(0, 1fr) auto; }
  .community-row span { display: block; color: #64748b; font-size: 11px; font-weight: 850; margin-top: 2px; }
  .badge-catalog { display: flex; flex-wrap: wrap; gap: 10px; }
  .badge-chip { display: inline-grid; grid-template-columns: 34px minmax(0, 1fr); gap: 2px 9px; align-items: center; padding: 10px 12px; border-radius: 16px; background: #f8fafc; border: 1px solid #e2e8f0; min-width: 190px; }
  .badge-chip.is-locked { opacity: .68; background: #f1f5f9; }
  .badge-chip > span { grid-row: span 2; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 12px; background: white; font-size: 18px; }
  .badge-chip strong { color: ${DARK}; font-size: 13px; }
  .badge-chip em { color: #64748b; font-style: normal; font-size: 11px; font-weight: 850; }
  .player-badges-row { grid-template-columns: 34px minmax(0, 1fr) auto; }
  .player-badges-row div { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
  .player-badges-row div span { width: 27px; height: 27px; display: grid; place-items: center; border-radius: 999px; background: #fff7ed; border: 1px solid #fed7aa; }
  .my-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .personal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
  .personal-grid .stat-pill { min-height: 84px; padding: 12px; }
  .chase-box { margin-top: 12px; padding: 12px; border-radius: 16px; background: #fff7ed; border: 1px solid #fed7aa; color: #7c2d12; }
  .chase-box p { margin: 0; font-size: 13px; line-height: 1.4; font-weight: 850; }
  .chase-box small { display: block; margin-top: 6px; color: #9a3412; font-weight: 800; }
  .insight-row { grid-template-columns: 42px minmax(0, 1fr); }
  .insight-row > span { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 14px; background: white; font-size: 20px; }
  .insight-row.good { background: #ecfdf5; border-color: #bbf7d0; }
  .insight-row.warning { background: #fff7ed; border-color: #fed7aa; }
  .empty-note { color: #64748b; font-weight: 850; }
  @media (max-width: 1180px) { .game-overview { grid-template-columns: repeat(3, minmax(0, 1fr)); } .leader-card { grid-column: span 3; } .stats-layout { grid-template-columns: 1fr; } .awards-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (max-width: 900px) { .stats-hero { flex-direction: column; } .ranking-grid, .fun-grid { grid-template-columns: 1fr; } .awards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 620px) { .stats-page { padding: 18px 10px 36px; } .game-overview { grid-template-columns: 1fr; } .leader-card { grid-column: auto; } .awards-grid, .personal-grid { grid-template-columns: 1fr; } .distribution-row, .community-row { grid-template-columns: 1fr; gap: 6px; } .distribution-row strong { text-align: left; } .mini-ranking-row { grid-template-columns: 38px 34px minmax(0, 1fr); } .mini-ranking-row em { grid-column: 3; } }
`;

export default UserStats;
