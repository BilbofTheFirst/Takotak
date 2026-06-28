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

const COLUMN_TITLES = [
  { col: 1, label: '16es' },
  { col: 2, label: '8es' },
  { col: 3, label: 'Quarts' },
  { col: 4, label: 'Demies' },
  { col: 5, label: 'Finales' },
  { col: 6, label: 'Demies' },
  { col: 7, label: 'Quarts' },
  { col: 8, label: '8es' },
  { col: 9, label: '16es' }
];

const BRACKET_LAYOUT = [
  { id: 74, col: 1, row: 2 }, { id: 77, col: 1, row: 5 }, { id: 73, col: 1, row: 8 }, { id: 75, col: 1, row: 11 },
  { id: 89, col: 2, row: 4 }, { id: 90, col: 2, row: 10 }, { id: 97, col: 3, row: 7 },

  { id: 76, col: 9, row: 2 }, { id: 78, col: 9, row: 5 }, { id: 79, col: 9, row: 8 }, { id: 80, col: 9, row: 11 },
  { id: 91, col: 8, row: 4 }, { id: 92, col: 8, row: 10 }, { id: 99, col: 7, row: 7 },

  { id: 83, col: 1, row: 14 }, { id: 84, col: 1, row: 17 }, { id: 81, col: 1, row: 20 }, { id: 82, col: 1, row: 23 },
  { id: 93, col: 2, row: 16 }, { id: 94, col: 2, row: 22 }, { id: 98, col: 3, row: 19 },

  { id: 86, col: 9, row: 14 }, { id: 88, col: 9, row: 17 }, { id: 85, col: 9, row: 20 }, { id: 87, col: 9, row: 23 },
  { id: 95, col: 8, row: 16 }, { id: 96, col: 8, row: 22 }, { id: 100, col: 7, row: 19 },

  { id: 101, col: 4, row: 13 }, { id: 102, col: 6, row: 13 },
  { id: 104, col: 5, row: 12 }, { id: 103, col: 5, row: 16 }
];

const THIRD_PLACE_TOKEN_REGEX = /^3[A-L](\/[A-L])+$/;
const FIRST_KNOCKOUT_IDS = new Set(Array.from({ length: 16 }, (_, index) => 73 + index));

const isBracketToken = (value) => {
  if (!value || typeof value !== 'string') return false;
  return /^[12][A-L]$/.test(value) || THIRD_PLACE_TOKEN_REGEX.test(value) || /^[VP]\d+$/.test(value);
};

const getThirdPlaceTokenAllowedGroups = (token) => token.replace('3', '').split('/');

function TournamentBracket({
  groupsData,
  allThirdPlaces,
  koSimulations,
  onScoreChange,
  matchSchedule = [],
  lockedRealMatchIds = new Set(),
  useOfficialKnockoutEntrants = false
}) {
  const qualifiedThirds = useMemo(() => allThirdPlaces.slice(0, 8), [allThirdPlaces]);
  const scheduleById = useMemo(() => new Map(matchSchedule.map(match => [Number(match.id), match])), [matchSchedule]);
  const shouldUseOfficialKnockoutEntrants = useOfficialKnockoutEntrants || lockedRealMatchIds.size > 0;

  const thirdPlaceAssignments = useMemo(() => {
    const tokens = Object.values(KNOCKOUT).flatMap(config => [config.team1, config.team2]).filter(token => THIRD_PLACE_TOKEN_REGEX.test(token));
    const slots = [...new Set(tokens)].map((token, index) => ({ token, index, allowedGroups: getThirdPlaceTokenAllowedGroups(token) }));
    const qualifiedGroups = new Set(qualifiedThirds.map(team => team.group));
    const orderedSlots = [...slots].sort((a, b) => {
      const aCandidates = a.allowedGroups.filter(group => qualifiedGroups.has(group)).length;
      const bCandidates = b.allowedGroups.filter(group => qualifiedGroups.has(group)).length;
      return aCandidates - bCandidates || a.index - b.index;
    });
    const assignment = {};
    const usedGroups = new Set();

    const solve = (slotIndex) => {
      if (slotIndex >= orderedSlots.length) return true;
      const slot = orderedSlots[slotIndex];
      const candidates = qualifiedThirds.filter(team => slot.allowedGroups.includes(team.group) && !usedGroups.has(team.group));
      for (const candidate of candidates) {
        assignment[slot.token] = candidate;
        usedGroups.add(candidate.group);
        if (solve(slotIndex + 1)) return true;
        usedGroups.delete(candidate.group);
        delete assignment[slot.token];
      }
      return false;
    };

    if (solve(0)) return assignment;

    const fallbackAssignment = {};
    const fallbackUsedGroups = new Set();
    slots.forEach(slot => {
      const candidate = qualifiedThirds.find(team => slot.allowedGroups.includes(team.group) && !fallbackUsedGroups.has(team.group));
      if (candidate) {
        fallbackAssignment[slot.token] = candidate;
        fallbackUsedGroups.add(candidate.group);
      }
    });
    return fallbackAssignment;
  }, [qualifiedThirds]);

  const getPlacement = useCallback((token) => {
    if (/^[12][A-L]$/.test(token)) {
      const rank = Number(token[0]) - 1;
      const group = token[1];
      return groupsData[group]?.[rank]?.team || token;
    }

    if (THIRD_PLACE_TOKEN_REGEX.test(token)) return thirdPlaceAssignments[token]?.team || token;
    return token;
  }, [groupsData, thirdPlaceAssignments]);

  const getWinner = useCallback((matchId) => {
    const sim = koSimulations[matchId];
    if (!sim || sim.team1_goals === undefined || sim.team2_goals === undefined) return null;
    if (Number(sim.team1_goals) === Number(sim.team2_goals)) return sim.winner || null;
    return Number(sim.team1_goals) > Number(sim.team2_goals) ? 'team1' : 'team2';
  }, [koSimulations]);

  const getLoser = useCallback((matchId) => {
    const winner = getWinner(matchId);
    if (!winner) return null;
    return winner === 'team1' ? 'team2' : 'team1';
  }, [getWinner]);

  const getOfficialEntrantNames = useCallback((matchId) => {
    if (!shouldUseOfficialKnockoutEntrants || !FIRST_KNOCKOUT_IDS.has(Number(matchId))) return null;
    const scheduled = scheduleById.get(Number(matchId));
    if (!scheduled?.team1 || !scheduled?.team2) return null;
    return { team1Name: scheduled.team1, team2Name: scheduled.team2 };
  }, [scheduleById, shouldUseOfficialKnockoutEntrants]);

  const matches = useMemo(() => {
    const map = {};
    Object.entries(KNOCKOUT).forEach(([id, config]) => {
      const officialEntrants = getOfficialEntrantNames(Number(id));
      map[id] = {
        id: Number(id),
        ...config,
        team1Name: officialEntrants?.team1Name || getPlacement(config.team1),
        team2Name: officialEntrants?.team2Name || getPlacement(config.team2),
        officialEntrants: Boolean(officialEntrants)
      };
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
      if (!map[id].officialEntrants) {
        map[id].team1Name = resolveToken(map[id].team1);
        map[id].team2Name = resolveToken(map[id].team2);
      }
      map[id].start_time = scheduleById.get(id)?.start_time || null;
    });
    return map;
  }, [getOfficialEntrantNames, getPlacement, getWinner, getLoser, scheduleById]);

  const renderFlag = (team) => {
    if (!team || isBracketToken(team)) return <span className="bracket-token" title={team || 'À définir'}>{team || '⚽'}</span>;
    const flag = getFlag(team);
    return flag ? <img className="bracket-flag" src={flag} alt={team} title={team} /> : <span className="bracket-token" title={team}>?</span>;
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    return `${value.substring(8, 10)}/${value.substring(5, 7)} ${value.substring(11, 16)}`;
  };

  const selectScoreText = (event) => event.currentTarget.select();

  const MatchCard = ({ match, col, row }) => {
    const sim = koSimulations[match.id] || { team1_goals: 0, team2_goals: 0 };
    const winner = getWinner(match.id);
    const isDraw = Number(sim.team1_goals) === Number(sim.team2_goals);
    const isRealLocked = lockedRealMatchIds.has(Number(match.id));
    const canChooseWinner = !isRealLocked && isDraw && !isBracketToken(match.team1Name) && !isBracketToken(match.team2Name);

    const renderWinnerFlag = (side, teamName) => (
      <button
        type="button"
        className={`team-flag-slot ${winner === side ? 'winner' : ''} ${canChooseWinner ? 'winner-selectable' : ''}`}
        disabled={!canChooseWinner}
        aria-pressed={canChooseWinner ? winner === side : undefined}
        aria-label={canChooseWinner ? `Qualifie ${teamName}` : teamName || 'À définir'}
        title={isRealLocked ? 'Résultat réel verrouillé dans la simulation' : canChooseWinner ? `Cliquer pour qualifier ${teamName}` : teamName || 'À définir'}
        onClick={() => onScoreChange(match.id, 'winner', side)}
      >
        {renderFlag(teamName)}
      </button>
    );

    return (
      <article className={`compact-bracket-match ${match.id === 103 ? 'third-place-match' : ''} ${canChooseWinner ? 'draw-needs-winner' : ''} ${isRealLocked ? 'real-knockout-result' : ''}`} style={{ gridColumn: col, gridRow: `${row} / span 2` }} title={`${match.round} M${match.id} — ${match.team1Name} vs ${match.team2Name}`}>
        <header><span>{match.round}</span>{match.start_time && <em>{formatDateTime(match.start_time)}</em>}<strong>{isRealLocked ? 'Réel' : match.officialEntrants ? 'Officiel' : `M${match.id}`}</strong></header>
        <div className="compact-scoreline">
          {renderWinnerFlag('team1', match.team1Name)}
          <input type="text" inputMode="numeric" maxLength="2" value={sim.team1_goals} disabled={isRealLocked} aria-label={`Score ${match.team1Name || 'équipe 1'}`} title={match.team1Name || 'Équipe 1'} onFocus={selectScoreText} onChange={(event) => onScoreChange(match.id, 'team1_goals', event.target.value)} />
          <span className="score-dash">-</span>
          <input type="text" inputMode="numeric" maxLength="2" value={sim.team2_goals} disabled={isRealLocked} aria-label={`Score ${match.team2Name || 'équipe 2'}`} title={match.team2Name || 'Équipe 2'} onFocus={selectScoreText} onChange={(event) => onScoreChange(match.id, 'team2_goals', event.target.value)} />
          {renderWinnerFlag('team2', match.team2Name)}
        </div>
      </article>
    );
  };

  const champion = getWinner(104) ? (getWinner(104) === 'team1' ? matches[104].team1Name : matches[104].team2Name) : 'À définir';

  return (
    <section className="simulation-section knockout-section">
      <div className="simulation-section-title"><span>🏆 Phase éliminatoire</span><h2>Tableau final simulé</h2></div>
      <div className="compact-bracket-scroll"><div className="compact-bracket-board">
        {COLUMN_TITLES.map(title => <div key={`${title.col}-${title.label}`} className="compact-round-title" style={{ gridColumn: title.col, gridRow: 1 }}>{title.label}</div>)}
        {BRACKET_LAYOUT.map(item => <MatchCard key={item.id} match={matches[item.id]} col={item.col} row={item.row} />)}
        <div className="compact-champion" style={{ gridColumn: 5, gridRow: '19 / span 4' }} title={champion}><span>🏆</span><strong>{champion}</strong></div>
      </div></div>

      <style>{`
        .knockout-section { margin-top: 30px; }
        .compact-bracket-scroll { overflow-x: auto; border-radius: 22px; background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); box-shadow: 0 18px 55px rgba(0,0,0,.2); padding: 14px; }
        .compact-bracket-board { width: 100%; min-width: 1320px; display: grid; grid-template-columns: repeat(9, minmax(132px, 1fr)); grid-template-rows: 32px repeat(25, 31px); column-gap: clamp(8px, .9vw, 14px); row-gap: 5px; align-items: center; }
        .compact-round-title { align-self: stretch; display: grid; place-items: center; border-radius: 13px; color: white; background: linear-gradient(135deg, #0f766e, #d97706); font-size: 11px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; white-space: nowrap; }
        .compact-bracket-match { align-self: stretch; overflow: hidden; border-radius: 14px; border: 1px solid #e2e8f0; background: #f8fafc; box-shadow: 0 8px 18px rgba(15,23,42,.08); }
        .compact-bracket-match.real-knockout-result { background: #ecfdf5; border-color: #bbf7d0; }
        .compact-bracket-match.draw-needs-winner { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,.16); }
        .compact-bracket-match header { height: 24px; display: grid; grid-template-columns: 1fr auto auto; gap: 4px; align-items: center; padding: 3px 6px; color: white; background: #0f172a; }
        .compact-bracket-match.real-knockout-result header { background: #0f766e; }
        .compact-bracket-match header span { font-size: 9px; font-weight: 950; text-transform: uppercase; letter-spacing: .04em; }
        .compact-bracket-match header em { font-size: 8px; font-style: normal; opacity: .72; }
        .compact-bracket-match header strong { font-size: 9px; color: #fde68a; }
        .compact-scoreline { height: calc(100% - 24px); display: grid; grid-template-columns: 24px 28px 8px 28px 24px; gap: 3px; align-items: center; justify-content: center; padding: 4px 5px; }
        .team-flag-slot { width: 24px; height: 24px; border: 0; padding: 0; border-radius: 999px; background: transparent; display: grid; place-items: center; }
        .team-flag-slot.winner { box-shadow: 0 0 0 3px #fbbf24; }
        .team-flag-slot.winner-selectable { cursor: pointer; }
        .bracket-flag { width: 22px; height: 22px; border-radius: 999px; object-fit: cover; border: 2px solid white; box-shadow: 0 4px 10px rgba(15,23,42,.18); }
        .bracket-token { width: 22px; height: 22px; display: grid; place-items: center; border-radius: 999px; background: #e2e8f0; color: #334155; font-size: 8px; font-weight: 950; }
        .compact-scoreline input { width: 28px; height: 24px; border: 1.3px solid #cbd5e1; border-radius: 8px; text-align: center; color: #0f172a; background: white; font-size: 12px; font-weight: 950; outline: none; }
        .compact-scoreline input:disabled { color: #047857; border-color: #bbf7d0; background: white; }
        .score-dash { color: #94a3b8; font-size: 11px; font-weight: 950; text-align: center; }
        .compact-champion { align-self: center; justify-self: stretch; min-height: 86px; display: grid; place-items: center; gap: 6px; border-radius: 18px; color: white; background: linear-gradient(135deg, #d97706, #0f766e); box-shadow: 0 16px 35px rgba(15,23,42,.24); text-align: center; padding: 10px; }
        .compact-champion span { font-size: 28px; }
        .compact-champion strong { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; }
        .third-place-match { opacity: .9; }
      `}</style>
    </section>
  );
}

export default TournamentBracket;
