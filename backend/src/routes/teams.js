const express = require('express');
const axios = require('axios');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const FOOTBALL_DATA_API = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

// Mapping French team names to English
const TEAM_NAME_MAPPING = {
  'Mexique': 'Mexico',
  'Afrique du Sud': 'South Africa',
  'Corée du Sud': 'South Korea',
  'République tchèque': 'Czech Republic',
  'Bosnie-Herzégovine': 'Bosnia and Herzegovina',
  'Brésil': 'Brazil',
  'Maroc': 'Morocco',
  'Haïti': 'Haiti',
  'Écosse': 'Scotland',
  'États-Unis': 'United States',
  'Paraguay': 'Paraguay',
  'Australie': 'Australia',
  'Turquie': 'Turkey',
  'Allemagne': 'Germany',
  'Curaçao': 'Curaçao',
  'Côte d\'Ivoire': 'Ivory Coast',
  'Équateur': 'Ecuador',
  'Pays-Bas': 'Netherlands',
  'Japon': 'Japan',
  'Espagne': 'Spain',
  'Suède': 'Sweden',
  'Tunisie': 'Tunisia',
  'Cap-Vert': 'Cape Verde',
  'Belgique': 'Belgium',
  'Égypte': 'Egypt',
  'Iran': 'Iran',
  'Nouvelle-Zélande': 'New Zealand',
  'Arabie saoudite': 'Saudi Arabia',
  'Uruguay': 'Uruguay',
  'France': 'France',
  'Sénégal': 'Senegal',
  'Irak': 'Iraq',
  'Norvège': 'Norway',
  'Argentine': 'Argentina',
  'Algérie': 'Algeria',
  'Autriche': 'Austria',
  'Jordanie': 'Jordan',
  'Portugal': 'Portugal',
  'RD Congo': 'Democratic Republic of the Congo',
  'Ouzbékistan': 'Uzbekistan',
  'Colombie': 'Colombia',
  'Angleterre': 'England',
  'Croatie': 'Croatia',
  'Ghana': 'Ghana',
  'Panama': 'Panama'
};

// Get team info from football-data.org: last 5 matches + stats
router.get('/:teamName/live-info', authenticateToken, async (req, res) => {
  try {
    const frenchTeamName = req.params.teamName;

    // Get FIFA ranking from our DB
    const fifarankResult = await pool.query(
      'SELECT fifa_ranking FROM teams WHERE name = $1',
      [frenchTeamName]
    );

    const fifaRanking = fifarankResult.rows[0]?.fifa_ranking || null;

    // Convert French name to English for API search
    const englishTeamName = TEAM_NAME_MAPPING[frenchTeamName] || frenchTeamName;

    // Search for team in football-data.org
    const teamsRes = await axios.get(`${FOOTBALL_DATA_API}/teams`, {
      headers: { 'X-Auth-Token': API_KEY }
    });

    // Find team by name (exact match or partial match)
    const team = teamsRes.data.teams.find(t =>
      t.name.toLowerCase() === englishTeamName.toLowerCase() ||
      t.name.toLowerCase().includes(englishTeamName.toLowerCase())
    );

    if (!team) {
      return res.status(404).json({ error: 'Team not found in external API' });
    }

    // Get team's last matches
    const matchesRes = await axios.get(`${FOOTBALL_DATA_API}/teams/${team.id}/matches`, {
      headers: { 'X-Auth-Token': API_KEY },
      params: { limit: 10, status: 'FINISHED' }
    });

    const matches = (matchesRes.data.matches || []).slice(0, 5).map(match => {
      const isHome = match.homeTeam.id === team.id;
      const goalsFor = isHome ? match.score.fullTime.home : match.score.fullTime.away;
      const goalsAgainst = isHome ? match.score.fullTime.away : match.score.fullTime.home;
      const opponent = isHome ? match.awayTeam.name : match.homeTeam.name;

      let result = 'vs';
      if (goalsFor !== null && goalsAgainst !== null) {
        if (goalsFor > goalsAgainst) result = 'W';
        else if (goalsFor < goalsAgainst) result = 'L';
        else result = 'D';
      }

      return {
        opponent,
        result,
        score: goalsFor !== null ? `${goalsFor}-${goalsAgainst}` : '-',
        date: match.utcDate
      };
    });

    res.json({
      team: {
        name: team.name,
        fifaRanking
      },
      lastMatches: matches
    });
  } catch (error) {
    console.error('Get team live info error:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des infos' });
  }
});

module.exports = router;
