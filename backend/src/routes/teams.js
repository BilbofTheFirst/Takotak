const express = require('express');
const axios = require('axios');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const FOOTBALL_DATA_API = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

// Get team info from football-data.org: last 5 matches + stats
router.get('/:teamName/live-info', authenticateToken, async (req, res) => {
  try {
    const teamName = req.params.teamName;

    // Get FIFA ranking from our DB
    const fifarankResult = await pool.query(
      'SELECT fifa_ranking FROM teams WHERE name = $1',
      [teamName]
    );

    const fifaRanking = fifarankResult.rows[0]?.fifa_ranking || null;

    // Search for team in football-data.org
    const teamsRes = await axios.get(`${FOOTBALL_DATA_API}/teams`, {
      headers: { 'X-Auth-Token': API_KEY }
    });

    // Find team by name (case-insensitive)
    const team = teamsRes.data.teams.find(t =>
      t.name.toLowerCase().includes(teamName.toLowerCase()) ||
      teamName.toLowerCase().includes(t.name.toLowerCase())
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
