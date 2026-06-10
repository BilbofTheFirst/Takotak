import React from 'react';
import './TakotakLogo.css';

function TakotakLogo({ size = 'medium', className = '', withBadge = false }) {
  return (
    <span className={`takotak-logo takotak-logo-${size} ${withBadge ? 'takotak-logo-badge' : ''} ${className}`.trim()} aria-label="TakOtak">
      <span className="takotak-logo-text takotak-logo-left">Tak</span>
      <span className="takotak-logo-ball" aria-hidden="true">⚽</span>
      <span className="takotak-logo-text takotak-logo-right">tak</span>
    </span>
  );
}

export default TakotakLogo;
