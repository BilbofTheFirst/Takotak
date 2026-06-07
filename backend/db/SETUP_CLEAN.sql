-- ============================================
-- SETUP COMPLET - TakoTak 2026
-- UTC timestamps (pas de timezone)
-- ============================================

DROP TABLE IF EXISTS user_scores CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  team1_id INTEGER REFERENCES teams(id),
  team2_id INTEGER REFERENCES teams(id),
  start_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team1_goals INTEGER NOT NULL,
  team2_goals INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, match_id)
);

CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  match_id INTEGER UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team1_goals INTEGER NOT NULL,
  team2_goals INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, match_id)
);

CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_user_scores_user ON user_scores(user_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_team1 ON matches(team1_id);
CREATE INDEX idx_matches_team2 ON matches(team2_id);

-- INSERT ÉQUIPES
INSERT INTO teams (name) VALUES
('Mexique'), ('Afrique du Sud'), ('France'), ('Canada'), ('Belgique'), ('Maroc'),
('Espagne'), ('Corée du Sud'), ('Allemagne'), ('Japon'), ('Argentine'), ('Pérou'),
('Pologne'), ('Australie'), ('Costa Rica'), ('Italie'), ('Albanie'), ('Danemark'),
('Tunisie'), ('Pays-Bas'), ('Sénégal'), ('Slovaquie'), ('Roumanie'), ('Ouzbékistan'),
('Nouvelle-Zélande'), ('Égypte'), ('Colombie'), ('Monténégro'), ('Uruguay'), ('Cap-Vert'),
('Ghana'), ('Portugal'), ('Brésil'), ('Serbie'), ('Suisse'), ('Paraguay'), ('États-Unis'),
('Bolivie'), ('Ukraine'), ('Angleterre'), ('Iran'), ('Azerbaïdjan');

-- TOUS les matchs à 21h belgique = 19h UTC
-- TOUS les matchs à 04h belgique = 02h UTC
-- TOUS les matchs à 03h belgique = 01h UTC
-- TOUS les matchs à 23h belgique = 21h UTC

-- Groupe A
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Mexique'), (SELECT id FROM teams WHERE name='Afrique du Sud'), '2026-06-11 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='France'), (SELECT id FROM teams WHERE name='Canada'), '2026-06-12 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Belgique'), (SELECT id FROM teams WHERE name='Maroc'), '2026-06-13 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Afrique du Sud'), (SELECT id FROM teams WHERE name='France'), '2026-06-17 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Belgique'), (SELECT id FROM teams WHERE name='Mexique'), '2026-06-17 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Maroc'), (SELECT id FROM teams WHERE name='Canada'), '2026-06-18 01:00:00', 'pending');

-- Groupe B
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Espagne'), (SELECT id FROM teams WHERE name='Corée du Sud'), '2026-06-12 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Allemagne'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-13 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Allemagne'), (SELECT id FROM teams WHERE name='Espagne'), '2026-06-17 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Japon'), (SELECT id FROM teams WHERE name='Corée du Sud'), '2026-06-18 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Espagne'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-22 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Corée du Sud'), (SELECT id FROM teams WHERE name='Allemagne'), '2026-06-22 01:00:00', 'pending');

-- Groupe C
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Argentine'), (SELECT id FROM teams WHERE name='Pérou'), '2026-06-13 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Pologne'), (SELECT id FROM teams WHERE name='Australie'), '2026-06-12 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Pérou'), (SELECT id FROM teams WHERE name='Australie'), '2026-06-17 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Australie'), (SELECT id FROM teams WHERE name='Argentine'), '2026-06-22 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Pologne'), (SELECT id FROM teams WHERE name='Pérou'), '2026-06-22 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Pologne'), (SELECT id FROM teams WHERE name='France'), '2026-06-22 22:00:00', 'pending');

-- Groupe D
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Costa Rica'), (SELECT id FROM teams WHERE name='Italie'), '2026-06-14 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Albanie'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-14 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Albanie'), (SELECT id FROM teams WHERE name='Costa Rica'), '2026-06-19 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Costa Rica'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-20 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Italie'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-24 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Albanie'), (SELECT id FROM teams WHERE name='Italie'), '2026-06-24 19:00:00', 'pending');

-- Groupe E
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Danemark'), (SELECT id FROM teams WHERE name='Tunisie'), '2026-06-14 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Pays-Bas'), (SELECT id FROM teams WHERE name='Sénégal'), '2026-06-15 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Tunisie'), (SELECT id FROM teams WHERE name='Sénégal'), '2026-06-20 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Sénégal'), (SELECT id FROM teams WHERE name='Pays-Bas'), '2026-06-20 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Pays-Bas'), (SELECT id FROM teams WHERE name='Danemark'), '2026-06-24 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Tunisie'), (SELECT id FROM teams WHERE name='Danemark'), '2026-06-24 01:00:00', 'pending');

-- Groupe F
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Espagne'), (SELECT id FROM teams WHERE name='Brésil'), '2026-06-15 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Argentine'), (SELECT id FROM teams WHERE name='Colombie'), '2026-06-12 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Colombie'), (SELECT id FROM teams WHERE name='Brésil'), '2026-06-19 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Brésil'), (SELECT id FROM teams WHERE name='Bolivie'), '2026-06-23 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Espagne'), (SELECT id FROM teams WHERE name='Colombie'), '2026-06-23 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Argentine'), (SELECT id FROM teams WHERE name='Brésil'), '2026-06-23 22:00:00', 'pending');

-- Groupe G
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Allemagne'), (SELECT id FROM teams WHERE name='Nouvelle-Zélande'), '2026-06-15 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Belgique'), (SELECT id FROM teams WHERE name='Égypte'), '2026-06-14 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Égypte'), (SELECT id FROM teams WHERE name='Nouvelle-Zélande'), '2026-06-19 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Nouvelle-Zélande'), (SELECT id FROM teams WHERE name='Belgique'), '2026-06-20 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Allemagne'), (SELECT id FROM teams WHERE name='Égypte'), '2026-06-24 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Belgique'), (SELECT id FROM teams WHERE name='Nouvelle-Zélande'), '2026-06-24 04:00:00', 'pending');

-- Groupe H
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Portugal'), (SELECT id FROM teams WHERE name='Ghana'), '2026-06-16 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Uruguay'), (SELECT id FROM teams WHERE name='Cap-Vert'), '2026-06-16 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Cap-Vert'), (SELECT id FROM teams WHERE name='Ghana'), '2026-06-20 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Ghana'), (SELECT id FROM teams WHERE name='Uruguay'), '2026-06-21 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Portugal'), (SELECT id FROM teams WHERE name='Uruguay'), '2026-06-25 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Ghana'), (SELECT id FROM teams WHERE name='Cap-Vert'), '2026-06-25 19:00:00', 'pending');

-- Groupe I
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Angleterre'), (SELECT id FROM teams WHERE name='Serbie'), '2026-06-16 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Sénégal'), (SELECT id FROM teams WHERE name='Angleterre'), '2026-06-20 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Serbie'), (SELECT id FROM teams WHERE name='Angleterre'), '2026-06-24 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Japon'), (SELECT id FROM teams WHERE name='Sénégal'), '2026-06-25 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Angleterre'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-25 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Serbie'), (SELECT id FROM teams WHERE name='Sénégal'), '2026-06-25 04:00:00', 'pending');

-- Groupe J (matches non groupés)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='États-Unis'), (SELECT id FROM teams WHERE name='Bolivie'), '2026-06-13 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Suisse'), (SELECT id FROM teams WHERE name='Roumanie'), '2026-06-15 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Roumanie'), (SELECT id FROM teams WHERE name='Slovaquie'), '2026-06-19 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Ouzbékistan'), (SELECT id FROM teams WHERE name='États-Unis'), '2026-06-20 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Suisse'), (SELECT id FROM teams WHERE name='Ouzbékistan'), '2026-06-24 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Slovaquie'), (SELECT id FROM teams WHERE name='États-Unis'), '2026-06-25 01:00:00', 'pending');

-- Groupe K
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Ukraine'), (SELECT id FROM teams WHERE name='Iran'), '2026-06-11 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Italie'), (SELECT id FROM teams WHERE name='Bolivie'), '2026-06-13 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Iran'), (SELECT id FROM teams WHERE name='Bolivie'), '2026-06-18 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Bolivie'), (SELECT id FROM teams WHERE name='Italie'), '2026-06-23 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Ukraine'), (SELECT id FROM teams WHERE name='Bolivie'), '2026-06-23 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Iran'), (SELECT id FROM teams WHERE name='Italie'), '2026-06-23 01:00:00', 'pending');

-- Groupe L
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Paraguay'), (SELECT id FROM teams WHERE name='Azerbaïdjan'), '2026-06-11 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Monténégro'), (SELECT id FROM teams WHERE name='Suisse'), '2026-06-12 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Suisse'), (SELECT id FROM teams WHERE name='Azerbaïdjan'), '2026-06-19 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Azerbaïdjan'), (SELECT id FROM teams WHERE name='Suisse'), '2026-06-23 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Paraguay'), (SELECT id FROM teams WHERE name='Monténégro'), '2026-06-23 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Paraguay'), (SELECT id FROM teams WHERE name='Suisse'), '2026-06-23 04:00:00', 'pending');

-- PHASE ÉLIMINATOIRE (16ème)
-- 16èmes: 21h belgique = 19h UTC OU 23h belgique = 21h UTC
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-06-28 19:00:00', 'pending'),
(NULL, NULL, '2026-06-28 22:00:00', 'pending'),
(NULL, NULL, '2026-06-29 19:00:00', 'pending'),
(NULL, NULL, '2026-06-29 22:00:00', 'pending'),
(NULL, NULL, '2026-06-30 19:00:00', 'pending'),
(NULL, NULL, '2026-06-30 22:00:00', 'pending'),
(NULL, NULL, '2026-07-01 19:00:00', 'pending'),
(NULL, NULL, '2026-07-01 22:00:00', 'pending'),
(NULL, NULL, '2026-07-02 19:00:00', 'pending'),
(NULL, NULL, '2026-07-02 22:00:00', 'pending'),
(NULL, NULL, '2026-07-03 19:00:00', 'pending'),
(NULL, NULL, '2026-07-03 22:00:00', 'pending'),
(NULL, NULL, '2026-07-04 19:00:00', 'pending'),
(NULL, NULL, '2026-07-04 22:00:00', 'pending'),
(NULL, NULL, '2026-07-05 19:00:00', 'pending'),
(NULL, NULL, '2026-07-05 22:00:00', 'pending');

-- 8èmes
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-04 19:00:00', 'pending'),
(NULL, NULL, '2026-07-04 22:00:00', 'pending'),
(NULL, NULL, '2026-07-05 19:00:00', 'pending'),
(NULL, NULL, '2026-07-05 22:00:00', 'pending'),
(NULL, NULL, '2026-07-06 19:00:00', 'pending'),
(NULL, NULL, '2026-07-06 22:00:00', 'pending'),
(NULL, NULL, '2026-07-07 19:00:00', 'pending'),
(NULL, NULL, '2026-07-07 22:00:00', 'pending');

-- Quarts
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-09 19:00:00', 'pending'),
(NULL, NULL, '2026-07-09 22:00:00', 'pending'),
(NULL, NULL, '2026-07-10 19:00:00', 'pending'),
(NULL, NULL, '2026-07-10 22:00:00', 'pending');

-- Semis
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-14 19:00:00', 'pending'),
(NULL, NULL, '2026-07-15 19:00:00', 'pending');

-- 3e place (23h belgique = 21h UTC)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-18 21:00:00', 'pending');

-- Final (21h belgique = 19h UTC)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-19 19:00:00', 'pending');
