import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add JWT token to requests
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
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Keep it soft: do not auto-redirect from public pages such as rankings.
      console.warn('Authentication/authorization error', error.response?.data);
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

export const matchesService = {
  getAll: () => api.get('/matches'),
  getOne: (id) => api.get(`/matches/${id}`)
};

export const predictionsService = {
  create: (match_id, team1_goals, team2_goals) =>
    api.post('/predictions', { match_id, team1_goals, team2_goals }),
  getAll: () => api.get('/predictions')
};

export const resultsService = {
  create: (match_id, team1_goals, team2_goals) =>
    api.post('/results', { match_id, team1_goals, team2_goals }),
  getLeaderboard: () => api.get('/results/leaderboard'),
  getUserStats: () => api.get('/results/user/stats')
};

export const teamsService = {
  getInfo: (teamName) => api.get(`/teams/${encodeURIComponent(teamName)}/info`)
};

export default api;
