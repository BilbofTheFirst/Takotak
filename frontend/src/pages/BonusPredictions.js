import React, { useEffect, useState } from 'react';
import { matchesService } from '../services/api';
import BonusPredictionsPanel from '../components/BonusPredictionsPanel';
import SpecialPredictionsPanel from '../components/SpecialPredictionsPanel';
import PageLoader from '../components/PageLoader';

function BonusPredictions() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

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
    return <PageLoader title="Chargement des bonus..." icon="🎁" subtitle="Préparation des grands paris de compétition" />;
  }

  return (
    <div className="bonus-page">
      <div className="bonus-page-container">
        <section className="bonus-hero">
          <div>
            <span className="bonus-page-eyebrow">Coupe du Monde 2026</span>
            <h1>🎁 Pronostics bonus</h1>
            <p>
              Tes grands paris avant le coup d’envoi : vainqueurs de groupes,
              demi-finalistes, finaliste perdant et champion du monde.
              Les spéciaux de journée et des seizièmes rejoignent automatiquement cette page après leur verrouillage.
            </p>
          </div>

          <div className="bonus-hero-summary">
            <div className="bonus-summary-card">
              <div><strong>113</strong><span>pts bonus</span></div>
              <div><strong>12</strong><span>groupes</span></div>
              <div><strong>1</strong><span>champion</span></div>
            </div>
          </div>
        </section>

        <SpecialPredictionsPanel placement="bonus" matchday={1} currentUserId={currentUser?.id} collapsible defaultCollapsed />
        <SpecialPredictionsPanel placement="bonus" matchday={2} currentUserId={currentUser?.id} collapsible defaultCollapsed />
        <SpecialPredictionsPanel placement="bonus" matchday={3} currentUserId={currentUser?.id} collapsible defaultCollapsed />
        <SpecialPredictionsPanel placement="bonus" matchday={4} currentUserId={currentUser?.id} collapsible defaultCollapsed />
        <BonusPredictionsPanel matches={matches} currentUserId={currentUser?.id} collapsible />
      </div>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .bonus-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(217,119,6,.15), transparent 32%),
      radial-gradient(circle at top right, rgba(15,118,110,.18), transparent 32%),
      linear-gradient(135deg, #071b16 0%, #0f172a 45%, #111827 100%);
    padding: 24px 18px 42px;
    color: #0f172a;
  }

  .bonus-page-container {
    width: min(1220px, 100%);
    margin: 0 auto;
    scroll-margin-top: 20px;
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
    font-weight: 800;
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
    color: rgba(255,255,255,.76);
    font-size: 14px;
    line-height: 1.5;
  }

  .bonus-hero-summary {
    min-width: 340px;
    display: flex;
    align-items: stretch;
  }

  .bonus-summary-card {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(70px, 1fr));
    gap: 0;
    background: rgba(255,255,255,.1);
    border: 1px solid rgba(255,255,255,.16);
    border-radius: 16px;
    padding: 12px;
    backdrop-filter: blur(10px);
    box-shadow: 0 16px 38px rgba(0,0,0,.16);
  }

  .bonus-summary-card div {
    min-width: 0;
    padding: 2px 10px;
    text-align: center;
  }

  .bonus-summary-card div + div {
    border-left: 1px solid rgba(255,255,255,.14);
  }

  .bonus-summary-card strong {
    display: block;
    font-size: 25px;
    color: #fde68a;
    line-height: 1;
  }

  .bonus-summary-card span {
    display: block;
    margin-top: 6px;
    color: rgba(255,255,255,.7);
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .05em;
  }

  @media (max-width: 760px) {
    .bonus-page { padding: 18px 10px 36px; }
    .bonus-hero { flex-direction: column; }
    .bonus-hero-summary { min-width: 0; }
    .bonus-summary-card { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .bonus-summary-card div { padding: 2px 6px; }
  }
`;

export default BonusPredictions;
