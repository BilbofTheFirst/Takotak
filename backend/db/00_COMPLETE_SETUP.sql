-- ============================================
-- SCRIPT UNIQUE COMPLET - TakoTak 2026
-- Exécuter ce script SEUL sur Railway
-- ============================================

-- ÉTAPE 1: SUPPRIMER LES ANCIENNES TABLES
DROP TABLE IF EXISTS user_scores CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- ÉTAPE 2: CRÉER LA TABLE TEAMS
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  flag_emoji VARCHAR(10)
);

-- ÉTAPE 3: CRÉER LA TABLE USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÉTAPE 4: CRÉER LA TABLE MATCHES (avec team1_id et team2_id NULLABLE pour les KO)
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  team1_id INTEGER REFERENCES teams(id),
  team2_id INTEGER REFERENCES teams(id),
  start_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÉTAPE 5: CRÉER LA TABLE PREDICTIONS
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team1_goals INTEGER NOT NULL,
  team2_goals INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, match_id)
);

-- ÉTAPE 6: CRÉER LA TABLE RESULTS
CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  match_id INTEGER UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team1_goals INTEGER NOT NULL,
  team2_goals INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÉTAPE 7: CRÉER LA TABLE USER_SCORES
CREATE TABLE user_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, match_id)
);

-- ÉTAPE 8: CRÉER LES INDEX
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_user_scores_user ON user_scores(user_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_team1 ON matches(team1_id);
CREATE INDEX idx_matches_team2 ON matches(team2_id);

-- ÉTAPE 9: INSÉRER LES ÉQUIPES (32 pays)
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
('Japon', '🇯🇵'),
('Jordanie', '🇯🇴'),
('Kazakhstan', '🇰🇿'),
('Maroc', '🇲🇦'),
('Mexique', '🇲🇽'),
('Monténégro', '🇲🇪'),
('Mozambique', '🇲🇿'),
('Népal', '🇳🇵'),
('Nouvelle-Zélande', '🇳🇿'),
('Oman', '🇴🇲'),
('Ouzbékistan', '🇺🇿'),
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

-- ÉTAPE 10: INSÉRER LES 72 MATCHS DE GROUPES (poules A-L)
-- Groupe A (matchs 1-6)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Mexique'), (SELECT id FROM teams WHERE name='Afrique du Sud'), '2026-06-11 23:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='France'), (SELECT id FROM teams WHERE name='Canadá'), '2026-06-12 06:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Belgique'), (SELECT id FROM teams WHERE name='Maroc'), '2026-06-13 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Afrique du Sud'), (SELECT id FROM teams WHERE name='France'), '2026-06-17 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Belgique'), (SELECT id FROM teams WHERE name='Mexique'), '2026-06-18 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Maroc'), (SELECT id FROM teams WHERE name='Canada'), '2026-06-18 03:00:00+02', 'pending');

-- Groupe B (matchs 7-12)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Espagne'), (SELECT id FROM teams WHERE name='Corée du Sud'), '2026-06-12 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Allemagne'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-13 06:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Allemagne'), (SELECT id FROM teams WHERE name='Espagne'), '2026-06-17 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Japon'), (SELECT id FROM teams WHERE name='Corée du Sud'), '2026-06-18 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Espagne'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-22 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Corée du Sud'), (SELECT id FROM teams WHERE name='Allemagne'), '2026-06-22 03:00:00+02', 'pending');

-- Groupe C (matchs 13-18)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Argentine'), (SELECT id FROM teams WHERE name='Pérou'), '2026-06-13 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='France'), (SELECT id FROM teams WHERE name='Australie'), '2026-06-13 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Pérou'), (SELECT id FROM teams WHERE name='Australie'), '2026-06-17 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Australie'), (SELECT id FROM teams WHERE name='Argentine'), '2026-06-22 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Pologne'), (SELECT id FROM teams WHERE name='Pérou'), '2026-06-22 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Pologne'), (SELECT id FROM teams WHERE name='France'), '2026-06-23 00:00:00+02', 'pending');

-- Groupe D (matchs 19-24)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Japon'), (SELECT id FROM teams WHERE name='Costa Rica'), '2026-06-14 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Italie'), (SELECT id FROM teams WHERE name='Albanie'), '2026-06-15 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Albanie'), (SELECT id FROM teams WHERE name='Costa Rica'), '2026-06-19 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Costa Rica'), (SELECT id FROM teams WHERE name='Italie'), '2026-06-20 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Italie'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-24 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Albanie'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-24 21:00:00+02', 'pending');

-- Groupe E (matchs 25-30)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Danemark'), (SELECT id FROM teams WHERE name='Tunisie'), '2026-06-14 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Pays-Bas'), (SELECT id FROM teams WHERE name='Senégal'), '2026-06-15 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Tunisie'), (SELECT id FROM teams WHERE name='Senégal'), '2026-06-20 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Senégal'), (SELECT id FROM teams WHERE name='Pays-Bas'), '2026-06-21 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Pays-Bas'), (SELECT id FROM teams WHERE name='Danemark'), '2026-06-24 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Tunisie'), (SELECT id FROM teams WHERE name='Danemark'), '2026-06-24 03:00:00+02', 'pending');

-- Groupe F (matchs 31-36)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Belgique'), (SELECT id FROM teams WHERE name='Slovaquie'), '2026-06-15 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Roumanie'), (SELECT id FROM teams WHERE name='Uzbekistan'), '2026-06-16 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Slovaquie'), (SELECT id FROM teams WHERE name='Roumanie'), '2026-06-20 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Roumanie'), (SELECT id FROM teams WHERE name='Belgique'), '2026-06-21 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Slovaquie'), (SELECT id FROM teams WHERE name='Uzbekistan'), '2026-06-25 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Uzbekistan'), (SELECT id FROM teams WHERE name='Belgique'), '2026-06-25 00:00:00+02', 'pending');

-- Groupe G (matchs 37-42)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Nouvelle-Zélande'), (SELECT id FROM teams WHERE name='Égypte'), '2026-06-16 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Colombie'), (SELECT id FROM teams WHERE name='Monténégro'), '2026-06-16 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Égypte'), (SELECT id FROM teams WHERE name='Monténégro'), '2026-06-21 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Monténégro'), (SELECT id FROM teams WHERE name='Colombie'), '2026-06-21 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Colombie'), (SELECT id FROM teams WHERE name='Nouvelle-Zélande'), '2026-06-25 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Égypte'), (SELECT id FROM teams WHERE name='Colombie'), '2026-06-25 21:00:00+02', 'pending');

-- Groupe H (matchs 43-48)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Uruguay'), (SELECT id FROM teams WHERE name='Cap-Vert'), '2026-06-22 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Ghana'), (SELECT id FROM teams WHERE name='Portugal'), '2026-06-22 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Portugal'), (SELECT id FROM teams WHERE name='Cap-Vert'), '2026-06-26 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Cap-Vert'), (SELECT id FROM teams WHERE name='Ghana'), '2026-06-27 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Ghana'), (SELECT id FROM teams WHERE name='Uruguay'), '2026-06-27 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Portugal'), (SELECT id FROM teams WHERE name='Uruguay'), '2026-06-27 03:00:00+02', 'pending');

-- Groupe I (matchs 49-54)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Brésil'), (SELECT id FROM teams WHERE name='Serbie'), '2026-06-23 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Suisse'), (SELECT id FROM teams WHERE name='Paraguay'), '2026-06-23 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Paraguay'), (SELECT id FROM teams WHERE name='Serbie'), '2026-06-27 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Serbie'), (SELECT id FROM teams WHERE name='Suisse'), '2026-06-28 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Suisse'), (SELECT id FROM teams WHERE name='Brésil'), '2026-07-01 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Paraguay'), (SELECT id FROM teams WHERE name='Brésil'), '2026-07-01 21:00:00+02', 'pending');

-- Groupe J (matchs 55-60)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='États-Unis'), (SELECT id FROM teams WHERE name='Bolivie'), '2026-06-23 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Ukraine'), (SELECT id FROM teams WHERE name='Maroc'), '2026-06-24 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Maroc'), (SELECT id FROM teams WHERE name='Bolivie'), '2026-06-28 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Bolivie'), (SELECT id FROM teams WHERE name='Ukraine'), '2026-06-29 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Ukraine'), (SELECT id FROM teams WHERE name='États-Unis'), '2026-07-02 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Maroc'), (SELECT id FROM teams WHERE name='États-Unis'), '2026-07-02 00:00:00+02', 'pending');

-- Groupe K (matchs 61-66)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Angleterre'), (SELECT id FROM teams WHERE name='Serbie'), '2026-06-24 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Iran'), (SELECT id FROM teams WHERE name='Azerbaïdjan'), '2026-06-25 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Azerbaïdjan'), (SELECT id FROM teams WHERE name='Angleterre'), '2026-06-29 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Angleterre'), (SELECT id FROM teams WHERE name='Iran'), '2026-06-30 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Iran'), (SELECT id FROM teams WHERE name='Serbie'), '2026-07-03 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Azerbaïdjan'), (SELECT id FROM teams WHERE name='Serbie'), '2026-07-03 03:00:00+02', 'pending');

-- Groupe L (matchs 67-72)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Espagne'), (SELECT id FROM teams WHERE name='Costa Rica'), '2026-06-25 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Allemagne'), (SELECT id FROM teams WHERE name='Hongrie'), '2026-06-26 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Hongrie'), (SELECT id FROM teams WHERE name='Costa Rica'), '2026-06-30 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Costa Rica'), (SELECT id FROM teams WHERE name='Allemagne'), '2026-07-01 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Allemagne'), (SELECT id FROM teams WHERE name='Espagne'), '2026-07-05 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Hongrie'), (SELECT id FROM teams WHERE name='Espagne'), '2026-07-05 00:00:00+02', 'pending');

-- ÉTAPE 11: INSÉRER LES 32 MATCHS KO (16ème à Final)

-- 16ème de Finale (matchs 73-88)
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

-- 8ème de Finale (matchs 89-96)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-04 19:00:00+02', 'pending'),
(NULL, NULL, '2026-07-04 23:00:00+02', 'pending'),
(NULL, NULL, '2026-07-05 22:00:00+02', 'pending'),
(NULL, NULL, '2026-07-06 02:00:00+02', 'pending'),
(NULL, NULL, '2026-07-06 21:00:00+02', 'pending'),
(NULL, NULL, '2026-07-07 02:00:00+02', 'pending'),
(NULL, NULL, '2026-07-07 18:00:00+02', 'pending'),
(NULL, NULL, '2026-07-07 22:00:00+02', 'pending');

-- Quarts de Finale (matchs 97-100)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-09 22:00:00+02', 'pending'),
(NULL, NULL, '2026-07-10 21:00:00+02', 'pending'),
(NULL, NULL, '2026-07-11 23:00:00+02', 'pending'),
(NULL, NULL, '2026-07-12 03:00:00+02', 'pending');

-- Demi-Finales (matchs 101-102)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-14 21:00:00+02', 'pending'),
(NULL, NULL, '2026-07-15 21:00:00+02', 'pending');

-- Match pour la 3e place (match 103) - 18 JUILLET 23:00
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-18 23:00:00+02', 'pending');

-- Finale (match 104) - 19 JUILLET 21:00
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-19 21:00:00+02', 'pending');

-- ÉTAPE 12: VÉRIFICATION FINALE
SELECT
  (SELECT COUNT(*) FROM teams) as total_teams,
  (SELECT COUNT(*) FROM matches) as total_matches,
  (SELECT COUNT(*) FROM matches WHERE id <= 72) as group_stage,
  (SELECT COUNT(*) FROM matches WHERE id > 72) as knockout_stage;

-- Afficher les derniers matchs KO
SELECT
  id,
  TO_CHAR(start_time AT TIME ZONE 'Europe/Brussels', 'DD.MM.YYYY HH24:MI') as date_belgique,
  CASE
    WHEN id <= 88 THEN '16ème'
    WHEN id <= 96 THEN '8ème'
    WHEN id <= 100 THEN 'Quart'
    WHEN id <= 102 THEN 'Demi'
    WHEN id = 103 THEN '3e place'
    WHEN id = 104 THEN 'Final'
  END as phase
FROM matches
WHERE id > 72
ORDER BY id;
