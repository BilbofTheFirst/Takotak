-- ============================================
-- SCRIPT UNIQUE COMPLET - Takotak 2026
-- ============================================

-- 1) Rendre team1_id et team2_id NULLABLE (pour matchs KO)
ALTER TABLE matches
ALTER COLUMN team1_id DROP NOT NULL,
ALTER COLUMN team2_id DROP NOT NULL;

-- 2) Supprimer tous les matchs KO existants
DELETE FROM matches WHERE id > 72;

-- 3) Réinitialiser la séquence pour les IDs 73-104
ALTER SEQUENCE matches_id_seq RESTART WITH 73;

-- 4) Insérer les 32 matchs KO avec BONNES DATES UTC+2
-- 16ème de Finale (28 juin - 4 juillet, horaires UTC+2)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-06-28 21:00:00+02', 'pending'),  -- 28.06 21h
(NULL, NULL, '2026-06-29 19:00:00+02', 'pending'),  -- 29.06 19h
(NULL, NULL, '2026-06-29 22:30:00+02', 'pending'),  -- 29.06 22h30
(NULL, NULL, '2026-06-30 03:00:00+02', 'pending'),  -- 30.06 03h
(NULL, NULL, '2026-06-30 19:00:00+02', 'pending'),  -- 30.06 19h
(NULL, NULL, '2026-06-30 23:00:00+02', 'pending'),  -- 30.06 23h
(NULL, NULL, '2026-07-01 03:00:00+02', 'pending'),  -- 01.07 03h
(NULL, NULL, '2026-07-01 18:00:00+02', 'pending'),  -- 01.07 18h
(NULL, NULL, '2026-07-01 22:00:00+02', 'pending'),  -- 01.07 22h
(NULL, NULL, '2026-07-02 02:00:00+02', 'pending'),  -- 02.07 02h
(NULL, NULL, '2026-07-02 21:00:00+02', 'pending'),  -- 02.07 21h
(NULL, NULL, '2026-07-03 01:00:00+02', 'pending'),  -- 03.07 01h
(NULL, NULL, '2026-07-03 05:00:00+02', 'pending'),  -- 03.07 05h
(NULL, NULL, '2026-07-03 20:00:00+02', 'pending'),  -- 03.07 20h
(NULL, NULL, '2026-07-04 00:00:00+02', 'pending'),  -- 04.07 00h
(NULL, NULL, '2026-07-04 03:30:00+02', 'pending');  -- 04.07 03h30

-- 8ème de Finale (4-7 juillet, horaires UTC+2)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-04 19:00:00+02', 'pending'),  -- 04.07 19h
(NULL, NULL, '2026-07-04 23:00:00+02', 'pending'),  -- 04.07 23h
(NULL, NULL, '2026-07-05 22:00:00+02', 'pending'),  -- 05.07 22h
(NULL, NULL, '2026-07-06 02:00:00+02', 'pending'),  -- 06.07 02h
(NULL, NULL, '2026-07-06 21:00:00+02', 'pending'),  -- 06.07 21h
(NULL, NULL, '2026-07-07 02:00:00+02', 'pending'),  -- 07.07 02h
(NULL, NULL, '2026-07-07 18:00:00+02', 'pending'),  -- 07.07 18h
(NULL, NULL, '2026-07-07 22:00:00+02', 'pending');  -- 07.07 22h

-- Quarts de Finale (9-12 juillet, horaires UTC+2)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-09 22:00:00+02', 'pending'),  -- 09.07 22h
(NULL, NULL, '2026-07-10 21:00:00+02', 'pending'),  -- 10.07 21h
(NULL, NULL, '2026-07-11 23:00:00+02', 'pending'),  -- 11.07 23h
(NULL, NULL, '2026-07-12 03:00:00+02', 'pending');  -- 12.07 03h

-- Demi-Finales (14-15 juillet, horaires UTC+2)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-14 21:00:00+02', 'pending'),  -- 14.07 21h
(NULL, NULL, '2026-07-15 21:00:00+02', 'pending');  -- 15.07 21h

-- Match 3e place (18 juillet 23h00 UTC+2)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-18 23:00:00+02', 'pending');  -- 18.07 23h

-- Finale (19 juillet 21h00 UTC+2)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-19 21:00:00+02', 'pending');  -- 19.07 21h

-- 5) VÉRIFICATION
SELECT
  COUNT(*) as total_matches,
  (SELECT COUNT(*) FROM matches WHERE id <= 72) as groups,
  (SELECT COUNT(*) FROM matches WHERE id > 72) as knockouts
FROM matches;

-- Afficher les derniers matchs pour vérification
SELECT
  id,
  TO_CHAR(start_time AT TIME ZONE 'Europe/Brussels', 'DD.MM HH24:MI') as "Date/Heure Belgique",
  CASE
    WHEN id <= 88 THEN '16ème'
    WHEN id <= 96 THEN '8ème'
    WHEN id <= 100 THEN 'Quart'
    WHEN id <= 102 THEN 'Demi'
    WHEN id = 103 THEN '3e place'
    ELSE 'Final'
  END as Phase
FROM matches
WHERE id > 72
ORDER BY id;
