import React, { useEffect, useState } from 'react';
import { matchesService, predictionsService } from '../services/api';

function Predictions() {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [success, setSuccess] = useState({});
  const [tempScores, setTempScores] = useState({});

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
        [team]: Math.max(0, parseInt(value) || 0)
      }
    }));
  };

  const handleSavePrediction = async (matchId, team1Name, team2Name) => {
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
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
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

  const groupedMatches = groupByDate(matches);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f7fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'bounce 1s infinite'
          }}>⏳</div>
          <p style={{ color: '#666', fontSize: '16px' }}>Chargement des matchs...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '30px 20px',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '36px',
            color: '#333',
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }}>
            🎯 Mes Prédictions
          </h1>
          <p style={{
            color: '#666',
            margin: '0',
            fontSize: '16px'
          }}>
            Prédis les scores avant le match pour gagner des points!
          </p>
        </div>

        {/* Calendar */}
        {Object.entries(groupedMatches).map(([date, dateMatches]) => (
          <div key={date} style={{ marginBottom: '40px' }}>
            {/* Date Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '15px 20px',
              borderRadius: '10px 10px 0 0',
              marginBottom: '0'
            }}>
              <h2 style={{
                margin: '0',
                fontSize: '20px',
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
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              {dateMatches.map((match, idx) => {
                const pred = predictions[match.id];
                const scores = tempScores[match.id] || { team1: pred?.team1_goals || 0, team2: pred?.team2_goals || 0 };
                const isDeadline = new Date(match.start_time) < new Date();
                const isSaved = pred && pred.team1_goals === scores.team1 && pred.team2_goals === scores.team2;

                return (
                  <div
                    key={match.id}
                    style={{
                      padding: '20px',
                      borderBottom: idx < dateMatches.length - 1 ? '1px solid #eee' : 'none',
                      background: isDeadline ? '#f9f9f9' : 'white',
                      opacity: isDeadline ? 0.7 : 1
                    }}
                  >
                    {/* Match Info */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          margin: '0 0 5px 0',
                          fontSize: '18px',
                          color: '#333',
                          fontWeight: 'bold'
                        }}>
                          ⚽ {match.team1} vs {match.team2}
                        </h3>
                        <p style={{
                          margin: '0',
                          color: '#999',
                          fontSize: '13px'
                        }}>
                          {new Date(match.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {isDeadline && ' (Matchs fermés)'}
                        </p>
                      </div>

                      {pred && !isDeadline && (
                        <div style={{
                          background: '#efe',
                          color: '#3c3',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          ✅ Prédit
                        </div>
                      )}
                    </div>

                    {/* Score Input */}
                    {!isDeadline && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '15px',
                        background: '#f9f9f9',
                        padding: '15px',
                        borderRadius: '8px'
                      }}>
                        {/* Team 1 Score */}
                        <div style={{ flex: 1, textAlign: 'center' }}>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                          }}>
                            {match.team1}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={scores.team1}
                            onChange={(e) => handleScoreChange(match.id, 'team1', e.target.value)}
                            disabled={isDeadline || saving[match.id]}
                            style={{
                              width: '100%',
                              padding: '10px',
                              fontSize: '20px',
                              fontWeight: 'bold',
                              border: '2px solid #667eea',
                              borderRadius: '6px',
                              textAlign: 'center',
                              cursor: isDeadline ? 'not-allowed' : 'text',
                              opacity: isDeadline ? 0.5 : 1,
                              transition: 'all 0.2s'
                            }}
                          />
                        </div>

                        {/* Separator */}
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: '#ddd',
                          marginBottom: '10px'
                        }}>
                          -
                        </div>

                        {/* Team 2 Score */}
                        <div style={{ flex: 1, textAlign: 'center' }}>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                          }}>
                            {match.team2}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={scores.team2}
                            onChange={(e) => handleScoreChange(match.id, 'team2', e.target.value)}
                            disabled={isDeadline || saving[match.id]}
                            style={{
                              width: '100%',
                              padding: '10px',
                              fontSize: '20px',
                              fontWeight: 'bold',
                              border: '2px solid #667eea',
                              borderRadius: '6px',
                              textAlign: 'center',
                              cursor: isDeadline ? 'not-allowed' : 'text',
                              opacity: isDeadline ? 0.5 : 1,
                              transition: 'all 0.2s'
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    {!isDeadline && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleSavePrediction(match.id, match.team1, match.team2)}
                          disabled={saving[match.id] || isSaved}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: isSaved ? '#3c3' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            cursor: saving[match.id] || isSaved ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s',
                            opacity: saving[match.id] ? 0.7 : 1
                          }}
                        >
                          {saving[match.id] ? '⏳ Sauvegarde...' : (isSaved ? '✅ Enregistré' : '💾 Enregistrer')}
                        </button>
                      </div>
                    )}

                    {/* Success Message */}
                    {success[match.id] && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        background: '#efe',
                        color: '#3c3',
                        borderRadius: '6px',
                        fontSize: '13px',
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
