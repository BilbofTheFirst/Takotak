import React, { useMemo, useCallback } from 'react';
import { getFlag } from '../utils/countryFlags';

const KNOCKOUT = {
  73: { round: '16e', team1: '2A', team2: '2B' },
  74: { round: '16e', team1: '1E', team2: '3A/B/C/D/F' },
  75: { round: '16e', team1: '1F', team2: '2C' },
  76: { round: '16e', team1: '1C', team2: '2F' },
  77: { round: '16e', team1: '1I', team2: '3C/D/F/G/H' },
  78: { round: '16e', team1: '2E', team2: '2I' },
  79: { round: '16e', team1: '1A', team2: '3C/E/F/H/I' },
  80: { round: '16e', team1: '1L', team2: '3E/H/I/J/K' },
  81: { round: '16e', team1: '1D', team2: '3B/E/F/I/J' },
  82: { round: '16e', team1: '1G', team2: '3A/E/H/I/J' },
  83: { round: '16e', team1: '2K', team2: '2L' },
  84: { round: '16e', team1: '1H', team2: '2J' },
  85: { round: '16e', team1: '1B', team2: '3E/F/G/I/J' },
  86: { round: '16e', team1: '1J', team2: '2H' },
  87: { round: '16e', team1: '1K', team2: '3D/E/I/J/L' },
  88: { round: '16e', team1: '2D', team2: '2G' },
  89: { round: '8e', team1: 'V74', team2: 'V77' },
  90: { round: '8e', team1: 'V73', team2: 'V75' },
  91: { round: '8e', team1: 'V76', team2: 'V78' },
  92: { round: '8e', team1: 'V79', team2: 'V80' },
  93: { round: '8e', team1: 'V83', team2: 'V84' },
  94: { round: '8e', team1: 'V81', team2: 'V82' },
  95: { round: '8e', team1: 'V86', team2: 'V88' },
  96: { round: '8e', team1: 'V85', team2: 'V87' },
  97: { round: 'Quart', team1: 'V89', team2: 'V90' },
  98: { round: 'Quart', team1: 'V93', team2: 'V94' },
  99: { round: 'Quart', team1: 'V91', team2: 'V92' },
  100: { round: 'Quart', team1: 'V95', team2: 'V96' },
  101: { round: 'Demi', team1: 'V97', team2: 'V98' },
  102: { round: 'Demi', team1: 'V99', team2: 'V100' },
  103: { round: '3e place', team1: 'P101', team2: 'P102' },
  104: { round: 'Finale', team1: 'V101', team2: 'V102' }
};

const ROUND_ROWS = {
  73: 1, 74: 3, 75: 5, 76: 7, 77: 9, 78: 11, 79: 13, 80: 15, 81: 17, 82: 19, 83: 21, 84: 23, 85: 25, 86: 27, 87: 29, 88: 31,
  89: 6, 90: 2, 91: 8, 92: 14, 93: 22, 94: 18, 95: 28, 96: 26,
  97: 4, 98: 20, 99: 11, 100: 27,
  101: 12, 102: 24,
  104: 18,
  103: 26
};

function TournamentBracket({ groupsData, allThirdPlaces, koSimulations, onScoreChange, matchSchedule = [] }) {
  const qualifiedThirds = useMemo(() => allThirdPlaces.slice(0, 8), [allThirdPlaces]);
  const scheduleById = useMemo(() => new Map(matchSchedule.map(match => [Number(match.id), match])), [matchSchedule]);

  const getPlacement = useCallback((token) => {
    if (/^[12][A-L]$/.test(token)) {
      const rank = Number(token[0]) - 1;
      const group = token[1];
      return groupsData[group]?.[rank]?.team || token;
    }

    if (/^3[A-L](\/[A-L])+$/.test(token)) {
      const allowed = token.replace('3', '').split('/');
      const resolved = qualifiedThirds.find(team => allowed.includes(team.group));
      return resolved?.team || token;
    }

    return token;
  }, [groupsData, qualifiedThirds]);

  const getWinner = useCallback((matchId) => {
    const sim = koSimulations[matchId];
    if (!sim || sim.team1_goals === undefined || sim.team2_goals === undefined) return null;
    if (Number(sim.team1_goals) === Number(sim.team2_goals)) return null;
    return Number(sim.team1_goals) > Number(sim.team2_goals) ? 'team1' : 'team2';
  }, [koSimulations]);

  const getLoser = useCallback((matchId) => {
    const winner = getWinner(matchId);
    if (!winner) return null;
    return winner === 'team1' ? 'team2' : 'team1';
  }, [getWinner]);

  const matches = useMemo(() => {
    const map = {};
    Object.entries(KNOCKOUT).forEach(([id, config]) => {
      map[id] = { id: Number(id), ...config, team1Name: getPlacement(config.team1), team2Name: getPlacement(config.team2) };
    });

    const resolveToken = (token) => {
      if (/^[VP]\d+$/.test(token)) {
        const sourceId = Number(token.slice(1));
        const source = map[sourceId];
        if (!source) return token;
        const side = token[0] === 'V' ? getWinner(sourceId) : getLoser(sourceId);
        if (!side) return token;
        return side === 'team1' ? source.team1Name : source.team2Name;
      }
      return getPlacement(token);
    };

    Object.keys(map).map(Number).sort((a, b) => a - b).forEach(id => {
      map[id].team1Name = resolveToken(map[id].team1);
      map[id].team2Name = resolveToken(map[id].team2);
      const schedule = scheduleById.get(id);
      map[id].start_time = schedule?.start_time || null;
    });

    return map;
  }, [getPlacement, getWinner, getLoser, scheduleById]);

  const rounds = [
    { title: '16es', ids: Array.from({ length: 16 }, (_, index) => 73 + index), col: 1 },
    { title: '8es', ids: Array.from({ length: 8 }, (_, index) => 89 + index), col: 2 },
    { title: 'Quarts', ids: [97, 98, 99, 100], col: 3 },
    { title: 'Demies', ids: [101, 102], col: 4 },
    { title: 'Finale', ids: [104, 103], col: 5 }
  ];

  const renderFlag = (team) => {
    if (!team || /^[123VP]/.test(team)) return <span className="bracket-placeholder-ball">⚽</span>;
    const flag = getFlag(team);
    return flag ? <img className="bracket-flag" src={flag} alt={team} /> : <span className="bracket-placeholder-ball">?</span>;
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    return `${value.substring(8, 10)}/${value.substring(5, 7)} ${value.substring(11, 16)}`;
  };

  const MatchCard = ({ match }) => {
    const sim = koSimulations[match.id] || { team1_goals: 0, team2_goals: 0 };
    const winner = getWinner(match.id);

    const renderTeam = (side, teamName) => (
      <div className={`bracket-team ${winner === side ? 'winner' : ''}`}>
        {renderFlag(teamName)}
        <span className={/^[123VP]/.test(teamName || '') ? 'placeholder' : ''}>{teamName || 'À définir'}</span>
        <input type="text" inputMode="numeric" maxLength="2" value={side === 'team1' ? sim.team1_goals : sim.team2_goals} onChange={(event) => onScoreChange(match.id, `${side}_goals`, event.target.value)} />
      </div>
    );

    return (
      <article className={`bracket-match ${match.id === 103 ? 'third-place-match' : ''}`} style={{ gridColumn: match.column, gridRow: ROUND_ROWS[match.id] }}>
        <header>
          <div><span>{match.round}</span>{match.start_time && <em>{formatDateTime(match.start_time)}</em>}</div>
          <strong>M{match.id}</strong>
        </header>
        {renderTeam('team1', match.team1Name)}
        {renderTeam('team2', match.team2Name)}
      </article>
    );
  };

  return (
    <section className="simulation-section knockout-section">
      <div className="simulation-section-title"><span>🏆 Phase éliminatoire</span><h2>Tableau final simulé</h2></div>
      <div className="bracket-scroll">
        <div className="bracket-board">
          {rounds.map(round => <h3 key={round.title} className="round-title" style={{ gridColumn: round.col }}>{round.title}</h3>)}
          {rounds.flatMap(round => round.ids.map(id => <MatchCard key={id} match={{ ...matches[id], column: round.col }} />))}
        </div>
      </div>
      <style>{`
        .knockout-section { margin-top: 30px; }
        .bracket-scroll { overflow-x: auto; border-radius: 22px; background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); box-shadow: 0 18px 55px rgba(0,0,0,.2); padding: 18px; }
        .bracket-board { min-width: 1380px; display: grid; grid-template-columns: 300px 270px 245px 230px 230px; grid-template-rows: 44px repeat(32, 36px); gap: 7px 18px; align-items: center; }
        .round-title { margin: 0; padding: 10px 12px; border-radius: 14px; color: white; background: linear-gradient(135deg, #0f766e, #d97706); font-size: 13px; text-transform: uppercase; letter-spacing: .06em; text-align: center; align-self: start; }
        .bracket-match { overflow: hidden; border-radius: 16px; background: #f8fafc; border: 1px solid #e2e8f0; box-shadow: 0 10px 24px rgba(15,23,42,.08); }
        .bracket-match header { display: flex; justify-content: space-between; align-items: center; padding: 7px 9px; background: #ecfdf5; color: #047857; font-size: 10px; font-weight: 950; text-transform: uppercase; }
        .bracket-match header div { display: flex; flex-direction: column; gap: 1px; }
        .bracket-match header em { color: #64748b; font-size: 9px; font-style: normal; font-weight: 850; }
        .bracket-match header strong { padding: 3px 6px; border-radius: 999px; background: #fff7ed; color: #c2410c; }
        .third-place-match header { background: #fff7ed; color: #92400e; }
        .bracket-team { display: grid; grid-template-columns: 26px minmax(0,1fr) 34px; gap: 7px; align-items: center; padding: 8px 9px; border-top: 1px solid #e2e8f0; }
        .bracket-team.winner { background: #dcfce7; }
        .bracket-flag, .bracket-placeholder-ball { width: 25px; height: 25px; border-radius: 999px; object-fit: cover; display: grid; place-items: center; background: #e2e8f0; border: 2px solid white; box-shadow: 0 4px 11px rgba(15,23,42,.13); font-size: 14px; }
        .bracket-team span:not(.bracket-placeholder-ball) { min-width: 0; overflow: visible; text-overflow: unset; white-space: normal; color: #0f172a; font-size: 12px; font-weight: 950; line-height: 1.15; }
        .bracket-team .placeholder { color: #64748b !important; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px !important; }
        .bracket-team input { width: 34px; height: 28px; border: 1.5px solid #cbd5e1; border-radius: 9px; text-align: center; font-size: 12px; font-weight: 950; }
      `}</style>
    </section>
  );
}

export default TournamentBracket;
