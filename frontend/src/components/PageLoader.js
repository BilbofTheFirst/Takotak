import React from 'react';

function PageLoader({ title = 'Chargement...', icon = '⚽', subtitle = 'Préparation des données TakoTak' }) {
  return (
    <div className="takotak-loader-page">
      <div className="takotak-loader-card">
        <div className="takotak-loader-ball">{icon}</div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <style>{`
        .takotak-loader-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(217,119,6,.15), transparent 32%),
            radial-gradient(circle at top right, rgba(15,118,110,.18), transparent 32%),
            linear-gradient(135deg, #071b16 0%, #0f172a 45%, #111827 100%);
        }

        .takotak-loader-card {
          width: min(360px, 100%);
          text-align: center;
          color: white;
          background: rgba(255,255,255,.1);
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 22px;
          padding: 34px 38px;
          box-shadow: 0 22px 65px rgba(0,0,0,.22);
          backdrop-filter: blur(12px);
        }

        .takotak-loader-ball {
          width: 58px;
          height: 58px;
          margin: 0 auto 14px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.18);
          font-size: 36px;
          animation: takotak-loader-bounce 1s infinite;
          box-shadow: 0 12px 28px rgba(0,0,0,.18);
        }

        .takotak-loader-card h2 {
          margin: 0 0 8px;
          font-size: 22px;
          letter-spacing: -.02em;
        }

        .takotak-loader-card p {
          margin: 0;
          color: rgba(255,255,255,.72);
          font-size: 13px;
          font-weight: 750;
        }

        @keyframes takotak-loader-bounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-8deg); }
        }
      `}</style>
    </div>
  );
}

export default PageLoader;
