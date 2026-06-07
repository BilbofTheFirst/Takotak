import React, { useEffect, useState } from 'react';
import { matchesService, predictionsService } from '../services/api';

function Simulation() {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [simulations, setSimulations] = useState({});
  const [loading, setLoading] = useState(true);

  const PRIMARY = '#2563eb';
  const SECONDARY = '#ec4899';
  const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [matchesRes, predictionsRes] = await Promise.all([
        matchesService.getAll(),
        predictionsService.getAll()
      ]);

      // Garder seulement les matchs de groupes (IDs 1-72)
      const groupMatches = matchesRes.data.filter(m => m.id <= 72);
      setMatches(groupMatches);

      const predMap = {};
      const simMap = {};
      predictionsRes.data.forEach(p => {
        predMap[p.match_id] = p;
        simMap[p.match_id] = { team1_goals: 0, team2_goals: 0 };
      });
      setPredictions(predMap);
      setSimulations(simMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulationChange = (matchId, field, value) => {
    setSimulations(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: Math.max(0, Math.min(20, parseInt(value) || 0))
      }
    }));
  };

  const calculatePoints = (prediction, result) => {
    const { team1_goals: pred1, team2_goals: pred2 } = prediction;
    const { team1_goals: res1, team2_goals: res2 } = result;

    if (pred1 === res1 && pred2 === res2) return 3;
    if ((pred1 - pred2) === (res1 - res2)) return 2;

    const predTendency = pred1 > pred2 ? 'team1' : pred1 < pred2 ? 'team2' : 'draw';
    const resTendency = res1 > res2 ? 'team1' : res1 < res2 ? 'team2' : 'draw';
    if (predTendency === resTendency) return 1;

    return 0;
  };

  const getTeamsInGroup = (groupLetter) => {
    const groupIndex = groupLetter.charCodeAt(0) - 65;
    const startId = groupIndex * 6 + 1;
    const groupMatches = matches.filter(m => m.id >= startId && m.id < startId + 6);

    const teams = new Set();
    groupMatches.forEach(m => {
      teams.add(m.team1);
      teams.add(m.team2);
    });
    return Array.from(teams);
  };

  const calculateGroupStats = (groupLetter) => {
    const groupIndex = groupLetter.charCodeAt(0) - 65;
    const startId = groupIndex * 6 + 1;
    const groupMatches = matches.filter(m => m.id >= startId && m.id < startId + 6);

    const teams = getTeamsInGroup(groupLetter);
    const stats = {};

    teams.forEach(team => {
      stats[team] = {
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      };
    });

    groupMatches.forEach(match => {
      const sim = simulations[match.id] || { team1_goals: 0, team2_goals: 0 };
      const g1 = parseInt(sim.team1_goals) || 0;
      const g2 = parseInt(sim.team2_goals) || 0;

      stats[match.team1].played++;
      stats[match.team1].goalsFor += g1;
      stats[match.team1].goalsAgainst += g2;

      stats[match.team2].played++;
      stats[match.team2].goalsFor += g2;
      stats[match.team2].goalsAgainst += g1;

      if (g1 > g2) {
        stats[match.team1].won++;
        stats[match.team1].points += 3;
        stats[match.team2].lost++;
      } else if (g1 < g2) {
        stats[match.team2].won++;
        stats[match.team2].points += 3;
        stats[match.team1].lost++;
      } else {
        stats[match.team1].draw++;
        stats[match.team1].points += 1;
        stats[match.team2].draw++;
        stats[match.team2].points += 1;
      }
    });

    return stats;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f4f8'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'bounce 1s infinite' }}>⏳</div>
          <p style={{ color: '#666', fontSize: '16px' }}>Chargement des groupes...</p>
        </div>
      </div>
    );
  }

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #f3e7e9 100%)',
      padding: '30px 20px',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', color: '#333', margin: '0 0 10px 0', fontWeight: 'bold' }}>
            🎮 Simulation
          </h1>
          <p style={{ color: '#666', margin: '0', fontSize: '16px' }}>
            Simule les résultats et vois comment tu aurais marqué des points!
          </p>
        </div>

        {/* 16ème de Finale Preview */}
        {(() => {
          const getWinnerAndRunner = (groupLetter) => {
            const stats = calculateGroupStats(groupLetter);
            const teams = getTeamsInGroup(groupLetter);
            const sorted = teams
              .map(team => ({ team, ...stats[team] }))
              .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
              });
            return { winner: sorted[0]?.team, runner: sorted[1]?.team, third: sorted[2]?.team };
          };

          const groupPairs = [
            { g1: 'A', g2: 'B' },
            { g1: 'C', g2: 'D' },
            { g1: 'E', g2: 'F' },
            { g1: 'G', g2: 'H' },
            { g1: 'I', g2: 'J' },
            { g1: 'K', g2: 'L' }
          ];

          return (
            <div style={{ marginBottom: '30px' }}>
              <div style={{
                background: GRADIENT,
                color: 'white',
                padding: '12px 15px',
                borderRadius: '8px 8px 0 0'
              }}>
                <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>
                  🏟️ 16ème de Finale (Preview)
                </h2>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '0 0 8px 8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                  {groupPairs.map(pair => {
                    const g1 = getWinnerAndRunner(pair.g1);
                    const g2 = getWinnerAndRunner(pair.g2);

                    return (
                      <div key={pair.g1 + pair.g2} style={{
                        border: '1px solid #eee',
                        borderRadius: '6px',
                        padding: '12px',
                        background: '#f9f9f9'
                      }}>
                        <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          G{pair.g1} 1er vs G{pair.g2} 2e
                        </div>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          <div style={{ padding: '6px', background: 'white', borderRadius: '4px' }}>
                            {g1.winner || 'TBD'}
                          </div>
                          <div style={{ textAlign: 'center', color: '#999', fontSize: '11px' }}>vs</div>
                          <div style={{ padding: '6px', background: 'white', borderRadius: '4px' }}>
                            {g2.runner || 'TBD'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Meilleurs tiers */}
        {(() => {
          const thirdPlaces = [];
          groups.forEach(groupLetter => {
            const stats = calculateGroupStats(groupLetter);
            const teams = getTeamsInGroup(groupLetter);
            const sorted = teams
              .map(team => ({ team, ...stats[team] }))
              .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
              });

            if (sorted.length >= 3) {
              thirdPlaces.push({
                team: sorted[2].team,
                group: groupLetter,
                points: sorted[2].points,
                gf: sorted[2].goalsFor,
                ga: sorted[2].goalsAgainst,
                diff: sorted[2].goalsFor - sorted[2].goalsAgainst
              });
            }
          });

          const qualified = thirdPlaces
            .sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              return b.diff - a.diff;
            })
            .slice(0, 4);

          return (
            <div style={{ marginBottom: '30px' }}>
              <div style={{
                background: GRADIENT,
                color: 'white',
                padding: '12px 15px',
                borderRadius: '8px 8px 0 0'
              }}>
                <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>
                  🥉 Meilleurs 3e (Qualifiés)
                </h2>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '0 0 8px 8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px'
                }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #ddd' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 'bold' }}>Équipe</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', width: '40px' }}>Groupe</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', width: '40px' }}>Pts</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', width: '40px' }}>+/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qualified.map((data, idx) => (
                      <tr key={data.team} style={{
                        background: '#eff6ff',
                        borderBottom: '1px solid #eee'
                      }}>
                        <td style={{ padding: '8px 10px', fontWeight: '500' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '24px',
                            height: '24px',
                            background: GRADIENT,
                            color: 'white',
                            borderRadius: '50%',
                            textAlign: 'center',
                            lineHeight: '24px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            marginRight: '8px'
                          }}>
                            {idx + 1}
                          </span>
                          {data.team}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: '#666' }}>{data.group}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', color: PRIMARY }}>{data.points}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', color: data.diff > 0 ? '#059669' : '#dc2626' }}>
                          {data.diff > 0 ? '+' : ''}{data.diff}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Groups */}
        {groups.map(groupLetter => {
          const groupIndex = groupLetter.charCodeAt(0) - 65;
          const startId = groupIndex * 6 + 1;
          const groupMatches = matches.filter(m => m.id >= startId && m.id < startId + 6);

          if (groupMatches.length === 0) return null;

          const stats = calculateGroupStats(groupLetter);
          const teams = getTeamsInGroup(groupLetter);

          return (
            <div key={groupLetter} style={{ marginBottom: '30px' }}>
              {/* Group Header */}
              <div style={{
                background: GRADIENT,
                color: 'white',
                padding: '12px 15px',
                borderRadius: '8px 8px 0 0',
                marginBottom: '0'
              }}>
                <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>
                  Groupe {groupLetter}
                </h2>
              </div>

              {/* Layout: Left (matches) + Right (table) */}
              <div style={{
                display: 'flex',
                gap: '20px',
                background: 'white',
                borderRadius: '0 0 8px 8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                minHeight: 'auto'
              }}>
                {/* Left: Matches */}
                <div style={{
                  flex: 1,
                  padding: '15px',
                  borderRight: '1px solid #eee',
                  overflowY: 'auto'
                }}>
                  {groupMatches.map((match, idx) => {
                    const pred = predictions[match.id];
                    const sim = simulations[match.id] || { team1_goals: 0, team2_goals: 0 };
                    const points = pred ? calculatePoints(pred, sim) : 0;

                    return (
                      <div key={match.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 0',
                        borderBottom: idx < groupMatches.length - 1 ? '1px solid #eee' : 'none',
                        fontSize: '13px'
                      }}>
                        {/* Match */}
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <div style={{ fontWeight: '500', color: '#333' }}>
                            {match.team1.substring(0, 10)} vs {match.team2.substring(0, 10)}
                          </div>
                          {pred && (
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>
                              Prono: {pred.team1_goals}-{pred.team2_goals}
                            </div>
                          )}
                        </div>

                        {/* Score Input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={sim.team1_goals}
                            onChange={(e) => handleSimulationChange(match.id, 'team1_goals', e.target.value)}
                            placeholder="0"
                            style={{
                              width: '35px',
                              padding: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              border: `1px solid ${PRIMARY}`,
                              borderRadius: '3px',
                              textAlign: 'center'
                            }}
                          />
                          <span style={{ fontSize: '11px', color: '#ddd' }}>-</span>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={sim.team2_goals}
                            onChange={(e) => handleSimulationChange(match.id, 'team2_goals', e.target.value)}
                            placeholder="0"
                            style={{
                              width: '35px',
                              padding: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              border: `1px solid ${PRIMARY}`,
                              borderRadius: '3px',
                              textAlign: 'center'
                            }}
                          />
                        </div>

                        {/* Points */}
                        <div style={{
                          background: points >= 3 ? '#d1fae5' : points >= 2 ? '#dbeafe' : points >= 1 ? '#fef3c7' : '#f3f4f6',
                          color: points >= 3 ? '#059669' : points >= 2 ? '#1e40af' : points >= 1 ? '#92400e' : '#4b5563',
                          padding: '3px 8px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          minWidth: '40px',
                          textAlign: 'center'
                        }}>
                          {points}pt
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Standings Table */}
                <div style={{ flex: 1, padding: '15px', overflowY: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '11px'
                  }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #ddd' }}>
                        <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Équipe</th>
                        <th style={{ padding: '6px 3px', textAlign: 'center', fontWeight: 'bold', color: '#333', width: '25px' }}>J</th>
                        <th style={{ padding: '6px 3px', textAlign: 'center', fontWeight: 'bold', color: '#333', width: '25px' }}>G</th>
                        <th style={{ padding: '6px 3px', textAlign: 'center', fontWeight: 'bold', color: '#333', width: '25px' }}>N</th>
                        <th style={{ padding: '6px 3px', textAlign: 'center', fontWeight: 'bold', color: '#333', width: '25px' }}>P</th>
                        <th style={{ padding: '6px 3px', textAlign: 'center', fontWeight: 'bold', color: '#333', width: '35px' }}>+/-</th>
                        <th style={{ padding: '6px 3px', textAlign: 'center', fontWeight: 'bold', color: PRIMARY, width: '30px' }}>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams
                        .map(team => ({
                          team,
                          ...stats[team]
                        }))
                        .sort((a, b) => {
                          if (b.points !== a.points) {
                            return b.points - a.points;
                          }
                          return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
                        })
                        .map((data, idx) => {
                          const diff = data.goalsFor - data.goalsAgainst;
                          return (
                            <tr key={data.team} style={{
                              background: idx < 2 ? '#eff6ff' : 'white',
                              borderBottom: '1px solid #eee'
                            }}>
                              <td style={{ padding: '6px 4px', fontWeight: '500', color: '#333' }}>
                                <span style={{
                                  display: 'inline-block',
                                  width: '18px',
                                  height: '18px',
                                  background: idx < 2 ? GRADIENT : '#e0e0e0',
                                  color: 'white',
                                  borderRadius: '50%',
                                  textAlign: 'center',
                                  lineHeight: '18px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  marginRight: '6px'
                                }}>
                                  {idx + 1}
                                </span>
                                <span style={{ fontSize: '12px' }}>{data.team.substring(0, 12)}</span>
                              </td>
                              <td style={{ padding: '6px 3px', textAlign: 'center', color: '#666' }}>{data.played}</td>
                              <td style={{ padding: '6px 3px', textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>{data.won}</td>
                              <td style={{ padding: '6px 3px', textAlign: 'center', color: '#92400e', fontWeight: 'bold' }}>{data.draw}</td>
                              <td style={{ padding: '6px 3px', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>{data.lost}</td>
                              <td style={{
                                padding: '6px 3px',
                                textAlign: 'center',
                                color: diff > 0 ? '#059669' : diff < 0 ? '#dc2626' : '#666',
                                fontWeight: 'bold'
                              }}>
                                {data.goalsFor}-{data.goalsAgainst}
                              </td>
                              <td style={{
                                padding: '6px 3px',
                                textAlign: 'center',
                                color: PRIMARY,
                                fontWeight: 'bold'
                              }}>
                                {data.points}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

export default Simulation;
