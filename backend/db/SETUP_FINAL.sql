-- ============================================
-- SCRIPT UNIQUE - TakoTak 2026
-- Crée les tables + insère les 32 équipes
-- ============================================

-- DROP les anciennes tables
DROP TABLE IF EXISTS user_scores CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- CREATE TABLE TEAMS
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  flag_emoji VARCHAR(10)
);

-- CREATE TABLE USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CREATE TABLE MATCHES (team1_id et team2_id NULLABLE)
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  team1_id INTEGER REFERENCES teams(id),
  team2_id INTEGER REFERENCES teams(id),
  start_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CREATE TABLE PREDICTIONS
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team1_goals INTEGER NOT NULL,
  team2_goals INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, match_id)
);

-- CREATE TABLE RESULTS
CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  match_id INTEGER UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team1_goals INTEGER NOT NULL,
  team2_goals INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CREATE TABLE USER_SCORES
CREATE TABLE user_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, match_id)
);

-- CREATE INDEXES
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_user_scores_user ON user_scores(user_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_team1 ON matches(team1_id);
CREATE INDEX idx_matches_team2 ON matches(team2_id);

-- INSERT 32 ÉQUIPES (Coupe du Monde 2026)
INSERT INTO teams (name, flag_emoji) VALUES
('Afrique du Sud', '🇿🇦'),
('Algérie', '🇩🇿'),
('Allemagne', '🇩🇪'),
('Angleterre', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
('Arabie saoudite', '🇸🇦'),
('Argentine', '🇦🇷'),
('Australie', '🇦🇺'),
('Autriche', '🇦🇹'),
('Belgique', '🇧🇪'),
('Bosnie-Herzégovine', '🇧🇦'),
('Brésil', '🇧🇷'),
('Canada', '🇨🇦'),
('Cap-Vert', '🇨🇻'),
('Chili', '🇨🇱'),
('Colombie', '🇨🇴'),
('Corée du Sud', '🇰🇷'),
('Côte d''Ivoire', '🇨🇮'),
('Croatie', '🇭🇷'),
('Curaçao', '🇨🇼'),
('Égypte', '🇪🇬'),
('Équateur', '🇪🇨'),
('Espagne', '🇪🇸'),
('États-Unis', '🇺🇸'),
('France', '🇫🇷'),
('Ghana', '🇬🇭'),
('Haïti', '🇭🇹'),
('Hongrie', '🇭🇺'),
('Irak', '🇮🇶'),
('Iran', '🇮🇷'),
('Irlande', '🇮🇪'),
('Islande', '🇮🇸'),
('Israël', '🇮🇱'),
('Italie', '🇮🇹'),
('Jamaïque', '🇯🇲'),
('Japon', '🇯🇵'),
('Jordanie', '🇯🇴'),
('Kazakhstan', '🇰🇿'),
('Malawi', '🇲🇼'),
('Mali', '🇲🇱'),
('Maroc', '🇲🇦'),
('Mexique', '🇲🇽'),
('Moldavie', '🇲🇩'),
('Monténégro', '🇲🇪'),
('Mozambique', '🇲🇿'),
('Népal', '🇳🇵'),
('Nouvelle-Zélande', '🇳🇿'),
('Norvège', '🇳🇴'),
('Oman', '🇴🇲'),
('Ouzbékistan', '🇺🇿'),
('Palestine', '🇵🇸'),
('Panama', '🇵🇦'),
('Paraguay', '🇵🇾'),
('Pays-Bas', '🇳🇱'),
('Pérou', '🇵🇪'),
('Pologne', '🇵🇱'),
('Portugal', '🇵🇹'),
('Qatar', '🇶🇦'),
('République dominicaine', '🇩🇴'),
('République tchèque', '🇨🇿'),
('Roumanie', '🇷🇴'),
('Russie', '🇷🇺'),
('Salvador', '🇸🇻'),
('Sénégal', '🇸🇳'),
('Serbie', '🇷🇸'),
('Slovaquie', '🇸🇰'),
('Slovénie', '🇸🇮'),
('Suède', '🇸🇪'),
('Suisse', '🇨🇭'),
('Suriname', '🇸🇷'),
('Thaïlande', '🇹🇭'),
('Tunisie', '🇹🇳'),
('Turquie', '🇹🇷'),
('Ukraine', '🇺🇦'),
('Uruguay', '🇺🇾'),
('Venezuela', '🇻🇪');

-- INSERT 32 MATCHS KO (sans équipes - matchs 73-104)
-- 16ème (16 matchs: 73-88)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-06-28 21:00:00+02', 'pending'),
(NULL, NULL, '2026-06-29 19:00:00+02', 'pending'),
(NULL, NULL, '2026-06-29 22:30:00+02', 'pending'),
(NULL, NULL, '2026-06-30 03:00:00+02', 'pending'),
(NULL, NULL, '2026-06-30 19:00:00+02', 'pending'),
(NULL, NULL, '2026-06-30 23:00:00+02', 'pending'),
(NULL, NULL, '2026-07-01 03:00:00+02', 'pending'),
(NULL, NULL, '2026-07-01 18:00:00+02', 'pending'),
(NULL, NULL, '2026-07-01 22:00:00+02', 'pending'),
(NULL, NULL, '2026-07-02 02:00:00+02', 'pending'),
(NULL, NULL, '2026-07-02 21:00:00+02', 'pending'),
(NULL, NULL, '2026-07-03 01:00:00+02', 'pending'),
(NULL, NULL, '2026-07-03 05:00:00+02', 'pending'),
(NULL, NULL, '2026-07-03 20:00:00+02', 'pending'),
(NULL, NULL, '2026-07-04 00:00:00+02', 'pending'),
(NULL, NULL, '2026-07-04 03:30:00+02', 'pending');

-- 8ème (8 matchs: 89-96)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-04 19:00:00+02', 'pending'),
(NULL, NULL, '2026-07-04 23:00:00+02', 'pending'),
(NULL, NULL, '2026-07-05 22:00:00+02', 'pending'),
(NULL, NULL, '2026-07-06 02:00:00+02', 'pending'),
(NULL, NULL, '2026-07-06 21:00:00+02', 'pending'),
(NULL, NULL, '2026-07-07 02:00:00+02', 'pending'),
(NULL, NULL, '2026-07-07 18:00:00+02', 'pending'),
(NULL, NULL, '2026-07-07 22:00:00+02', 'pending');

-- Quarts (4 matchs: 97-100)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-09 22:00:00+02', 'pending'),
(NULL, NULL, '2026-07-10 21:00:00+02', 'pending'),
(NULL, NULL, '2026-07-11 23:00:00+02', 'pending'),
(NULL, NULL, '2026-07-12 03:00:00+02', 'pending');

-- Semis (2 matchs: 101-102)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-14 21:00:00+02', 'pending'),
(NULL, NULL, '2026-07-15 21:00:00+02', 'pending');

-- 3e place (1 match: 103) - ✅ 18 JUILLET 23:00
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-18 23:00:00+02', 'pending');

-- Final (1 match: 104) - ✅ 19 JUILLET 21:00
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-19 21:00:00+02', 'pending');

-- VÉRIFICATION
SELECT COUNT(*) as teams FROM teams;
SELECT COUNT(*) as total_matches,
       (SELECT COUNT(*) FROM matches WHERE id <= 72) as groupes,
       (SELECT COUNT(*) FROM matches WHERE id > 72) as knockouts
FROM matches;

-- Affiche les dates KO finales
SELECT id,
       TO_CHAR(start_time AT TIME ZONE 'Europe/Brussels', 'DD.MM HH24:MI') as heure_belgique,
       CASE WHEN id = 103 THEN '3e place' WHEN id = 104 THEN 'FINAL' ELSE 'KO' END as phase
FROM matches WHERE id IN (103, 104);
