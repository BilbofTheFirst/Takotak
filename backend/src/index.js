require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const matchesRoutes = require('./routes/matches');
const predictionsRoutes = require('./routes/predictions');
const resultsRoutes = require('./routes/results');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/results', resultsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});
