import React, { useEffect, useMemo, useState } from 'react';
import { profileService, buildApiAssetUrl } from '../services/api';
import UserAvatar from '../components/UserAvatar';

const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function Profile({ user, onUserUpdate }) {
  const [profileUser, setProfileUser] = useState(user);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [selectedImageData, setSelectedImageData] = useState('');
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [savingAvatar, setSavingAvatar] = useState(false);

  const avatarPreviewUrl = useMemo(() => {
    if (selectedImageData) return selectedImageData;
    return buildApiAssetUrl(profileUser?.avatar_url);
  }, [profileUser, selectedImageData]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setProfileError('');
        const response = await profileService.getMe();
        if (!active) return;
        setProfileUser(response.data.user);
        onUserUpdate(response.data.user);
      } catch (error) {
        if (!active) return;
        setProfileError(error.response?.data?.error || 'Impossible de charger ton profil');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [onUserUpdate]);

  const handleUserUpdate = (updatedUser) => {
    setProfileUser(updatedUser);
    onUserUpdate(updatedUser);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    try {
      setSavingPassword(true);
      await profileService.changePassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Mot de passe modifié avec succès.');
    } catch (error) {
      setPasswordError(error.response?.data?.error || 'Impossible de modifier le mot de passe');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    setAvatarMessage('');
    setAvatarError('');

    if (!file) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Choisis une image PNG, JPG ou WebP.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setAvatarError('La photo est trop lourde. Maximum 3 Mo.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageData(String(reader.result || ''));
    };
    reader.onerror = () => {
      setAvatarError('Impossible de lire cette image.');
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarSubmit = async () => {
    setAvatarMessage('');
    setAvatarError('');

    if (!selectedImageData) {
      setAvatarError('Choisis une photo avant d’enregistrer.');
      return;
    }

    try {
      setSavingAvatar(true);
      const response = await profileService.updateAvatar(selectedImageData);
      handleUserUpdate(response.data.user);
      setSelectedImageData('');
      setAvatarMessage('Photo de profil enregistrée.');
    } catch (error) {
      setAvatarError(error.response?.data?.error || 'Impossible d’enregistrer la photo');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    setAvatarMessage('');
    setAvatarError('');

    try {
      setSavingAvatar(true);
      const response = await profileService.deleteAvatar();
      handleUserUpdate(response.data.user);
      setSelectedImageData('');
      setAvatarMessage('Photo de profil supprimée.');
    } catch (error) {
      setAvatarError(error.response?.data?.error || 'Impossible de supprimer la photo');
    } finally {
      setSavingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-ball">👤</div>
          <p>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell profile-page">
      <div className="page-container profile-container">
        <div className="section-title">
          <div>
            <h1>👤 Mon profil</h1>
            <p>Gère ton mot de passe et ta photo de profil TakoTak.</p>
          </div>
        </div>

        {profileError && <div className="alert alert-error">❌ {profileError}</div>}

        <div className="profile-grid">
          <section className="card profile-card profile-summary-card">
            <div className="profile-identity">
              <UserAvatar user={profileUser} photoUrl={avatarPreviewUrl} size={112} />
              <div>
                <h2>{profileUser?.username}</h2>
                <p>{profileUser?.email}</p>
                {profileUser?.is_admin && <span className="badge">⚙️ Admin</span>}
              </div>
            </div>
          </section>

          <section className="card profile-card">
            <div className="section-title compact-title">
              <div>
                <h2>📸 Photo de profil</h2>
                <p>Elle sera affichée en rond, et réutilisable plus tard dans les classements.</p>
              </div>
            </div>

            <div className="avatar-editor-layout">
              <div className="avatar-large-preview">
                {avatarPreviewUrl ? (
                  <img src={avatarPreviewUrl} alt="Aperçu avatar" />
                ) : (
                  <span>{profileUser?.username?.charAt(0)?.toUpperCase() || '👤'}</span>
                )}
              </div>

              <div className="avatar-actions">
                <label className="file-picker">
                  <span>Choisir une photo</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarFileChange} />
                </label>
                <p className="field-help">PNG, JPG ou WebP. Maximum 3 Mo. L’image est affichée avec un calque rond.</p>
              </div>
            </div>

            {avatarError && <div className="alert alert-error">❌ {avatarError}</div>}
            {avatarMessage && <div className="alert alert-success">✅ {avatarMessage}</div>}

            <div className="profile-actions-row">
              <button className="button" onClick={handleAvatarSubmit} disabled={savingAvatar || !selectedImageData}>
                {savingAvatar ? 'Enregistrement...' : 'Enregistrer la photo'}
              </button>
              <button className="button button-secondary" onClick={() => setSelectedImageData('')} disabled={savingAvatar || !selectedImageData}>
                Annuler
              </button>
              <button className="button button-danger" onClick={handleAvatarDelete} disabled={savingAvatar || (!profileUser?.avatar_url && !selectedImageData)}>
                Supprimer
              </button>
            </div>
          </section>

          <section className="card profile-card">
            <div className="section-title compact-title">
              <div>
                <h2>🔐 Mot de passe</h2>
                <p>Modifie ton mot de passe en confirmant l’ancien.</p>
              </div>
            </div>

            <form className="profile-form" onSubmit={handlePasswordSubmit}>
              <label>
                Mot de passe actuel
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>

              <label>
                Nouveau mot de passe
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label>
                Confirmer le nouveau mot de passe
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              {passwordError && <div className="alert alert-error">❌ {passwordError}</div>}
              {passwordMessage && <div className="alert alert-success">✅ {passwordMessage}</div>}

              <div className="profile-actions-row">
                <button className="button" type="submit" disabled={savingPassword}>
                  {savingPassword ? 'Modification...' : 'Modifier le mot de passe'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Profile;
