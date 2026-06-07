-- World Cup 2026 Knockout Matches - CORRECT DATES
-- Using NULL for team IDs since they're determined by group results
-- Dates are in UTC+2 (Belgium time)

-- 16ème de Finale (16 matches) - June 29 to July 6
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-06-29 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-06-29 20:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-06-30 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-06-30 20:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-01 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-01 20:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-02 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-02 20:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-03 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-03 20:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-04 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-04 20:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-05 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-05 20:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-06 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-06 20:00:00'::timestamp, 'pending');

-- 8ème de Finale (8 matches) - July 9-10
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-09 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-09 20:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-10 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-10 20:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-11 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-11 20:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-12 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-12 20:00:00'::timestamp, 'pending');

-- Quart de Finale (4 matches) - July 14-15
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-14 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-14 20:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-15 16:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-15 20:00:00'::timestamp, 'pending');

-- Demi-Finale (2 matches) - July 18-19
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-18 20:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-19 20:00:00'::timestamp, 'pending');

-- Match pour la 3ème place - July 22
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-22 17:00:00'::timestamp, 'pending');

-- Finale - July 13 (CORRECT: 13 juillet 21h UTC+2)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-13 21:00:00'::timestamp, 'pending');

-- Verify
SELECT COUNT(*) as total_matches FROM matches;
-- Should return: 72 (groups) + 32 (KO) = 104
