import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
export const AUTH_SESSION_EXPIRED_EVENT = 'takotak:auth-session-expired';
let authExpirationDispatched = false;

export const buildApiAssetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const apiRoot = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  return apiRoot + '/api' + normalizedPath;
};

const expireLocalSession = () => {
  if (!localStorage.getItem('token')) return;

  localStorage.removeItem('token');
  localStorage.removeItem('user');

  if (authExpirationDispatched) return;
  authExpirationDispatched = true;

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, {
    detail: { reason: 'auth_failed' }
  }));

  window.setTimeout(() => {
    window.location.replace('/');
  }, 0);
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    if ((status === 401 || status === 403) && localStorage.getItem('token')) {
      console.warn('Authentication/authorization error, expiring local session', error.response?.data);
      expireLocalSession();
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password })
};

export const passwordResetService = {
  request: (email) => api.post('/password-reset/request', { email }),
  confirm: (token, newPassword, confirmPassword) =>
    api.post('/password-reset/confirm', { token, newPassword, confirmPassword })
};

export const profileService = {
  getMe: () => api.get('/profile/me'),
  changePassword: (currentPassword, newPassword, confirmPassword) =>
    api.post('/profile/me/change-password', { currentPassword, newPassword, confirmPassword }),
  updateAvatar: (imageData) => api.put('/profile/me/avatar', { imageData }),
  deleteAvatar: () => api.delete('/profile/me/avatar')
};

export const matchesService = {
  getAll: () => api.get('/matches'),
  getOne: (id) => api.get(`/matches/${id}`)
};

export const predictionsService = {
  create: (match_id, team1_goals, team2_goals) =>
    api.post('/predictions', { match_id, team1_goals, team2_goals }),
  getAll: () => api.get('/predictions'),
  getPublicForMatch: (match_id) => api.get(`/predictions/match/${match_id}/public`)
};

export const bonusPredictionsService = {
  get: () => api.get('/bonus-predictions'),
  getPublic: () => api.get('/bonus-predictions/public'),
  save: (payload) => api.post('/bonus-predictions', payload)
};

export const specialPredictionsService = {
  get: (matchday = 1) => api.get('/special-predictions', { params: { matchday } }),
  getPublic: (matchday = 1) => api.get('/special-predictions/public', { params: { matchday } }),
  save: (payload, matchday = 1) => api.post('/special-predictions', payload, { params: { matchday } })
};

export const resultsService = {
  create: (payloadOrMatchId, team1_goals, team2_goals) => {
    const payload = typeof payloadOrMatchId === 'object'
      ? payloadOrMatchId
      : { match_id: payloadOrMatchId, team1_goals, team2_goals };
    return api.post('/results', payload);
  },
  delete: (match_id) => api.delete(`/results/${match_id}`),
  getThirdPlaces: () => api.get('/results/third-places'),
  saveThirdPlaceOrder: (group_codes) => api.post('/results/third-places/order', { group_codes }),
  getLeaderboard: () => api.get('/results/leaderboard'),
  getLeaderboardProgression: () => api.get('/results/leaderboard/progression'),
  getUserStats: () => api.get('/results/user/stats')
};

export const statsService = {
  getOverview: () => api.get('/stats/overview')
};

export const teamsService = {
  getInfo: (teamName) => api.get(`/teams/${encodeURIComponent(teamName)}/info`)
};

export default api;
