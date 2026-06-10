import React from 'react';

function Rules() {
  return (
    <div className="rules-page">
      <div className="rules-container">
        <section className="rules-hero">
          <div>
            <span className="rules-eyebrow">Mode d’emploi</span>
            <h1>📋 Règles & points</h1>
            <p>Tout ce qu’il faut savoir pour pronostiquer les matchs, comprendre les bonus et suivre le classement.</p>
          </div>
          <div className="rules-summary">
            <div><strong>3</strong><span>score exact</span></div>
            <div><strong>2</strong><span>différence</span></div>
            <div><strong>105</strong><span>bonus max</span></div>
          </div>
        </section>

        <section className="rules-grid">
          <article className="rules-card intro-card">
            <div className="rules-card-title"><span>Déroulement</span><h2>Comment ça fonctionne</h2></div>
            <div className="steps-list">
              <div><strong>1</strong><span>Inscris-toi avec ton email et crée ton compte.</span></div>
              <div><strong>2</strong><span>Pronostique les matchs avant leur coup d’envoi.</span></div>
              <div><strong>3</strong><span>Complète les bonus avant le début de la compétition.</span></div>
              <div><strong>4</strong><span>Marque des points selon la précision de tes pronostics.</span></div>
              <div><strong>5</strong><span>Compare ton score avec les autres au classement général.</span></div>
            </div>
          </article>

          <article className="rules-card timing-card">
            <div className="rules-card-title"><span>Timing</span><h2>Score pris en compte</h2></div>
            <div className="rule-note green">
              <strong>Phase de groupes</strong>
              <p>Les pronostics portent sur le score à la fin du temps réglementaire, temps additionnel inclus.</p>
            </div>
            <div className="rule-note orange">
              <strong>Phase finale</strong>
              <p>À partir des matchs à élimination directe, le score inclut les prolongations éventuelles, mais jamais les tirs au but.</p>
            </div>
            <div className="rule-note neutral">
              <strong>Match nul</strong>
              <p>Un nul reste possible en phase finale si le match est encore nul après prolongations et se décide ensuite aux tirs au but.</p>
            </div>
          </article>
        </section>

        <section className="rules-card scoring-card">
          <div className="rules-card-title"><span>Barème matchs</span><h2>Pronostics de matchs</h2></div>
          <div className="scoring-grid">
            <div className="scoring-row exact"><span>Score exact</span><em>Prono 2-1, résultat 2-1</em><strong>3 pts</strong></div>
            <div className="scoring-row diff"><span>Bonne différence</span><em>Prono 3-1, résultat 2-0</em><strong>2 pts</strong></div>
            <div className="scoring-row winner"><span>Bon vainqueur ou bon nul</span><em>Prono 1-1, résultat 2-2</em><strong>1 pt</strong></div>
            <div className="scoring-row wrong"><span>Mauvais pronostic</span><em>Prono 2-0, résultat 1-1</em><strong>0 pt</strong></div>
          </div>
        </section>

        <section className="rules-card bonus-card">
          <div className="rules-card-title"><span>Barème bonus</span><h2>Pronostics bonus</h2></div>
          <p className="bonus-intro">Les bonus doivent être complétés avant le début de la compétition. Une fois le premier match commencé, ils sont verrouillés.</p>
          <div className="bonus-rules-grid">
            <div><span>Vainqueur de chaque groupe A à L</span><strong>5 pts / groupe</strong></div>
            <div><span>Champion du monde</span><strong>15 pts</strong></div>
            <div><span>Finaliste perdant</span><strong>10 pts</strong></div>
            <div><span>Demi-finalistes, peu importe l’ordre</span><strong>5 pts / équipe</strong></div>
          </div>
        </section>

        <section className="rules-card important-card">
          <div className="rules-card-title"><span>Important</span><h2>À retenir</h2></div>
          <ul>
            <li>Tu peux modifier un pronostic de match jusqu’à son coup d’envoi.</li>
            <li>Une fois le match commencé, le pronostic du match est bloqué.</li>
            <li>Les matchs nuls sont bien pris en compte dans le barème.</li>
            <li>Pour les matchs à élimination directe, le score utilisé inclut les prolongations si elles ont lieu, mais jamais les tirs au but.</li>
            <li>Les points sont calculés automatiquement après encodage des résultats officiels.</li>
          </ul>
        </section>
      </div>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .rules-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(217,119,6,.15), transparent 32%),
      radial-gradient(circle at top right, rgba(15,118,110,.18), transparent 32%),
      linear-gradient(135deg, #071b16 0%, #0f172a 45%, #111827 100%);
    padding: 24px 18px 42px;
    color: #0f172a;
  }

  .rules-container { width: min(1120px, 100%); margin: 0 auto; }

  .rules-hero {
    display: flex;
    justify-content: space-between;
    gap: 22px;
    align-items: stretch;
    margin-bottom: 16px;
    color: white;
  }

  .rules-eyebrow {
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

  .rules-hero h1 { margin: 0 0 7px; font-size: clamp(28px, 3.4vw, 44px); line-height: 1; letter-spacing: -.04em; }
  .rules-hero p { margin: 0; max-width: 680px; color: rgba(255,255,255,.76); font-size: 14px; line-height: 1.5; }

  .rules-summary { display: grid; grid-template-columns: repeat(3, minmax(82px,1fr)); gap: 8px; min-width: 330px; }
  .rules-summary div { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); border-radius: 14px; padding: 12px; backdrop-filter: blur(10px); box-shadow: 0 16px 38px rgba(0,0,0,.16); }
  .rules-summary strong { display: block; font-size: 25px; color: #fde68a; line-height: 1; }
  .rules-summary span { display: block; margin-top: 6px; color: rgba(255,255,255,.7); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }

  .rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .rules-card { background: rgba(255,255,255,.96); border: 1px solid rgba(255,255,255,.55); border-radius: 18px; padding: 16px; box-shadow: 0 18px 55px rgba(0,0,0,.2); margin-bottom: 14px; }
  .rules-grid .rules-card { margin-bottom: 0; }
  .rules-card-title span { display: block; color: #0f766e; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: .06em; }
  .rules-card-title h2 { margin: 2px 0 14px; color: #0f172a; font-size: 22px; }

  .steps-list { display: grid; gap: 9px; }
  .steps-list div { display: grid; grid-template-columns: 34px 1fr; gap: 10px; align-items: center; padding: 10px; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .steps-list strong { width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; color: white; background: linear-gradient(135deg, #0f766e, #d97706); }
  .steps-list span { color: #334155; font-weight: 850; }

  .rule-note { border-radius: 14px; padding: 12px; margin-bottom: 9px; border: 1px solid #e2e8f0; }
  .rule-note strong { display: block; margin-bottom: 4px; color: #0f172a; }
  .rule-note p { margin: 0; color: #475569; line-height: 1.45; font-size: 13px; }
  .rule-note.green { background: #ecfdf5; border-color: #bbf7d0; }
  .rule-note.orange { background: #fff7ed; border-color: #fed7aa; }
  .rule-note.neutral { background: #f8fafc; }

  .scoring-grid, .bonus-rules-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
  .scoring-row, .bonus-rules-grid div { display: grid; gap: 7px; padding: 13px; border-radius: 15px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .scoring-row span, .bonus-rules-grid span { color: #0f172a; font-weight: 950; }
  .scoring-row em { color: #64748b; font-size: 12px; font-style: normal; line-height: 1.35; }
  .scoring-row strong, .bonus-rules-grid strong { color: #d97706; font-size: 20px; }
  .scoring-row.exact { background: #ecfdf5; border-color: #bbf7d0; }
  .scoring-row.diff { background: #eff6ff; border-color: #bfdbfe; }
  .scoring-row.winner { background: #fff7ed; border-color: #fed7aa; }

  .bonus-intro { margin: 0 0 12px; color: #475569; font-weight: 800; }
  .important-card ul { margin: 0; padding-left: 20px; color: #334155; line-height: 1.6; font-weight: 800; }

  @media (max-width: 920px) { .rules-hero { flex-direction: column; } .rules-summary, .rules-grid, .scoring-grid, .bonus-rules-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 560px) { .rules-page { padding: 18px 10px 36px; } .rules-summary, .rules-grid, .scoring-grid, .bonus-rules-grid { grid-template-columns: 1fr; } }
`;

export default Rules;
