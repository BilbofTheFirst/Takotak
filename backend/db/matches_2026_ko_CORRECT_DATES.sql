-- World Cup 2026 Knockout Matches - CORRECT DATES (using vrai Belgium times UTC+2)
-- 16ème: 28 juin - 3 juillet
-- 8ème: 4-7 juillet
-- Quarts: 9-11 juillet
-- Semis: 14-15 juillet
-- 3e place: 18 juillet
-- Final: 19 juillet

-- ROUND OF 32 / 16ème de Finale (16 matchs)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-06-28 21:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-06-29 19:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-06-29 22:30:00'::timestamp, 'pending'),
(NULL, NULL, '2026-06-30 03:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-06-30 19:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-06-30 23:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-01 03:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-01 18:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-01 22:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-02 02:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-02 21:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-03 01:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-03 05:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-03 20:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-04 00:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-04 03:30:00'::timestamp, 'pending');

-- ROUND OF 16 / 8ème de Finale (8 matchs)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-04 19:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-04 23:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-05 22:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-06 02:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-06 21:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-07 02:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-07 18:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-07 22:00:00'::timestamp, 'pending');

-- QUARTERFINALS / Quarts de Finale (4 matchs)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-09 22:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-10 21:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-11 23:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-12 03:00:00'::timestamp, 'pending');

-- SEMIFINALS / Demi-Finales (2 matchs)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-14 21:00:00'::timestamp, 'pending'),
(NULL, NULL, '2026-07-15 21:00:00'::timestamp, 'pending');

-- 3RD PLACE MATCH / Match pour la 3ème place
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-18 23:00:00'::timestamp, 'pending');

-- FINAL / Finale
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-19 21:00:00'::timestamp, 'pending');

-- Verify: should have 72 (groups) + 32 (KO) = 104 total matches
SELECT COUNT(*) as total_matches FROM matches;
