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
  getLeaderboard: () => api.get('/results/leaderboard')
};

export const teamsService = {
  getLiveInfo: (teamName) => api.get(`/teams/${encodeURIComponent(teamName)}/live-info`)
};

export default api;
