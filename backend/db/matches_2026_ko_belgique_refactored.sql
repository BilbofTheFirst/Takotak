-- World Cup 2026 Knockout Round Matches (refactored with team IDs)

-- 16ème de Finale (16 matches)
-- Winners from Group Stage + 4 best 3rd place teams
INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Gagnant A'),
  (SELECT id FROM teams WHERE name = 'Deuxième B'),
  '2026-06-29 16:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Gagnant C'), (SELECT id FROM teams WHERE name = 'Deuxième D'), '2026-06-29 20:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Gagnant E'), (SELECT id FROM teams WHERE name = 'Deuxième F'), '2026-06-30 16:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Gagnant G'), (SELECT id FROM teams WHERE name = 'Deuxième H'), '2026-06-30 20:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Gagnant B'), (SELECT id FROM teams WHERE name = 'Deuxième A'), '2026-07-01 16:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Gagnant D'), (SELECT id FROM teams WHERE name = 'Deuxième C'), '2026-07-01 20:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Gagnant F'), (SELECT id FROM teams WHERE name = 'Deuxième E'), '2026-07-02 16:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Gagnant H'), (SELECT id FROM teams WHERE name = 'Deuxième G'), '2026-07-02 20:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Gagnant I'), (SELECT id FROM teams WHERE name = 'Deuxième J'), '2026-07-03 16:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Gagnant K'), (SELECT id FROM teams WHERE name = 'Deuxième L'), '2026-07-03 20:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Gagnant J'), (SELECT id FROM teams WHERE name = 'Deuxième I'), '2026-07-04 16:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Gagnant L'), (SELECT id FROM teams WHERE name = 'Deuxième K'), '2026-07-04 20:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Meilleur 3e #1'), (SELECT id FROM teams WHERE name = 'Gagnant B'), '2026-07-05 16:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Meilleur 3e #2'), (SELECT id FROM teams WHERE name = 'Gagnant D'), '2026-07-05 20:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Meilleur 3e #3'), (SELECT id FROM teams WHERE name = 'Gagnant F'), '2026-07-06 16:00:00', 'pending'
UNION ALL
SELECT (SELECT id FROM teams WHERE name = 'Meilleur 3e #4'), (SELECT id FROM teams WHERE name = 'Gagnant H'), '2026-07-06 20:00:00', 'pending';

-- NOTE: The knockout matches would normally reference the winners of previous matches
-- In a real implementation, you'd want to:
-- 1. Use stored procedures or triggers to auto-populate team1_id/team2_id based on winners
-- 2. Or use application logic to determine matchups based on group results

-- For now, the above is a template showing the structure.
-- The actual knockout schedule depends on group stage results which are determined in the simulation.
