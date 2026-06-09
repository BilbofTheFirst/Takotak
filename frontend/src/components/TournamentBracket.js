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
  { col: 5, label: 'Finale' },
  { col: 6, label: 'Demies' },
  { col: 7, label: 'Quarts' },
  { col: 8, label: '8es' },
  { col: 9, label: '16es' }
];

const BRACKET_LAYOUT = [
  // Left wing. Each child is placed between its two parents.
  { id: 74, col: 1, row: 2 },
  { id: 77, col: 1, row: 5 },
  { id: 73, col: 1, row: 8 },
  { id: 75, col: 1, row: 11 },
  { id: 76, col: 1, row: 14 },
  { id: 78, col: 1, row: 17 },
  { id: 79, col: 1, row: 20 },
  { id: 80, col: 1, row: 23 },
  { id: 89, col: 2, row: 4 },
  { id: 90, col: 2, row: 10 },
  { id: 91, col: 2, row: 16 },
  { id: 92, col: 2, row: 22 },
  { id: 97, col: 3, row: 7 },
  { id: 99, col: 3, row: 19 },

  // Semi-finals in the middle left/right columns.
  { id: 101, col: 4, row: 10 },
  { id: 102, col: 6, row: 19 },

  // Center.
  { id: 104, col: 5, row: 14 },
  { id: 103, col: 5, row: 22 },

  // Right wing.
  { id: 83, col: 9, row: 2 },
  { id: 84, col: 9, row: 5 },
  { id: 81, col: 9, row: 8 },
  { id: 82, col: 9, row: 11 },
  { id: 86, col: 9, row: 14 },
  { id: 88, col: 9, row: 17 },
  { id: 85, col: 9, row: 20 },
  { id: 87, col: 9, row: 23 },
  { id: 93, col: 8, row: 4 },
  { id: 94, col: 8, row: 10 },
  { id: 95, col: 8, row: 16 },
  { id: 96, col: 8, row: 22 },
  { id: 98, col: 7, row: 7 },
  { id: 100, col: 7, row: 19 }
];

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
      map[id] = {
        id: Number(id),
        ...config,
        team1Name: getPlacement(config.team1),
        team2Name: getPlacement(config.team2)
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
      map[id].team1Name = resolveToken(map[id].team1);
      map[id].team2Name = resolveToken(map[id].team2);
      map[id].start_time = scheduleById.get(id)?.start_time || null;
    });

    return map;
  }, [getPlacement, getWinner, getLoser, scheduleById]);

  const renderFlag = (team) => {
    if (!team || /^[123VP]/.test(team)) {
      return <span className="bracket-token" title={team || 'À définir'}>{team || '⚽'}</span>;
    }

    const flag = getFlag(team);
    return flag
      ? <img className="bracket-flag" src={flag} alt={team} title={team} />
      : <span className="bracket-token" title={team}>?</span>;
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    return `${value.substring(8, 10)}/${value.substring(5, 7)} ${value.substring(11, 16)}`;
  };

  const MatchCard = ({ match, col, row }) => {
    const sim = koSimulations[match.id] || { team1_goals: 0, team2_goals: 0 };
    const winner = getWinner(match.id);

    const renderTeam = (teamSide, teamName) => (
      <div className={`compact-team ${winner === teamSide ? 'winner' : ''}`} title={teamName || 'À définir'}>
        {renderFlag(teamName)}
        <input
          type="text"
          inputMode="numeric"
          maxLength="2"
          value={teamSide === 'team1' ? sim.team1_goals : sim.team2_goals}
          aria-label={`Score ${teamName || teamSide}`}
          title={teamName || 'À définir'}
          onChange={(event) => onScoreChange(match.id, `${teamSide}_goals`, event.target.value)}
        />
      </div>
    );

    return (
      <article
        className={`compact-bracket-match ${match.id === 103 ? 'third-place-match' : ''}`}
        style={{ gridColumn: col, gridRow: `${row} / span 2` }}
        title={`${match.round} M${match.id} — ${match.team1Name} vs ${match.team2Name}`}
      >
        <header>
          <span>{match.round}</span>
          {match.start_time && <em>{formatDateTime(match.start_time)}</em>}
          <strong>M{match.id}</strong>
        </header>
        <div className="compact-teams">
          {renderTeam('team1', match.team1Name)}
          {renderTeam('team2', match.team2Name)}
        </div>
      </article>
    );
  };

  const champion = getWinner(104)
    ? (getWinner(104) === 'team1' ? matches[104].team1Name : matches[104].team2Name)
    : 'À définir';

  return (
    <section className="simulation-section knockout-section">
      <div className="simulation-section-title"><span>🏆 Phase éliminatoire</span><h2>Tableau final simulé</h2></div>
      <div className="compact-bracket-scroll">
        <div className="compact-bracket-board">
          {COLUMN_TITLES.map(title => (
            <div key={`${title.col}-${title.label}`} className="compact-round-title" style={{ gridColumn: title.col, gridRow: 1 }}>
              {title.label}
            </div>
          ))}

          {BRACKET_LAYOUT.map(item => (
            <MatchCard key={item.id} match={matches[item.id]} col={item.col} row={item.row} />
          ))}

          <div className="compact-champion" style={{ gridColumn: 5, gridRow: '18 / span 2' }} title={champion}>
            <span>🏆</span>
            <strong>{champion}</strong>
          </div>
        </div>
      </div>

      <style>{`
        .knockout-section { margin-top: 30px; }
        .compact-bracket-scroll {
          overflow-x: auto;
          border-radius: 22px;
          background: rgba(255,255,255,.96);
          border: 1px solid rgba(255,255,255,.55);
          box-shadow: 0 18px 55px rgba(0,0,0,.2);
          padding: 14px;
        }

        .compact-bracket-board {
          min-width: 1010px;
          display: grid;
          grid-template-columns: 108px 98px 90px 84px 118px 84px 90px 98px 108px;
          grid-template-rows: 32px repeat(25, 24px);
          gap: 5px 8px;
          align-items: center;
        }

        .compact-round-title {
          align-self: stretch;
          display: grid;
          place-items: center;
          border-radius: 13px;
          color: white;
          background: linear-gradient(135deg, #0f766e, #d97706);
          font-size: 11px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .06em;
          white-space: nowrap;
        }

        .compact-bracket-match {
          align-self: stretch;
          overflow: hidden;
          border-radius: 13px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          box-shadow: 0 8px 18px rgba(15,23,42,.08);
        }

        .compact-bracket-match header {
          height: 19px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 3px;
          align-items: center;
          padding: 2px 5px;
          background: #ecfdf5;
          color: #047857;
          font-size: 8px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .compact-bracket-match header em {
          min-width: 0;
          color: #64748b;
          font-size: 8px;
          font-style: normal;
          font-weight: 850;
          text-align: center;
          white-space: nowrap;
        }

        .compact-bracket-match header strong {
          padding: 1px 4px;
          border-radius: 999px;
          background: #fff7ed;
          color: #c2410c;
          font-size: 8px;
        }

        .third-place-match header {
          background: #fff7ed;
          color: #92400e;
        }

        .compact-teams {
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: calc(100% - 19px);
        }

        .compact-team {
          display: grid;
          grid-template-columns: 26px 30px;
          gap: 4px;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-top: 1px solid #e2e8f0;
        }

        .compact-team + .compact-team {
          border-left: 1px solid #e2e8f0;
        }

        .compact-team.winner {
          background: #dcfce7;
        }

        .bracket-flag,
        .bracket-token {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          object-fit: cover;
          display: grid;
          place-items: center;
          background: #e2e8f0;
          border: 2px solid white;
          box-shadow: 0 4px 10px rgba(15,23,42,.12);
        }

        .bracket-token {
          width: auto;
          min-width: 24px;
          max-width: 30px;
          padding: 0 3px;
          color: #475569;
          font-size: 8px;
          font-weight: 950;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .compact-team input {
          width: 29px;
          height: 25px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          text-align: center;
          color: #0f172a;
          background: white;
          font-size: 12px;
          font-weight: 950;
        }

        .compact-champion {
          align-self: stretch;
          display: grid;
          align-content: center;
          justify-items: center;
          gap: 3px;
          padding: 8px;
          border-radius: 16px;
          color: white;
          background: linear-gradient(135deg, #0f766e, #d97706);
          box-shadow: 0 12px 28px rgba(15,23,42,.18);
          text-align: center;
        }

        .compact-champion span { font-size: 20px; }
        .compact-champion strong {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          line-height: 1.1;
        }

        @media (max-width: 1200px) {
          .compact-bracket-board { min-width: 940px; grid-template-columns: 98px 90px 82px 76px 110px 76px 82px 90px 98px; gap: 5px 6px; }
          .compact-team { grid-template-columns: 24px 28px; gap: 3px; }
          .bracket-flag, .bracket-token { width: 22px; height: 22px; min-width: 22px; }
          .compact-team input { width: 27px; }
        }
      `}</style>
    </section>
  );
}

export default TournamentBracket;
