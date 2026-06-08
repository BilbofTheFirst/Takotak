const express = require('express');
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

// Get team info with FIFA ranking + last 5 matches from football-data.org
router.get('/:teamName/info', authenticateToken, async (req, res) => {
  try {
    const frenchTeamName = req.params.teamName;

    // Get FIFA ranking from DB
    const fifarankResult = await pool.query(
      'SELECT fifa_ranking FROM teams WHERE name = $1',
      [frenchTeamName]
    );

    const fifaRanking = fifarankResult.rows[0]?.fifa_ranking || null;

    // Convert to English for API
    const englishTeamName = TEAM_NAME_MAPPING[frenchTeamName] || frenchTeamName;

    console.log(`[TEAMS] Fetching info for: ${frenchTeamName} (English: ${englishTeamName})`);
    console.log(`[TEAMS] API Key present: ${!!API_KEY}`);

    // Fetch teams from football-data.org using native fetch
    const teamsResponse = await fetch(`${FOOTBALL_DATA_API}/teams`, {
      headers: { 'X-Auth-Token': API_KEY }
    });

    console.log(`[TEAMS] Teams API status: ${teamsResponse.status}`);

    if (!teamsResponse.ok) {
      console.log(`[TEAMS] Teams API failed, returning FIFA ranking only`);
      return res.json({
        team: { name: frenchTeamName, fifaRanking },
        lastMatches: []
      });
    }

    const teamsData = await teamsResponse.json();
    const team = teamsData.teams?.find(t =>
      t.name.toLowerCase() === englishTeamName.toLowerCase() ||
      t.name.toLowerCase().includes(englishTeamName.toLowerCase())
    );

    console.log(`[TEAMS] Team found: ${team?.name} (ID: ${team?.id})`);

    if (!team) {
      console.log(`[TEAMS] Team not found in API`);
      return res.json({
        team: { name: frenchTeamName, fifaRanking },
        lastMatches: []
      });
    }

    // Fetch team's matches (ALL matches, no status filter)
    console.log(`[TEAMS] Fetching matches for team ID: ${team.id}`);
    const matchesResponse = await fetch(
      `${FOOTBALL_DATA_API}/teams/${team.id}/matches?limit=20`,
      { headers: { 'X-Auth-Token': API_KEY } }
    );

    console.log(`[TEAMS] Matches API status: ${matchesResponse.status}`);

    let matches = [];
    if (matchesResponse.ok) {
      const matchesData = await matchesResponse.json();
      console.log(`[TEAMS] Total matches from API: ${matchesData.matches?.length || 0}`);
      console.log(`[TEAMS] Raw matches:`, JSON.stringify(matchesData.matches?.slice(0, 2)));

      // Filter for finished matches only
      const finishedMatches = (matchesData.matches || []).filter(m => m.status === 'FINISHED');
      console.log(`[TEAMS] Finished matches: ${finishedMatches.length}`);

      matches = finishedMatches.slice(0, 5).map(match => {
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
    }

    res.json({
      team: { name: frenchTeamName, fifaRanking },
      lastMatches: matches
    });
  } catch (error) {
    console.error('Get team info error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
