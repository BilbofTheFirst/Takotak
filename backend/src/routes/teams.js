const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const worldCupForm = require('../data/worldcup_2026_last5_matches.json');

const router = express.Router();

// Mapping French team names to the English names used in the local JSON file.
const TEAM_NAME_MAPPING = {
  'Mexique': 'Mexico',
  'Afrique du Sud': 'South Africa',
  'Corée du Sud': 'South Korea',
  'République tchèque': 'Czech Republic',
  'Bosnie-Herzégovine': 'Bosnia & Herzegovina',
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

const normalize = (value) =>
  (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const findTeamForm = (teamName) => {
  const englishTeamName = TEAM_NAME_MAPPING[teamName] || teamName;
  const candidates = [teamName, englishTeamName].map(normalize);

  return worldCupForm.teams.find((entry) =>
    candidates.includes(normalize(entry.team)) ||
    candidates.includes(normalize(entry.sourceTeamName))
  );
};

const formatLastMatchesForUi = (teamForm) => {
  if (!teamForm) return [];

  const teamNames = [teamForm.team, teamForm.sourceTeamName].map(normalize);

  return teamForm.lastMatches.map((match) => {
    const isHomeTeam = teamNames.includes(normalize(match.homeTeam));
    const isAwayTeam = teamNames.includes(normalize(match.awayTeam));
    const opponent = isHomeTeam ? match.awayTeam : isAwayTeam ? match.homeTeam : `${match.homeTeam} - ${match.awayTeam}`;

    return {
      opponent,
      result: match.resultForTeam,
      score: `${match.score.home}-${match.score.away}`,
      date: match.date,
      competition: match.competition,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      goals: match.score
    };
  });
};

// Get team info with FIFA ranking + local last 5 matches.
// No external API call here: this endpoint is deterministic and safe for Railway/Vercel usage.
router.get('/:teamName/info', authenticateToken, async (req, res) => {
  try {
    const teamName = req.params.teamName;

    const fifarankResult = await pool.query(
      'SELECT fifa_ranking FROM teams WHERE name = $1',
      [teamName]
    );

    const teamForm = findTeamForm(teamName);

    res.json({
      team: {
        name: teamName,
        sourceName: teamForm?.team || null,
        fifaRanking: fifarankResult.rows[0]?.fifa_ranking || null
      },
      lastMatches: formatLastMatchesForUi(teamForm),
      dataSource: {
        generatedAt: worldCupForm.generatedAt,
        matchDataSource: worldCupForm.matchDataSource
      }
    });
  } catch (error) {
    console.error('Get team info error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
