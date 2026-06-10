import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { passwordResetService } from '../services/api';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const PRIMARY = '#2563eb';
  const SECONDARY = '#ec4899';
  const GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Lien de réinitialisation invalide ou incomplet.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    try {
      setLoading(true);
      await passwordResetService.confirm(token, newPassword, confirmPassword);
      setSuccess('Mot de passe modifié avec succès. Tu peux te connecter.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de réinitialiser le mot de passe');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '450px', background: 'white', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ background: GRADIENT, padding: '40px 20px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontSize: '48px', margin: '0 0 10px 0' }}>🔐</h1>
          <h2 style={{ fontSize: '30px', margin: '0 0 5px 0', fontWeight: 'bold' }}>Nouveau mot de passe</h2>
          <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>TakoTak</p>
        </div>

        <div style={{ padding: '40px' }}>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '22px', marginBottom: '5px', color: '#333' }}>Réinitialisation</h3>
            <p style={{ color: '#999', margin: '0', fontSize: '14px' }}>
              Choisis un nouveau mot de passe d’au moins 8 caractères.
            </p>
          </div>

          {!token && (
            <div style={alertStyle('#fee', '#fcc', '#c33')}>
              ❌ Lien de réinitialisation invalide ou incomplet.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={labelStyle}>Nouveau mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading || !token}
                style={inputStyle(loading || !token)}
                onFocus={(e) => e.target.style.borderColor = PRIMARY}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div>
              <label style={labelStyle}>Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading || !token}
                style={inputStyle(loading || !token)}
                onFocus={(e) => e.target.style.borderColor = PRIMARY}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            {error && <div style={alertStyle('#fee', '#fcc', '#c33')}>❌ {error}</div>}
            {success && <div style={alertStyle('#efe', '#cfc', '#3c3')}>✅ {success}</div>}

            <button
              type="submit"
              disabled={loading || !token}
              style={{
                padding: '14px',
                background: loading || !token ? '#ccc' : GRADIENT,
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading || !token ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: loading || !token ? 0.7 : 1
              }}
            >
              {loading ? 'Modification...' : 'Modifier mon mot de passe'}
            </button>
          </form>

          <div style={{ marginTop: '25px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
            <Link to="/" style={{ color: PRIMARY, fontSize: '14px', fontWeight: 'bold' }}>
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  fontWeight: '500',
  color: '#555'
};

const inputStyle = (loading) => ({
  width: '100%',
  padding: '12px',
  border: '2px solid #e0e0e0',
  borderRadius: '10px',
  fontSize: '14px',
  transition: 'all 0.3s',
  boxSizing: 'border-box',
  cursor: loading ? 'not-allowed' : 'text',
  opacity: loading ? 0.6 : 1
});

const alertStyle = (background, border, color) => ({
  padding: '12px',
  marginBottom: '15px',
  background,
  border: `1px solid ${border}`,
  borderRadius: '10px',
  color,
  fontSize: '14px'
});

export default ResetPassword;
