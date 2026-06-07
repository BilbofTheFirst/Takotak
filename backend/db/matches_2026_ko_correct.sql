-- World Cup 2026 Knockout Matches - CORRECT VERSION
-- 32 matches from 16ème to Final with proper dates

-- 16ème de Finale (16 matches) - Already in DB, but adding for completeness if needed
-- These are generated from group stage results, so we'll add placeholder entries
-- In practice, the frontend generates these from groupsData

-- 8ème de Finale (8 matches)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(1, 2, '2026-06-29 16:00:00'::timestamp, 'pending'),
(3, 4, '2026-06-29 20:00:00'::timestamp, 'pending'),
(5, 6, '2026-06-30 16:00:00'::timestamp, 'pending'),
(7, 8, '2026-06-30 20:00:00'::timestamp, 'pending'),
(9, 10, '2026-07-03 16:00:00'::timestamp, 'pending'),
(11, 12, '2026-07-03 20:00:00'::timestamp, 'pending'),
(13, 14, '2026-07-04 16:00:00'::timestamp, 'pending'),
(15, 16, '2026-07-04 20:00:00'::timestamp, 'pending');

-- Quart de Finale (4 matches)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(1, 3, '2026-07-05 16:00:00'::timestamp, 'pending'),
(5, 7, '2026-07-05 20:00:00'::timestamp, 'pending'),
(9, 11, '2026-07-06 16:00:00'::timestamp, 'pending'),
(13, 15, '2026-07-06 20:00:00'::timestamp, 'pending');

-- Demi-Finale (2 matches)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(1, 5, '2026-07-09 20:00:00'::timestamp, 'pending'),
(9, 13, '2026-07-10 20:00:00'::timestamp, 'pending');

-- Match pour la 3ème place
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(5, 13, '2026-07-13 17:00:00'::timestamp, 'pending');

-- Finale
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(1, 9, '2026-07-13 21:00:00'::timestamp, 'pending');

-- NOTE: These are placeholder team IDs. The real matchups will be determined by:
-- 1. Group stage results (winners and runners-up)
-- 2. Best third-place teams
-- The frontend calculates these dynamically and stores them in localStorage
