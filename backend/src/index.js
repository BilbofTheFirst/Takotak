require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');
const { ensureSchema } = require('./db/ensureSchema');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const adminUsersRoutes = require('./routes/adminUsers');
const matchesRoutes = require('./routes/matches');
const predictionsRoutes = require('./routes/predictions');
const bonusPredictionsRoutes = require('./routes/bonusPredictions');
const specialPredictionsRoutes = require('./routes/specialPredictions');
const resultsRoutes = require('./routes/results');
const statsRoutes = require('./routes/stats');
const teamsRoutes = require('./routes/teams');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://takotak.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminUsersRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/bonus-predictions', bonusPredictionsRoutes);
app.use('/api/special-predictions', specialPredictionsRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/teams', teamsRoutes);

const PORT = process.env.PORT || 3001;

ensureSchema(pool)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Database schema initialization failed:', error);
    throw error;
  });
