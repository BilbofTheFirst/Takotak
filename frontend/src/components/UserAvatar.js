import React from 'react';
import { buildApiAssetUrl } from '../services/api';

function UserAvatar({ user, photoUrl, displayName, size = 36, className = '' }) {
  const resolvedPhotoUrl = buildApiAssetUrl(photoUrl || user?.avatar_url);
  const resolvedDisplayName = displayName || user?.username || 'Utilisateur';
  const fallbackInitial = resolvedDisplayName.trim().charAt(0).toUpperCase() || '👤';

  return (
    <div
      className={`user-avatar ${className}`.trim()}
      style={{ width: size, height: size, minWidth: size }}
      title={resolvedDisplayName}
      aria-label={resolvedDisplayName}
    >
      {resolvedPhotoUrl ? (
        <img src={resolvedPhotoUrl} alt={resolvedDisplayName} />
      ) : (
        <span>{fallbackInitial}</span>
      )}
    </div>
  );
}

export default UserAvatar;
