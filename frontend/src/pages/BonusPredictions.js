import React, { useEffect, useState } from 'react';
import { matchesService } from '../services/api';
import BonusPredictionsPanel from '../components/BonusPredictionsPanel';

function BonusPredictions() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const response = await matchesService.getAll();
        setMatches(response.data);
      } catch (error) {
        console.error('Erreur chargement matchs pour bonus:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  if (loading) {
    return (
      <div className="predictions-page loading-page">
        <div className="loading-card"><div className="loading-ball">🎁</div><p>Chargement des pronostics bonus...</p></div>
      </div>
    );
  }

  return (
    <div className="predictions-page">
      <div className="predictions-container">
        <section className="predictions-hero">
          <div>
            <span className="eyebrow">Coupe du Monde 2026</span>
            <h1>🎁 Pronostics bonus</h1>
            <p>Ces pronostics se remplissent avant le début de la compétition et rapportent des points bonus au classement général.</p>
          </div>
        </section>

        <BonusPredictionsPanel matches={matches} />
      </div>
    </div>
  );
}

export default BonusPredictions;
