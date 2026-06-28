import React, { useEffect, useMemo, useState } from 'react';
import { buildApiAssetUrl, resultsService } from '../services/api';
import PageLoader from '../components/PageLoader';
import UserAvatar from '../components/UserAvatar';

const PRIMARY = '#0f766e';
const SECONDARY = '#d97706';
const DARK = '#0f172a';
const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;
const CHART_COLORS = ['#0f766e', '#d97706', '#2563eb', '#db2777', '#7c3aed', '#16a34a', '#dc2626', '#0891b2', '#475569', '#ea580c'];

const getTrendConfig = (trend) => {
  if (trend > 0) return { label: `+${trend}`, icon: '▲', className: 'trend-up' };
  if (trend < 0) return { label: `${trend}`, icon: '▼', className: 'trend-down' };
  return { label: '0', icon: '•', className: 'trend-flat' };
};

const getUniqueNumbers = (values) => [...new Set(values)].filter(value => Number.isFinite(Number(value))).map(Number).sort((a, b) => a - b);

const buildProgressionTicks = (values) => {
  const uniqueValues = getUniqueNumbers(values);
  if (uniqueValues.length <= 9) return uniqueValues;
  const lastIndex = uniqueValues.length - 1;
  const sampledIndexes = getUniqueNumbers([0, 0.25, 0.5, 0.75, 1].map(ratio => Math.round(lastIndex * ratio)));
  return sampledIndexes.map(index => uniqueValues[index]);
};

const formatProgressionTick = (value, labelsByNumber) => labelsByNumber?.get(Number(value)) || (Number(value) === 0 ? 'Départ' : `M${value}`);

const getDefaultChartUsers = (rankedUsers, chartMode, currentUserId) => {
  const base = chartMode === 'all' ? rankedUsers : rankedUsers.slice(0, chartMode === 'top5' ? 5 : 8);
  const merged = [...base];
  if (currentUserId && !merged.some(item => Number(item.id) === currentUserId)) {
    const me = rankedUsers.find(user => Number(user.id) === currentUserId);
    if (me) merged.push(me);
  }
  return merged;
};

const buildAvatarMarkerItems = (series) => {
  const groupedByFinalPosition = new Map();
  series.forEach(user => {
    const lastPoint = user.data[user.data.length - 1];
    if (!lastPoint) return;
    const key = `${Number(lastPoint.match_number || 0)}:${Number(lastPoint.points || 0)}`;
    if (!groupedByFinalPosition.has(key)) groupedByFinalPosition.set(key, []);
    groupedByFinalPosition.get(key).push({ user, lastPoint });
  });

  return Array.from(groupedByFinalPosition.values()).flatMap(group => {
    const maxPerRow = 4;
    const spacing = 30;
    const rowSpacing = 30;
    return group.map((item, index) => {
      const row = Math.floor(index / maxPerRow);
      const rowStart = row * maxPerRow;
      const itemsInRow = Math.min(maxPerRow, group.length - rowStart);
      const positionInRow = index - rowStart;
      return { ...item, offset: { x: (positionInRow - (itemsInRow - 1) / 2) * spacing, y: row * rowSpacing } };
    });
  });
};

const getMilestoneKey = (label = '') => {
  const normalized = String(label).toLowerCase();
  if (normalized.includes('j1')) return 'j1';
  if (normalized.includes('j2')) return 'j2';
  if (normalized.includes('j3')) return 'j3';
  if (normalized.includes('16es')) return 'round32';
  if (normalized.includes('total')) return 'total';
  return null;
};

function ScoreProgressionChart({ progression, rankedUsers, currentUser, chartMode, setChartMode, selectedUserIds, hiddenUserIds, toggleChartUser, clearChartOverrides }) {
  const usersById = useMemo(() => new Map((progression?.users || []).map(user => [Number(user.id), user])), [progression]);
  const currentUserId = Number(currentUser?.id || 0);
  const hiddenIds = useMemo(() => new Set(hiddenUserIds.map(Number)), [hiddenUserIds]);

  const milestoneMarkers = useMemo(() => {
    const byKey = new Map();

    (progression?.matches || []).forEach(match => {
      const key = getMilestoneKey(match.label);
      if (key) byKey.set(key, { key, label: match.label, match_number: Number(match.match_number) });
    });

    (progression?.users || []).forEach(user => {
      (user.series || []).forEach(point => {
        const key = getMilestoneKey(point.label);
        if (!key || byKey.has(key)) return;
        byKey.set(key, { key, label: point.label, match_number: Number(point.match_number) });
      });
    });

    return [...byKey.values()].filter(marker => Number.isFinite(marker.match_number)).sort((a, b) => a.match_number - b.match_number);
  }, [progression]);

  const matchLabelsByNumber = useMemo(() => {
    const map = new Map((progression?.matches || []).filter(match => match.label).map(match => [Number(match.match_number), match.label]));
    milestoneMarkers.forEach(marker => map.set(Number(marker.match_number), marker.label));
    return map;
  }, [milestoneMarkers, progression]);

  const chartUsers = useMemo(() => {
    const selected = rankedUsers.filter(user => selectedUserIds.includes(Number(user.id)));
    const merged = getDefaultChartUsers(rankedUsers, chartMode, currentUserId);
    selected.forEach(user => {
      if (!merged.some(item => Number(item.id) === Number(user.id))) merged.push(user);
    });
    return merged.filter(user => !hiddenIds.has(Number(user.id)));
  }, [rankedUsers, selectedUserIds, hiddenIds, chartMode, currentUserId]);

  const xValues = useMemo(() => {
    const matchNumbers = (progression?.matches || []).map(match => Number(match.match_number)).filter(value => Number.isFinite(value));
    return getUniqueNumbers([0, ...matchNumbers, ...milestoneMarkers.map(marker => marker.match_number)]);
  }, [milestoneMarkers, progression]);

  const globalMinX = 0;
  const globalMaxX = Math.max(1, ...xValues);

  const series = chartUsers
    .map((user, index) => ({
      ...user,
      isMe: Number(user.id) === currentUserId,
      color: CHART_COLORS[index % CHART_COLORS.length],
      data: usersById.get(Number(user.id))?.series || []
    }))
    .filter(user => user.data.length > 0);

  const xAxisTicks = useMemo(() => buildProgressionTicks(xValues), [xValues]);
  const maxY = Math.max(3, ...series.flatMap(user => user.data.map(point => Number(point.points || 0))));
  const width = 950;
  const height = 340;
  const padLeft = 44;
  const padRight = 116;
  const padTop = 34;
  const padBottom = 42;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;
  const xFor = (value) => padLeft + ((Number(value || 0) - globalMinX) / Math.max(1, globalMaxX - globalMinX)) * chartWidth;
  const yFor = (value) => padTop + chartHeight - (Number(value || 0) / maxY) * chartHeight;
  const hasOverrides = selectedUserIds.length > 0 || hiddenUserIds.length > 0;
  const avatarMarkerItems = buildAvatarMarkerItems(series);

  const renderAvatarMarker = (user, lastPoint, offset = { x: 0, y: 0 }) => {
    if (!lastPoint) return null;
    const cx = xFor(lastPoint.match_number) + offset.x;
    const cy = yFor(lastPoint.points) + offset.y;
    const size = user.isMe ? 30 : 26;
    const radius = size / 2;
    const avatarUrl = buildApiAssetUrl(user.avatar_url);
    const initials = (user.username || '?').trim().slice(0, 2).toUpperCase();
    const clipId = `progression-avatar-clip-${user.id}`;

    return (
      <g key={`avatar-${user.id}`} className="chart-avatar-marker">
        <title>{user.username}</title>
        <circle cx={cx} cy={cy} r={radius + 5} fill="white" opacity="0.98" />
        <circle cx={cx} cy={cy} r={radius + 2} fill="white" stroke={user.color} strokeWidth="3" />
        {avatarUrl ? (
          <>
            <defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse"><circle cx={cx} cy={cy} r={radius} /></clipPath></defs>
            <image href={avatarUrl} x={cx - radius} y={cy - radius} width={size} height={size} clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" />
          </>
        ) : (
          <>
            <circle cx={cx} cy={cy} r={radius} fill="#e2e8f0" />
            <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize="9" fontWeight="900" fill="#0f172a">{initials}</text>
          </>
        )}
      </g>
    );
  };

  if (!series.length) return <div className="empty-chart">Le graphique apparaîtra dès que des résultats seront encodés.</div>;

  return (
    <div className="chart-card">
      <div className="chart-header"><div><span>📈 Progression</span><h2>Évolution des scores</h2></div><p>{series.length} courbe{series.length > 1 ? 's' : ''} affichée{series.length > 1 ? 's' : ''}. Les repères indiquent les journées et les points spéciaux/bonus.</p></div>
      <div className="chart-controls"><button type="button" className={chartMode === 'top5' ? 'active' : ''} onClick={() => setChartMode('top5')}>Top 5</button><button type="button" className={chartMode === 'top8' ? 'active' : ''} onClick={() => setChartMode('top8')}>Top 8</button><button type="button" className={chartMode === 'all' ? 'active' : ''} onClick={() => setChartMode('all')}>Tous</button>{hasOverrides && <button type="button" className="ghost" onClick={clearChartOverrides}>Réinitialiser l’affichage</button>}</div>
      <div className="chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} className="progression-chart" role="img" aria-label="Graphique d'évolution des scores">
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => { const y = padTop + chartHeight - ratio * chartHeight; const value = Math.round(maxY * ratio); return <g key={ratio}><line x1={padLeft} y1={y} x2={width - padRight} y2={y} className="chart-grid" /><text x={padLeft - 10} y={y + 4} className="chart-axis-label" textAnchor="end">{value}</text></g>; })}
        {milestoneMarkers.map(marker => { const x = xFor(marker.match_number); return <g key={`marker-${marker.key}`}><line x1={x} y1={padTop - 12} x2={x} y2={padTop + chartHeight} className="chart-marker-line" /><text x={x + 4} y={padTop - 16} className="chart-marker-label">{marker.label}</text></g>; })}
        {xAxisTicks.map(matchNumber => { const x = xFor(matchNumber); return <g key={`x-${matchNumber}`}><line x1={x} y1={padTop} x2={x} y2={padTop + chartHeight} className="chart-grid soft" /><text x={x} y={height - 14} className="chart-axis-label" textAnchor="middle">{formatProgressionTick(matchNumber, matchLabelsByNumber)}</text></g>; })}
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartHeight} className="chart-axis" />
        <line x1={padLeft} y1={padTop + chartHeight} x2={width - padRight} y2={padTop + chartHeight} className="chart-axis" />
        {series.map(user => { const points = user.data.map(point => `${xFor(point.match_number)},${yFor(point.points)}`).join(' '); return <g key={user.id} className={user.isMe ? 'my-chart-line' : ''}><polyline points={points} fill="none" stroke={user.color} strokeWidth={user.isMe ? '5.5' : '3.5'} strokeLinecap="round" strokeLinejoin="round" opacity={user.isMe ? '1' : '.82'} /></g>; })}
        {avatarMarkerItems.map(({ user, lastPoint, offset }) => renderAvatarMarker(user, lastPoint, offset))}
      </svg></div>
      <div className="chart-legend">{series.map(user => <button key={user.id} type="button" className={`legend-item ${user.isMe ? 'is-me' : ''}`} onClick={() => toggleChartUser(user.id)} title="Retirer du graphique"><span style={{ background: user.color }} /><strong>{user.username}{user.isMe ? ' · moi' : ''}</strong></button>)}</div>
    </div>
  );
}

function PodiumPerson({ user, place }) {
  if (!user) return <div className={`podium-person place-${place} empty`} />;
  const labels = { 1: 'Champion provisoire', 2: 'Deuxième', 3: 'Troisième' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className={`podium-person place-${place}`}>
      <div className="podium-character"><div className="podium-head"><UserAvatar user={user} size={58} /></div><div className="podium-body"><span className="podium-arm left" /><span className="podium-torso" /><span className="podium-arm right" /></div></div>
      <div className="podium-label"><span>{medals[place]} {labels[place]}</span><strong>{user.username}</strong><em>{user.total_points || 0} pts</em></div>
      <div className="podium-step"><strong>{place}</strong></div>
    </div>
  );
}

function Rankings({ currentUser }) {
  const [rankings, setRankings] = useState([]);
  const [progression, setProgression] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('top8');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [hiddenUserIds, setHiddenUserIds] = useState([]);
  const currentUserId = Number(currentUser?.id || 0);

  useEffect(() => { loadRankings(); }, []);

  const loadRankings = async () => {
    try {
      const [rankingRes, progressionRes] = await Promise.all([resultsService.getLeaderboard(), resultsService.getLeaderboardProgression()]);
      setRankings(rankingRes.data || []);
      setProgression(progressionRes.data || null);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const defaultChartUserIds = useMemo(() => new Set(getDefaultChartUsers(rankings, chartMode, currentUserId).map(user => Number(user.id))), [rankings, chartMode, currentUserId]);

  const visibleChartUserIds = useMemo(() => {
    const hidden = new Set(hiddenUserIds.map(Number));
    const visible = new Set([...defaultChartUserIds].filter(id => !hidden.has(id)));
    selectedUserIds.forEach(id => {
      const numericId = Number(id);
      if (!hidden.has(numericId)) visible.add(numericId);
    });
    return visible;
  }, [defaultChartUserIds, selectedUserIds, hiddenUserIds]);

  const toggleChartUser = (userId) => {
    const id = Number(userId);
    if (hiddenUserIds.includes(id)) { setHiddenUserIds(prev => prev.filter(item => item !== id)); return; }
    if (selectedUserIds.includes(id)) { setSelectedUserIds(prev => prev.filter(item => item !== id)); return; }
    if (defaultChartUserIds.has(id)) { setHiddenUserIds(prev => [...prev, id]); return; }
    setSelectedUserIds(prev => [...prev, id]);
  };

  const clearChartOverrides = () => {
    setSelectedUserIds([]);
    setHiddenUserIds([]);
  };

  const topThree = rankings.slice(0, 3);
  const leader = topThree[0];
  const totalPlayers = rankings.length;
  const totalPredictions = rankings.reduce((sum, user) => sum + Number(user.matches_predicted || 0), 0);
  const totalPoints = rankings.reduce((sum, user) => sum + Number(user.total_points || 0), 0);

  if (loading) return <PageLoader title="Chargement du classement..." icon="🏆" subtitle="Calcul des points et des bonus" />;

  return (
    <div className="rankings-page"><div className="rankings-container">
      <section className="rankings-hero"><div><span className="rankings-eyebrow">Course au trophée</span><h1>🏆 Classement général</h1><p>Le tableau de chasse des pronostiqueurs : points de matchs, bonus, dynamique et progression globale.</p></div><div className="rankings-summary"><div><strong>{totalPlayers}</strong><span>joueurs</span></div><div><strong>{totalPredictions}</strong><span>pronos scorés</span></div><div><strong>{totalPoints}</strong><span>points distribués</span></div></div></section>
      <section className="podium-card"><div className="podium-title"><span>🎖️ Top 3</span><h2>{leader ? `${leader.username} mène la danse` : 'Le podium arrive bientôt'}</h2></div><div className="podium-stage"><PodiumPerson user={topThree[1]} place={2} /><PodiumPerson user={topThree[0]} place={1} /><PodiumPerson user={topThree[2]} place={3} /></div></section>
      <section className="ranking-table-card">
        <div className="table-title"><div><span>📋 Tous les joueurs</span><h2>Classement détaillé</h2></div><p>Les lignes surlignées sont affichées dans le graphique. Les colonnes J1, J2, J3 et 16es détaillent les points des pronostics spéciaux.</p></div>
        <div className="ranking-table-wrap"><table className="ranking-table"><thead><tr><th>Rang</th><th>Tendance</th><th>Joueur</th><th>Total</th><th>Matchs</th><th>Bonus</th><th>J1</th><th>J2</th><th>J3</th><th>16es</th><th>Pronos</th></tr></thead><tbody>{rankings.map((user, idx) => { const trend = getTrendConfig(Number(user.trend || 0)); const userId = Number(user.id); const isDisplayedInChart = visibleChartUserIds.has(userId); const isHiddenFromChart = hiddenUserIds.includes(userId); const isMe = userId === currentUserId; return <tr key={user.id} className={`${idx < 3 ? `top-row top-${idx + 1}` : ''} ${isDisplayedInChart ? 'chart-selected-row' : ''} ${isHiddenFromChart ? 'chart-hidden-row' : ''} ${isMe ? 'me-row' : ''}`} onClick={() => toggleChartUser(user.id)} title={isDisplayedInChart ? 'Retirer du graphique' : 'Ajouter au graphique'}><td><span className="rank-pill">#{user.rank || idx + 1}</span></td><td><span className={`trend-pill ${trend.className}`}><b>{trend.icon}</b>{trend.label}</span></td><td><div className="player-cell"><UserAvatar user={user} size={38} /><div><strong>{user.username}{isMe ? ' · moi' : ''}</strong><span>{isDisplayedInChart ? 'Affiché dans le graphique' : isHiddenFromChart ? 'Masqué du graphique' : 'Cliquer pour afficher'}</span></div></div></td><td><strong className="total-score">{user.total_points || 0}</strong></td><td>{user.match_points || 0}</td><td>{user.bonus_points || 0}</td><td><span className="special-day-score">{user.special_j1_points || 0}</span></td><td><span className="special-day-score">{user.special_j2_points || 0}</span></td><td><span className="special-day-score">{user.special_j3_points || 0}</span></td><td><span className="special-day-score">{user.special_round32_points || 0}</span></td><td>{user.matches_predicted || 0}</td></tr>; })}</tbody></table></div>
      </section>
      <ScoreProgressionChart progression={progression} rankedUsers={rankings} currentUser={currentUser} chartMode={chartMode} setChartMode={setChartMode} selectedUserIds={selectedUserIds} hiddenUserIds={hiddenUserIds} toggleChartUser={toggleChartUser} clearChartOverrides={clearChartOverrides} />
    </div><style>{styles}</style></div>
  );
}

const styles = `
  .rankings-page { min-height: 100vh; background: radial-gradient(circle at top left, rgba(217,119,6,.18), transparent 32%), radial-gradient(circle at top right, rgba(15,118,110,.2), transparent 34%), linear-gradient(135deg, #071b16 0%, #0f172a 45%, #111827 100%); padding: 24px 18px 42px; color: ${DARK}; }
  .rankings-container { width: min(1220px, 100%); margin: 0 auto; }
  .rankings-hero { display: flex; justify-content: space-between; align-items: stretch; gap: 22px; margin-bottom: 18px; color: white; }
  .podium-title span, .table-title span, .chart-header span { display: inline-flex; color: #0f766e; font-size: 11px; font-weight: 950; text-transform: uppercase; letter-spacing: .08em; }
  .rankings-eyebrow { display: inline-flex; color: #fde68a; font-size: 11px; font-weight: 950; text-transform: uppercase; letter-spacing: .08em; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); margin-bottom: 10px; }
  .rankings-hero h1 { margin: 0 0 7px; font-size: clamp(30px, 3.6vw, 48px); line-height: 1; letter-spacing: -.05em; }
  .rankings-hero p { margin: 0; max-width: 680px; color: rgba(255,255,255,.76); font-size: 14px; line-height: 1.5; }
  .rankings-summary { min-width: 360px; display: grid; grid-template-columns: repeat(3, minmax(86px, 1fr)); gap: 9px; }
  .rankings-summary div { padding: 13px; border-radius: 16px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); box-shadow: 0 16px 38px rgba(0,0,0,.16); }
  .rankings-summary strong { display: block; color: #fde68a; font-size: 26px; line-height: 1; }
  .rankings-summary span { display: block; margin-top: 6px; color: rgba(255,255,255,.72); font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; }
  .podium-card, .ranking-table-card, .chart-card { margin-bottom: 18px; border-radius: 22px; background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); box-shadow: 0 18px 55px rgba(0,0,0,.2); overflow: hidden; }
  .podium-title, .table-title, .chart-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 16px 18px; background: linear-gradient(135deg, rgba(15,118,110,.08), rgba(217,119,6,.08)); border-bottom: 1px solid #e2e8f0; }
  .podium-title h2, .table-title h2, .chart-header h2 { margin: 4px 0 0; font-size: 23px; letter-spacing: -.04em; }
  .table-title p, .chart-header p { margin: 0; max-width: 450px; color: #64748b; font-size: 12px; font-weight: 800; line-height: 1.45; }
  .podium-stage { min-height: 288px; display: grid; grid-template-columns: repeat(3, minmax(160px, 215px)); justify-content: center; align-items: end; gap: 8px; padding: 20px 18px 16px; background: radial-gradient(circle at center top, rgba(251,191,36,.18), transparent 34%), linear-gradient(180deg, #ffffff, #f8fafc); }
  .podium-person { display: grid; justify-items: center; gap: 7px; align-items: end; }
  .place-1 { transform: translateY(-12px); } .place-2 { transform: translateY(12px); } .place-3 { transform: translateY(24px); }
  .podium-character { display: grid; justify-items: center; gap: 0; position: relative; z-index: 2; }
  .podium-head { padding: 4px; border-radius: 999px; background: white; box-shadow: 0 8px 22px rgba(15,23,42,.16); }
  .place-1 .podium-head { box-shadow: 0 0 0 3px rgba(251,191,36,.32), 0 12px 28px rgba(15,23,42,.18); }
  .podium-body { position: relative; width: 70px; height: 58px; display: grid; place-items: center; }
  .podium-torso { width: 42px; height: 50px; border-radius: 20px 20px 14px 14px; background: ${GRADIENT}; box-shadow: inset 0 -8px 14px rgba(0,0,0,.14); }
  .podium-arm { position: absolute; top: 11px; width: 13px; height: 38px; border-radius: 999px; background: #d97706; }
  .podium-arm.left { left: 7px; transform: rotate(18deg); } .podium-arm.right { right: 7px; transform: rotate(-18deg); }
  .podium-label { text-align: center; max-width: 190px; }
  .podium-label span { display: block; color: #64748b; font-size: 9px; font-weight: 950; text-transform: uppercase; letter-spacing: .05em; }
  .podium-label strong { display: block; margin-top: 3px; color: #0f172a; font-size: 14px; line-height: 1.05; }
  .podium-label em { display: block; margin-top: 4px; color: #0f766e; font-style: normal; font-size: 13px; font-weight: 950; }
  .podium-step { width: 100%; max-width: 215px; display: grid; place-items: center; border-radius: 16px 16px 8px 8px; color: white; background: ${GRADIENT}; box-shadow: 0 12px 26px rgba(15,23,42,.16); }
  .podium-step strong { font-size: 30px; line-height: 1; padding: 18px 0; }
  .place-1 .podium-step strong { padding: 32px 0; font-size: 38px; } .place-3 .podium-step strong { padding: 14px 0; }
  .ranking-table-wrap { overflow-x: auto; }
  .ranking-table { width: 100%; border-collapse: collapse; min-width: 1120px; }
  .ranking-table th { padding: 12px 14px; color: #64748b; background: #f8fafc; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; text-align: left; border-bottom: 1px solid #e2e8f0; }
  .ranking-table td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 850; }
  .ranking-table tr { cursor: pointer; transition: background .15s ease, box-shadow .15s ease; }
  .ranking-table tr:hover td { background: #f8fafc; }
  .top-row { background: linear-gradient(90deg, rgba(254,243,199,.55), rgba(255,255,255,.95)); }
  .chart-selected-row td { background: #ccfbf1 !important; box-shadow: inset 0 -1px 0 rgba(15,118,110,.22); }
  .chart-selected-row .player-cell strong::after { content: ' ✓'; color: #0f766e; font-weight: 950; }
  .chart-hidden-row td { opacity: .62; background: #f8fafc !important; }
  .me-row td { box-shadow: inset 3px 0 0 #0f766e; }
  .rank-pill { display: inline-flex; min-width: 44px; justify-content: center; padding: 6px 8px; border-radius: 999px; background: #e2e8f0; color: #334155; font-weight: 950; }
  .top-1 .rank-pill { background: #fef3c7; color: #92400e; } .top-2 .rank-pill { background: #e0f2fe; color: #0369a1; } .top-3 .rank-pill { background: #ffedd5; color: #c2410c; }
  .trend-pill { display: inline-flex; align-items: center; gap: 5px; min-width: 54px; justify-content: center; padding: 6px 8px; border-radius: 999px; font-size: 11px; font-weight: 950; }
  .trend-up { background: #dcfce7; color: #047857; } .trend-down { background: #fee2e2; color: #b91c1c; } .trend-flat { background: #f1f5f9; color: #64748b; }
  .player-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .player-cell strong { display: block; font-size: 14px; }
  .player-cell span { display: block; margin-top: 2px; color: #64748b; font-size: 10px; font-weight: 800; }
  .total-score { color: #0f766e; font-size: 18px; }
  .special-day-score { display: inline-flex; min-width: 28px; justify-content: center; padding: 4px 7px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-weight: 950; }
  .chart-controls { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 18px 0; }
  .chart-controls button { border: 1px solid #cbd5e1; border-radius: 999px; background: white; color: #334155; padding: 7px 11px; font-size: 11px; font-weight: 950; cursor: pointer; }
  .chart-controls button.active { background: #0f766e; border-color: #0f766e; color: white; }
  .chart-controls button.ghost { margin-left: auto; color: #b91c1c; border-color: #fecaca; background: #fff1f2; }
  .chart-card { padding-bottom: 16px; }
  .chart-scroll { overflow-x: auto; padding: 12px 18px 4px; }
  .progression-chart { width: 100%; min-width: 760px; display: block; overflow: visible; }
  .chart-grid { stroke: #e2e8f0; stroke-width: 1; } .chart-grid.soft { stroke: #f1f5f9; } .chart-axis { stroke: #94a3b8; stroke-width: 1.2; } .chart-axis-label { fill: #64748b; font-size: 10px; font-weight: 800; }
  .chart-marker-line { stroke: #d97706; stroke-width: 1.8; stroke-dasharray: 5 5; opacity: .72; }
  .chart-marker-label { fill: #92400e; font-size: 10px; font-weight: 950; text-transform: uppercase; paint-order: stroke; stroke: white; stroke-width: 3px; stroke-linejoin: round; }
  .chart-avatar-marker { filter: drop-shadow(0 4px 8px rgba(15,23,42,.24)); pointer-events: none; }
  .my-chart-line { filter: drop-shadow(0 3px 6px rgba(15,118,110,.28)); }
  .chart-legend { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 18px; }
  .legend-item { display: inline-flex; align-items: center; gap: 7px; padding: 6px 9px; border-radius: 999px; background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; font-size: 11px; cursor: pointer; }
  .legend-item.is-me { border-color: #0f766e; background: #ecfdf5; color: #065f46; }
  .legend-item span { width: 10px; height: 10px; border-radius: 999px; }
  .empty-chart { padding: 28px 18px; color: #64748b; font-weight: 850; text-align: center; }
  @media (max-width: 920px) { .rankings-hero { flex-direction: column; } .rankings-summary { min-width: 0; } .podium-stage { grid-template-columns: 1fr; min-height: 0; gap: 12px; } .place-1, .place-2, .place-3 { transform: none; } .podium-person { grid-template-columns: 84px 1fr; grid-template-areas: 'character label' 'step step'; justify-items: start; align-items: center; } .podium-character { grid-area: character; } .podium-label { grid-area: label; text-align: left; } .podium-step { grid-area: step; max-width: none; } .podium-step strong, .place-1 .podium-step strong, .place-3 .podium-step strong { padding: 10px 0; font-size: 24px; } .podium-title, .table-title, .chart-header { flex-direction: column; } }
  @media (max-width: 560px) { .rankings-page { padding: 18px 10px 36px; } .rankings-summary { grid-template-columns: 1fr; } .podium-title, .table-title, .chart-header { padding: 14px; } .podium-stage { padding: 16px 12px; } .podium-person { grid-template-columns: 74px 1fr; } .podium-head .user-avatar { width: 50px !important; height: 50px !important; min-width: 50px !important; } .podium-body { width: 62px; height: 50px; } .podium-torso { width: 36px; height: 42px; } .podium-arm { height: 32px; width: 11px; } .chart-scroll { padding: 10px; } .chart-controls button.ghost { margin-left: 0; } }
`;

export default Rankings;
