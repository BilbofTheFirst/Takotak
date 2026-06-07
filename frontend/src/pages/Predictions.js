import React, { useEffect, useState } from 'react';
import { matchesService, predictionsService } from '../services/api';
import { getFlag } from '../utils/countryFlags';

function Predictions() {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [success, setSuccess] = useState({});
  const [tempScores, setTempScores] = useState({});

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
      setMatches(matchesRes.data);

      const predMap = {};
      const tempMap = {};
      predictionsRes.data.forEach(p => {
        predMap[p.match_id] = p;
        tempMap[p.match_id] = { team1: p.team1_goals, team2: p.team2_goals };
      });
      setPredictions(predMap);
      setTempScores(tempMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (matchId, team, value) => {
    setTempScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId] || { team1: 0, team2: 0 },
        [team]: Math.max(0, Math.min(20, parseInt(value) || 0))
      }
    }));
  };

  const handleSavePrediction = async (matchId) => {
    setSaving(prev => ({ ...prev, [matchId]: true }));
    try {
      const scores = tempScores[matchId] || { team1: 0, team2: 0 };
      await predictionsService.create(matchId, scores.team1, scores.team2);

      setSuccess(prev => ({ ...prev, [matchId]: true }));
      setTimeout(() => {
        setSuccess(prev => ({ ...prev, [matchId]: false }));
      }, 2000);

      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur');
    } finally {
      setSaving(prev => ({ ...prev, [matchId]: false }));
    }
  };

  const groupByDate = (matches) => {
    const grouped = {};
    matches.forEach(match => {
      const date = new Date(match.start_time).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(match);
    });
    return grouped;
  };

  const getMatchLabel = (matchId) => {
    // Matchs de groupes: A-L (IDs 1-72)
    if (matchId <= 72) {
      const groupIndex = Math.floor((matchId - 1) / 6);
      return `Groupe ${String.fromCharCode(65 + groupIndex)}`; // Groupe A-L
    }

    // Matchs KO (IDs 73+)
    const koId = matchId - 72;
    if (koId <= 16) return '16ème';
    if (koId <= 24) return '8ème';
    if (koId <= 28) return 'Quart';
    if (koId <= 30) return 'Semi';
    if (koId === 31) return '3e place';
    if (koId === 32) return 'Final';

    return 'Match';
  };

  const getTeamLabel = (matchId, position, teamName) => {
    if (teamName) return teamName;

    // Pour les matchs KO sans équipes déterminées
    const koId = matchId - 72;
    if (koId <= 0) return '?';

    if (koId <= 16) {
      // 16ème: 1er/2nd des poules
      if (position === 'team1') {
        const groupIndex = Math.floor((koId - 1) / 2);
        return `1er Groupe ${String.fromCharCode(65 + groupIndex * 2)}`;
      } else {
        const groupIndex = Math.floor((koId - 1) / 2);
        return `2nd Groupe ${String.fromCharCode(65 + groupIndex * 2 + 1)}`;
      }
    }

    if (koId <= 24) {
      // 8ème: Vainqueur 16ème
      const r16Id = Math.ceil(koId / 2);
      return `Vainqueur 16ème ${r16Id}`;
    }

    if (koId <= 28) {
      // Quarts: Vainqueur 8ème
      const r8Id = koId - 16;
      return `Vainqueur 8ème ${r8Id}`;
    }

    if (koId <= 30) {
      // Semis: Vainqueur Quart
      const qId = koId - 20;
      return `Vainqueur Quart ${qId}`;
    }

    return 'À déterminer';
  };

  const groupedMatches = groupByDate(matches);

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
          <p style={{ color: '#666', fontSize: '16px' }}>Chargement des matchs...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #f3e7e9 100%)',
      padding: '30px 20px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', color: '#333', margin: '0 0 10px 0', fontWeight: 'bold' }}>
            🎯 Mes Prédictions
          </h1>
          <p style={{ color: '#666', margin: '0', fontSize: '16px' }}>
            Prédis les scores avant le coup d'envoi pour gagner des points!
          </p>
        </div>

        {/* Calendar */}
        {Object.entries(groupedMatches).map(([date, dateMatches]) => (
          <div key={date} style={{ marginBottom: '20px' }}>
            {/* Date Header */}
            <div style={{
              background: GRADIENT,
              color: 'white',
              padding: '10px 15px',
              borderRadius: '8px 8px 0 0',
              marginBottom: '0'
            }}>
              <h2 style={{
                margin: '0',
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'capitalize'
              }}>
                📅 {date}
              </h2>
            </div>

            {/* Matches for this date */}
            <div style={{
              background: 'white',
              borderRadius: '0 0 10px 10px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              marginBottom: '20px'
            }}>
              {dateMatches.map((match, idx) => {
                const pred = predictions[match.id];
                const scores = tempScores[match.id] || { team1: pred?.team1_goals || 0, team2: pred?.team2_goals || 0 };
                const isDeadline = new Date(match.start_time) < new Date();
                const isSaved = pred && pred.team1_goals === scores.team1 && pred.team2_goals === scores.team2;
                const matchLabel = getMatchLabel(match.id);

                return (
                  <div
                    key={match.id}
                    style={{
                      padding: '10px 15px',
                      borderBottom: idx < dateMatches.length - 1 ? '1px solid #eee' : 'none',
                      background: isDeadline ? '#f9f9f9' : 'white',
                      opacity: isDeadline ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap'
                    }}
                  >
                    {/* Match Type Badge */}
                    <div style={{
                      background: GRADIENT,
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      minWidth: '50px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}>
                      {matchLabel}
                    </div>

                    {/* Time - Heure belgique DIRECTE sans conversion */}
                    <div style={{
                      color: '#999',
                      fontSize: '12px',
                      fontWeight: '500',
                      minWidth: '45px'
                    }}>
                      {match.start_time ? match.start_time.substring(11, 16) : '--:--'}
                    </div>

                    {/* Match Score Input - UNE LIGNE */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flex: 1,
                      minWidth: '400px'
                    }}>
                      {/* Team 1: Drapeau + Nom */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '100px' }}>
                        {match.team1 && getFlag(match.team1) && <img src={getFlag(match.team1)} alt={match.team1} style={{ height: '20px', width: '20px', borderRadius: '50%', border: '1px solid #ccc', objectFit: 'cover' }} />}
                        <span style={{ fontSize: '12px', fontWeight: '500', color: '#333' }}>{getTeamLabel(match.id, 'team1', match.team1)}</span>
                      </div>

                      {/* Score 1 */}
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={scores.team1}
                        onChange={(e) => handleScoreChange(match.id, 'team1', e.target.value)}
                        disabled={isDeadline || saving[match.id]}
                        style={{
                          width: '40px',
                          padding: '4px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          border: `2px solid ${PRIMARY}`,
                          borderRadius: '4px',
                          textAlign: 'center',
                          cursor: isDeadline ? 'not-allowed' : 'pointer'
                        }}
                      />

                      {/* Separator */}
                      <span style={{ color: '#ccc', fontWeight: 'bold' }}>-</span>

                      {/* Score 2 */}
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={scores.team2}
                        onChange={(e) => handleScoreChange(match.id, 'team2', e.target.value)}
                        disabled={isDeadline || saving[match.id]}
                        style={{
                          width: '40px',
                          padding: '4px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          border: `2px solid ${PRIMARY}`,
                          borderRadius: '4px',
                          textAlign: 'center',
                          cursor: isDeadline ? 'not-allowed' : 'pointer'
                        }}
                      />

                      {/* Team 2: Nom + Drapeau */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '100px', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '12px', fontWeight: '500', color: '#333' }}>{getTeamLabel(match.id, 'team2', match.team2)}</span>
                        {match.team2 && getFlag(match.team2) && <img src={getFlag(match.team2)} alt={match.team2} style={{ height: '20px', width: '20px', borderRadius: '50%', border: '1px solid #ccc', objectFit: 'cover' }} />}
                      </div>
                    </div>

                    {/* Button and Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
                      {!isDeadline && (
                        <button
                          onClick={() => handleSavePrediction(match.id)}
                          disabled={saving[match.id] || isSaved}
                          style={{
                            padding: '6px 12px',
                            background: isSaved ? '#10b981' : GRADIENT,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: saving[match.id] || isSaved ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s',
                            opacity: saving[match.id] ? 0.7 : 1,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {saving[match.id] ? '⏳' : (isSaved ? '✅' : '💾')}
                        </button>
                      )}
                      {isDeadline && (
                        <div style={{
                          color: '#999',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          🔒 Fermé
                        </div>
                      )}
                    </div>

                    {/* Success Message */}
                    {success[match.id] && (
                      <div style={{
                        width: '100%',
                        padding: '8px',
                        background: '#d1fae5',
                        color: '#059669',
                        borderRadius: '6px',
                        fontSize: '12px',
                        animation: 'slideDown 0.3s ease-out'
                      }}>
                        ✅ Prédiction enregistrée!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default Predictions;
