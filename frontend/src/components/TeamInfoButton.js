import React from 'react';

function TeamInfoButton({ teamName, onClick }) {
  return (
    <button
      onClick={() => onClick(teamName)}
      style={{
        background: 'none',
        border: 'none',
        fontSize: '14px',
        cursor: 'pointer',
        padding: '2px 4px',
        color: '#2563eb',
        hover: { opacity: 0.7 },
        transition: 'opacity 0.2s'
      }}
      title={`Infos sur ${teamName}`}
    >
      ℹ️
    </button>
  );
}

export default TeamInfoButton;
