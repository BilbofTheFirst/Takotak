const express = require('express');
const pool = require('../db/pool');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
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

const toComparableDate = (value) => {
  if (!value) return '';
  return value.toString().substring(0, 10);
};

const getTeamNameCandidates = (teamName) => {
  const englishTeamName = TEAM_NAME_MAPPING[teamName] || teamName;
  return [...new Set([teamName, englishTeamName].map(normalize).filter(Boolean))];
};

const findTeamForm = (teamName) => {
  const candidates = getTeamNameCandidates(teamName);

  return worldCupForm.teams.find((entry) =>
    candidates.includes(normalize(entry.team)) ||
    candidates.includes(normalize(entry.sourceTeamName))
  );
};

const getMatchKey = (match) => [
  toComparableDate(match.date),
  normalize(match.homeTeam),
  normalize(match.awayTeam),
  Number(match.score?.home ?? -1),
  Number(match.score?.away ?? -1)
].join('|');

const calculateResultForTeam = (match, teamName) => {
  const teamCandidates = getTeamNameCandidates(teamName);
  const isHomeTeam = teamCandidates.includes(normalize(match.homeTeam));
  const isAwayTeam = teamCandidates.includes(normalize(match.awayTeam));

  if (!isHomeTeam && !isAwayTeam) return match.resultForTeam || null;

  const goalsFor = isHomeTeam ? Number(match.score.home) : Number(match.score.away);
  const goalsAgainst = isHomeTeam ? Number(match.score.away) : Number(match.score.home);

  if (goalsFor > goalsAgainst) return 'W';
  if (goalsFor < goalsAgainst) return 'L';
  return 'D';
};

const getFinishedWorldCupMatchesForTeam = async (clientOrPool, teamName) => {
  const result = await clientOrPool.query(
    `SELECT
       m.id,
       to_char(m.start_time, 'YYYY-MM-DD') AS match_date,
       COALESCE(m.description, 'Coupe du Monde 2026') AS competition,
       t1.name AS home_team,
       t2.name AS away_team,
       r.team1_goals,
       r.team2_goals
     FROM matches m
     JOIN results r ON r.match_id = m.id
     JOIN teams t1 ON t1.id = m.team1_id
     JOIN teams t2 ON t2.id = m.team2_id
     WHERE COALESCE(m.status, 'scheduled') = 'finished'
       AND (t1.name = $1 OR t2.name = $1)
     ORDER BY m.start_time DESC NULLS LAST, m.id DESC`,
    [teamName]
  );

  return result.rows.map((row) => ({
    date: row.match_date,
    competition: row.competition,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    score: {
      home: Number(row.team1_goals),
      away: Number(row.team2_goals)
    }
  }));
};

const buildLastMatches = async (clientOrPool, teamName) => {
  const teamForm = findTeamForm(teamName);
  const historicalMatches = teamForm?.lastMatches || [];
  const worldCupMatches = await getFinishedWorldCupMatchesForTeam(clientOrPool, teamName);
  const seen = new Set();

  return [...worldCupMatches, ...historicalMatches]
    .map((match) => ({
      ...match,
      date: toComparableDate(match.date),
      resultForTeam: calculateResultForTeam(match, teamName)
    }))
    .sort((a, b) => {
      const dateCompare = toComparableDate(b.date).localeCompare(toComparableDate(a.date));
      if (dateCompare !== 0) return dateCompare;
      return getMatchKey(b).localeCompare(getMatchKey(a));
    })
    .filter((match) => {
      const key = getMatchKey(match);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
};

const formatLastMatchesForUi = (lastMatches, teamName) => {
  return lastMatches.map((match) => {
    const teamCandidates = getTeamNameCandidates(teamName);
    const isHomeTeam = teamCandidates.includes(normalize(match.homeTeam));
    const isAwayTeam = teamCandidates.includes(normalize(match.awayTeam));
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

// Admin endpoint: rebuild the current form for every team from historical JSON + finished World Cup matches.
// Nothing is persisted because the public endpoint now computes the up-to-date form from the database.
router.get('/admin/forms/rebuild', authenticateAdmin, async (req, res) => {
  try {
    const teamsResult = await pool.query('SELECT id, name FROM teams ORDER BY name');
    const teams = await Promise.all(teamsResult.rows.map(async (team) => {
      const teamForm = findTeamForm(team.name);
      const lastMatches = await buildLastMatches(pool, team.name);

      return {
        id: team.id,
        name: team.name,
        sourceName: teamForm?.team || null,
        historicalMatchesCount: teamForm?.lastMatches?.length || 0,
        currentMatchesCount: lastMatches.length,
        lastMatches: formatLastMatchesForUi(lastMatches, team.name)
      };
    }));

    res.json({
      generatedAt: new Date().toISOString(),
      teamCount: teams.length,
      teamsWithoutCurrentForm: teams.filter((team) => team.currentMatchesCount === 0).map((team) => team.name),
      teams
    });
  } catch (error) {
    console.error('Rebuild team forms error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team info with FIFA ranking + local last 5 matches + finished World Cup matches.
// No external API call here: this endpoint is deterministic and safe for Railway/Vercel usage.
router.get('/:teamName/info', authenticateToken, async (req, res) => {
  try {
    const teamName = req.params.teamName;

    const fifarankResult = await pool.query(
      'SELECT fifa_ranking FROM teams WHERE name = $1',
      [teamName]
    );

    const teamForm = findTeamForm(teamName);
    const lastMatches = await buildLastMatches(pool, teamName);

    res.json({
      team: {
        name: teamName,
        sourceName: teamForm?.team || null,
        fifaRanking: fifarankResult.rows[0]?.fifa_ranking || null
      },
      lastMatches: formatLastMatchesForUi(lastMatches, teamName),
      dataSource: {
        generatedAt: worldCupForm.generatedAt,
        matchDataSource: `${worldCupForm.matchDataSource} + résultats Coupe du Monde encodés dans Takotak`,
        includesFinishedWorldCupMatches: true
      }
    });
  } catch (error) {
    console.error('Get team info error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
