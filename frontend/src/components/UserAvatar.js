import React, { useEffect, useState } from 'react';
import { buildApiAssetUrl } from '../services/api';

function UserAvatar({ user, photoUrl, displayName, size = 36, className = '' }) {
  const resolvedPhotoUrl = buildApiAssetUrl(photoUrl || user?.avatar_url);
  const resolvedDisplayName = displayName || user?.username || 'Utilisateur';
  const fallbackInitial = resolvedDisplayName.trim().charAt(0).toUpperCase() || '👤';
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedPhotoUrl]);

  return (
    <div
      className={`user-avatar ${className}`.trim()}
      style={{ width: size, height: size, minWidth: size }}
      title={resolvedDisplayName}
      aria-label={resolvedDisplayName}
    >
      {resolvedPhotoUrl && !imageFailed ? (
        <img src={resolvedPhotoUrl} alt={resolvedDisplayName} onError={() => setImageFailed(true)} />
      ) : (
        <span>{fallbackInitial}</span>
      )}
    </div>
  );
}

export default UserAvatar;
