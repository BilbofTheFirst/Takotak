const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get team info: FIFA ranking + last 5 matches
// Accepte soit l'ID soit le nom de l'équipe
router.get('/:teamIdentifier/info', authenticateToken, async (req, res) => {
  try {
    const teamIdentifier = req.params.teamIdentifier;

    // Try to get team by ID or name
    const teamResult = await pool.query(
      'SELECT id, name, groupe, fifa_ranking FROM teams WHERE id = $1 OR name = $2',
      [isNaN(teamIdentifier) ? null : parseInt(teamIdentifier), teamIdentifier]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teamResult.rows[0];

    // Get last 5 matches where this team played
    const matchesResult = await pool.query(`
      SELECT
        m.id,
        m.team1_id,
        m.team2_id,
        t1.name as team1,
        t2.name as team2,
        m.start_time,
        m.status,
        r.team1_goals,
        r.team2_goals
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN results r ON m.id = r.match_id
      WHERE (m.team1_id = $1 OR m.team2_id = $1)
        AND m.status != 'pending'
      ORDER BY m.start_time DESC
      LIMIT 5
    `, [teamId]);

    const matches = matchesResult.rows.map(match => {
      const isTeam1 = match.team1_id === teamId;
      const goalsFor = isTeam1 ? match.team1_goals : match.team2_goals;
      const goalsAgainst = isTeam1 ? match.team2_goals : match.team1_goals;
      const opponent = isTeam1 ? match.team2 : match.team1;

      let result = 'vs';
      if (match.team1_goals !== null) {
        if (goalsFor > goalsAgainst) result = 'W';
        else if (goalsFor < goalsAgainst) result = 'L';
        else result = 'D';
      }

      return {
        opponent,
        result,
        score: match.team1_goals !== null ? `${goalsFor}-${goalsAgainst}` : '-',
        date: match.start_time
      };
    });

    res.json({
      team,
      lastMatches: matches.reverse() // Reverse to get chronological order (oldest first)
    });
  } catch (error) {
    console.error('Get team info error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
