import React, { useEffect, useState, useMemo } from 'react';
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

  const getGroupClassification = (groupLetter) => {
    const stats = calculateGroupStats(groupLetter);
    const teams = getTeamsInGroup(groupLetter);

    return teams
      .map(team => ({ team, ...stats[team] }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
      });
  };

  // Memoize les données pour éviter recalculs inutiles
  const groupsData = useMemo(() => {
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const data = {};
    groups.forEach(g => {
      data[g] = getGroupClassification(g);
    });
    return data;
  }, [simulations, matches]);

  const allThirdPlaces = useMemo(() => {
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const thirds = [];

    groups.forEach(groupLetter => {
      const classification = groupsData[groupLetter];
      if (classification.length >= 3) {
        thirds.push({
          team: classification[2].team,
          group: groupLetter,
          points: classification[2].points,
          gf: classification[2].goalsFor,
          ga: classification[2].goalsAgainst,
          diff: classification[2].goalsFor - classification[2].goalsAgainst
        });
      }
    });

    return thirds.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.diff - a.diff;
    });
  }, [groupsData]);

  const getKOMatchups = useMemo(() => {
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

    // Premiers et deuxièmes
    const firstPlaces = {};
    const secondPlaces = {};
    groups.forEach(g => {
      const classification = groupsData[g];
      if (classification.length >= 2) {
        firstPlaces[g] = classification[0].team;
        secondPlaces[g] = classification[1].team;
      }
    });

    // 4 meilleurs 3e
    const qualifiedThirds = allThirdPlaces.slice(0, 4);

    // Matchs 16ème: Format officiel
    const round16 = [
      { home: firstPlaces['A'], away: secondPlaces['B'], desc: 'G A1 - GB2' },
      { home: firstPlaces['C'], away: secondPlaces['D'], desc: 'GC1 - GD2' },
      { home: firstPlaces['E'], away: secondPlaces['F'], desc: 'GE1 - GF2' },
      { home: firstPlaces['G'], away: secondPlaces['H'], desc: 'GG1 - GH2' },
      { home: firstPlaces['B'], away: secondPlaces['A'], desc: 'GB1 - GA2' },
      { home: firstPlaces['D'], away: secondPlaces['C'], desc: 'GD1 - GC2' },
      { home: firstPlaces['F'], away: secondPlaces['E'], desc: 'GF1 - GE2' },
      { home: firstPlaces['H'], away: secondPlaces['G'], desc: 'GH1 - GG2' },
      { home: firstPlaces['I'], away: secondPlaces['J'], desc: 'GI1 - GJ2' },
      { home: firstPlaces['K'], away: secondPlaces['L'], desc: 'GK1 - GL2' },
      { home: firstPlaces['J'], away: secondPlaces['I'], desc: 'GJ1 - GI2' },
      { home: firstPlaces['L'], away: secondPlaces['K'], desc: 'GL1 - GK2' },
      { home: qualifiedThirds[0]?.team, away: firstPlaces['B'], desc: '3e + GB1' },
      { home: qualifiedThirds[1]?.team, away: firstPlaces['D'], desc: '3e + GD1' },
      { home: qualifiedThirds[2]?.team, away: firstPlaces['F'], desc: '3e + GF1' },
      { home: qualifiedThirds[3]?.team, away: firstPlaces['H'], desc: '3e + GH1' }
    ];

    return { firstPlaces, secondPlaces, qualifiedThirds, round16 };
  }, [groupsData, allThirdPlaces]);

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
          <p style={{ color: '#666', fontSize: '16px' }}>Chargement de la simulation...</p>
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
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', color: '#333', margin: '0 0 10px 0', fontWeight: 'bold' }}>
            🎮 Simulation Coupe du Monde
          </h1>
          <p style={{ color: '#666', margin: '0', fontSize: '16px' }}>
            Simule les scores, vois les qualifiés et les matchs éliminatoires!
          </p>
        </div>

        {/* PHASE DE GROUPES - 2 par ligne */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '20px', fontWeight: 'bold' }}>
            🏆 Phase de Groupes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(700px, 1fr))', gap: '20px' }}>
            {groups.map(groupLetter => {
              const groupIndex = groupLetter.charCodeAt(0) - 65;
              const startId = groupIndex * 6 + 1;
              const groupMatches = matches.filter(m => m.id >= startId && m.id < startId + 6);
              const classification = groupsData[groupLetter];

              if (groupMatches.length === 0) return null;

              return (
                <div key={groupLetter}>
                  <div style={{
                    background: GRADIENT,
                    color: 'white',
                    padding: '12px 15px',
                    borderRadius: '8px 8px 0 0'
                  }}>
                    <h3 style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                      Groupe {groupLetter}
                    </h3>
                  </div>

                  <div style={{
                    background: 'white',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                  }}>
                    {/* Matchs */}
                    <div style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {groupMatches.map((match, idx) => {
                        const sim = simulations[match.id] || { team1_goals: 0, team2_goals: 0 };
                        const pred = predictions[match.id];
                        const points = pred ? calculatePoints(pred, sim) : 0;

                        return (
                          <div key={match.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 0',
                            borderBottom: idx < groupMatches.length - 1 ? '1px solid #f0f0f0' : 'none',
                            fontSize: '12px'
                          }}>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                              <div style={{ fontWeight: '500', color: '#333' }}>
                                {match.team1} vs {match.team2}
                              </div>
                              {pred && (
                                <div style={{ fontSize: '10px', color: '#999' }}>
                                  Prono: {pred.team1_goals}-{pred.team2_goals}
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={sim.team1_goals}
                                onChange={(e) => handleSimulationChange(match.id, 'team1_goals', e.target.value)}
                                style={{
                                  width: '32px',
                                  padding: '3px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  border: `1px solid ${PRIMARY}`,
                                  borderRadius: '3px',
                                  textAlign: 'center'
                                }}
                              />
                              <span style={{ fontSize: '10px', color: '#ddd' }}>-</span>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={sim.team2_goals}
                                onChange={(e) => handleSimulationChange(match.id, 'team2_goals', e.target.value)}
                                style={{
                                  width: '32px',
                                  padding: '3px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  border: `1px solid ${PRIMARY}`,
                                  borderRadius: '3px',
                                  textAlign: 'center'
                                }}
                              />
                              <div style={{
                                background: points >= 3 ? '#d1fae5' : points >= 2 ? '#dbeafe' : points >= 1 ? '#fef3c7' : '#f3f4f6',
                                color: points >= 3 ? '#059669' : points >= 2 ? '#1e40af' : points >= 1 ? '#92400e' : '#4b5563',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                minWidth: '35px',
                                textAlign: 'center'
                              }}>
                                {points}pt
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Classement */}
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '11px'
                    }}>
                      <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                          <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 'bold' }}>Équipe</th>
                          <th style={{ padding: '6px 2px', textAlign: 'center', fontWeight: 'bold', width: '20px' }}>J</th>
                          <th style={{ padding: '6px 2px', textAlign: 'center', fontWeight: 'bold', width: '20px' }}>G</th>
                          <th style={{ padding: '6px 2px', textAlign: 'center', fontWeight: 'bold', width: '20px' }}>N</th>
                          <th style={{ padding: '6px 2px', textAlign: 'center', fontWeight: 'bold', width: '20px' }}>P</th>
                          <th style={{ padding: '6px 2px', textAlign: 'center', fontWeight: 'bold', width: '25px' }}>+/-</th>
                          <th style={{ padding: '6px 2px', textAlign: 'center', fontWeight: 'bold', color: PRIMARY, width: '20px' }}>Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classification.map((data, idx) => {
                          const diff = data.goalsFor - data.goalsAgainst;
                          return (
                            <tr key={data.team} style={{
                              background: idx < 2 ? '#eff6ff' : 'white',
                              borderTop: '1px solid #eee'
                            }}>
                              <td style={{ padding: '6px 4px', fontWeight: '500', fontSize: '11px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  width: '18px',
                                  height: '18px',
                                  background: idx < 2 ? GRADIENT : '#e0e0e0',
                                  color: 'white',
                                  borderRadius: '50%',
                                  textAlign: 'center',
                                  lineHeight: '18px',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  marginRight: '4px'
                                }}>
                                  {idx + 1}
                                </span>
                                {data.team}
                              </td>
                              <td style={{ padding: '6px 2px', textAlign: 'center' }}>{data.played}</td>
                              <td style={{ padding: '6px 2px', textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>{data.won}</td>
                              <td style={{ padding: '6px 2px', textAlign: 'center', color: '#92400e', fontWeight: 'bold' }}>{data.draw}</td>
                              <td style={{ padding: '6px 2px', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>{data.lost}</td>
                              <td style={{
                                padding: '6px 2px',
                                textAlign: 'center',
                                color: diff > 0 ? '#059669' : diff < 0 ? '#dc2626' : '#666',
                                fontWeight: 'bold'
                              }}>
                                {data.gf}-{data.ga}
                              </td>
                              <td style={{
                                padding: '6px 2px',
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
              );
            })}
          </div>
        </div>

        {/* MEILLEURS 3e COMPLETS */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '20px', fontWeight: 'bold' }}>
            🥉 Classement des 3e
          </h2>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px'
            }}>
              <thead>
                <tr style={{ background: GRADIENT, color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Équipe</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', width: '60px' }}>Groupe</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', width: '40px' }}>J</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', width: '40px' }}>G</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', width: '40px' }}>N</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', width: '40px' }}>P</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', width: '50px' }}>Diff</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', width: '40px', background: 'rgba(255,255,255,0.2)' }}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {allThirdPlaces.map((data, idx) => (
                  <tr key={data.team} style={{
                    background: idx < 4 ? '#eff6ff' : 'white',
                    borderTop: '1px solid #eee'
                  }}>
                    <td style={{ padding: '10px 12px', fontWeight: '500' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '24px',
                        height: '24px',
                        background: idx < 4 ? GRADIENT : '#e0e0e0',
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
                      {idx < 4 && <span style={{ marginLeft: '8px', color: '#059669', fontWeight: 'bold', fontSize: '11px' }}>✓ Qualifié</span>}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold' }}>{data.group}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>3</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>-</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#92400e', fontWeight: 'bold' }}>-</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>-</td>
                    <td style={{
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: data.diff > 0 ? '#059669' : '#dc2626'
                    }}>
                      {data.diff > 0 ? '+' : ''}{data.diff}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', color: PRIMARY }}>
                      {data.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PHASE ÉLIMINATOIRE */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '20px', fontWeight: 'bold' }}>
            🏟️ Phase Éliminatoire
          </h2>

          {/* 16ème de Finale */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{
              fontSize: '18px',
              color: '#333',
              padding: '10px 15px',
              background: GRADIENT,
              color: 'white',
              borderRadius: '8px',
              margin: '0 0 15px 0',
              fontWeight: 'bold'
            }}>
              🥊 16ème de Finale
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '15px'
            }}>
              {getKOMatchups.round16.map((match, idx) => (
                <div key={idx} style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '12px',
                  background: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#999',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {match.desc}
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    <div style={{
                      padding: '8px',
                      background: '#f9f9f9',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${PRIMARY}`
                    }}>
                      {match.home || '?'}
                    </div>
                    <div style={{ textAlign: 'center', color: '#999', fontSize: '11px' }}>vs</div>
                    <div style={{
                      padding: '8px',
                      background: '#f9f9f9',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${SECONDARY}`
                    }}>
                      {match.away || '?'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message pour phases suivantes */}
          <div style={{
            background: '#f0f4f8',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            Les phases 8ème, Quarts, Semis et Final se calculeront automatiquement à mesure que les matchs précédents se déroulent! 🚀
          </div>
        </div>
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
