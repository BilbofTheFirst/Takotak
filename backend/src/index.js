require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const matchesRoutes = require('./routes/matches');
const predictionsRoutes = require('./routes/predictions');
const bonusPredictionsRoutes = require('./routes/bonusPredictions');
const resultsRoutes = require('./routes/results');
const teamsRoutes = require('./routes/teams');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://takotak.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/bonus-predictions', bonusPredictionsRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/teams', teamsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});
