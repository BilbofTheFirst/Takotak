import React, { useEffect, useState } from 'react';
import { matchesService } from '../services/api';
import BonusPredictionsPanel from '../components/BonusPredictionsPanel';

const PRIMARY = '#0f766e';
const SECONDARY = '#d97706';
const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;

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
      <div className="bonus-page bonus-loading-page">
        <div className="bonus-loading-card"><div className="bonus-loading-ball">🎁</div><p>Chargement des pronostics bonus...</p></div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="bonus-page">
      <div className="bonus-page-container">
        <section className="bonus-hero">
          <div>
            <span className="bonus-page-eyebrow">Coupe du Monde 2026</span>
            <h1>🎁 Pronostics bonus</h1>
            <p>
              Tes paris longue durée avant le coup d’envoi : vainqueurs de groupes, demi-finalistes,
              finaliste perdant et champion du monde.
            </p>
          </div>

          <div className="bonus-hero-summary">
            <div><strong>12</strong><span>groupes</span></div>
            <div><strong>15</strong><span>pts champion</span></div>
            <div><strong>105</strong><span>pts max</span></div>
          </div>
        </section>

        <BonusPredictionsPanel matches={matches} />
      </div>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .bonus-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(217,119,6,.16), transparent 32%),
      radial-gradient(circle at top right, rgba(15,118,110,.2), transparent 34%),
      linear-gradient(135deg, #071b16 0%, #0f172a 45%, #111827 100%);
    padding: 24px 18px 42px;
    color: #0f172a;
  }

  .bonus-page-container {
    width: min(1220px, 100%);
    margin: 0 auto;
  }

  .bonus-hero {
    display: flex;
    justify-content: space-between;
    gap: 22px;
    align-items: stretch;
    margin-bottom: 16px;
    color: white;
  }

  .bonus-page-eyebrow {
    display: inline-flex;
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    font-size: 11px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #fde68a;
    margin-bottom: 10px;
  }

  .bonus-hero h1 {
    margin: 0 0 7px;
    font-size: clamp(28px, 3.4vw, 44px);
    line-height: 1;
    letter-spacing: -.04em;
  }

  .bonus-hero p {
    margin: 0;
    max-width: 690px;
    color: rgba(255,255,255,.78);
    font-size: 14px;
    line-height: 1.5;
  }

  .bonus-hero-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(82px,1fr));
    gap: 8px;
    min-width: 340px;
  }

  .bonus-hero-summary div {
    background: rgba(255,255,255,.1);
    border: 1px solid rgba(255,255,255,.16);
    border-radius: 14px;
    padding: 12px;
    backdrop-filter: blur(10px);
    box-shadow: 0 16px 38px rgba(0,0,0,.16);
  }

  .bonus-hero-summary strong {
    display: block;
    font-size: 25px;
    color: #fde68a;
    line-height: 1;
  }

  .bonus-hero-summary span {
    display: block;
    margin-top: 6px;
    color: rgba(255,255,255,.7);
    font-size: 10px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: .05em;
  }

  .bonus-loading-page { display: grid; place-items: center; }
  .bonus-loading-card { text-align: center; color: white; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); border-radius: 18px; padding: 30px 42px; box-shadow: 0 22px 65px rgba(0,0,0,.22); }
  .bonus-loading-ball { font-size: 42px; margin-bottom: 12px; animation: bonus-bounce 1s infinite; }
  @keyframes bonus-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

  @media (max-width: 920px) {
    .bonus-hero { flex-direction: column; }
    .bonus-hero-summary { min-width: 0; }
  }

  @media (max-width: 560px) {
    .bonus-page { padding: 18px 10px 36px; }
    .bonus-hero-summary { grid-template-columns: 1fr; }
  }
`;

export default BonusPredictions;
