-- ============================================
-- SETUP COMPLET - TakoTak 2026 - DONNÉES OFFICIELLES
-- 48 équipes, 104 matchs (72 groupes + 32 KO)
-- Heures en UTC (heure belgique - 2h)
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

-- INSERT 48 ÉQUIPES OFFICIELLES 2026
INSERT INTO teams (name) VALUES
('Mexique'), ('Afrique du Sud'), ('Corée du Sud'), ('République tchèque'), ('Canada'), ('Bosnie-Herzégovine'),
('Qatar'), ('Suisse'), ('États-Unis'), ('Paraguay'), ('Australie'), ('Turquie'), ('Brésil'), ('Maroc'),
('Haïti'), ('Écosse'), ('Allemagne'), ('Curaçao'), ('Pays-Bas'), ('Japon'), ('Côte d\'Ivoire'),
('Équateur'), ('Suède'), ('Tunisie'), ('Espagne'), ('Cap-Vert'), ('Belgique'), ('Égypte'), ('Iran'),
('Nouvelle-Zélande'), ('Arabie saoudite'), ('Uruguay'), ('France'), ('Sénégal'), ('Irak'), ('Norvège'),
('Argentine'), ('Algérie'), ('Autriche'), ('Jordanie'), ('Portugal'), ('RD Congo'), ('Ouzbékistan'),
('Colombie'), ('Angleterre'), ('Croatie'), ('Ghana'), ('Panama');

-- MATCHS DE GROUPES (72 matchs)
-- Groupe A
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Mexique'), (SELECT id FROM teams WHERE name='Afrique du Sud'), '2026-06-11 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Corée du Sud'), (SELECT id FROM teams WHERE name='République tchèque'), '2026-06-12 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name='République tchèque'), (SELECT id FROM teams WHERE name='Afrique du Sud'), '2026-06-18 16:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Mexique'), (SELECT id FROM teams WHERE name='Corée du Sud'), '2026-06-19 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Afrique du Sud'), (SELECT id FROM teams WHERE name='Corée du Sud'), '2026-06-25 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='République tchèque'), (SELECT id FROM teams WHERE name='Mexique'), '2026-06-25 01:00:00', 'pending');

-- Groupe B
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Canada'), (SELECT id FROM teams WHERE name='Bosnie-Herzégovine'), '2026-06-12 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Qatar'), (SELECT id FROM teams WHERE name='Suisse'), '2026-06-13 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Suisse'), (SELECT id FROM teams WHERE name='Bosnie-Herzégovine'), '2026-06-18 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Canada'), (SELECT id FROM teams WHERE name='Qatar'), '2026-06-19 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Suisse'), (SELECT id FROM teams WHERE name='Canada'), '2026-06-24 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Bosnie-Herzégovine'), (SELECT id FROM teams WHERE name='Qatar'), '2026-06-24 19:00:00', 'pending');

-- Groupe C
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Brésil'), (SELECT id FROM teams WHERE name='Maroc'), '2026-06-13 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Haïti'), (SELECT id FROM teams WHERE name='Écosse'), '2026-06-14 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Écosse'), (SELECT id FROM teams WHERE name='Maroc'), '2026-06-19 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Brésil'), (SELECT id FROM teams WHERE name='Haïti'), '2026-06-20 00:30:00', 'pending'),
((SELECT id FROM teams WHERE name='Maroc'), (SELECT id FROM teams WHERE name='Haïti'), '2026-06-24 23:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Écosse'), (SELECT id FROM teams WHERE name='Brésil'), '2026-06-24 23:00:00', 'pending');

-- Groupe D
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='États-Unis'), (SELECT id FROM teams WHERE name='Paraguay'), '2026-06-13 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Australie'), (SELECT id FROM teams WHERE name='Turquie'), '2026-06-14 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Australie'), (SELECT id FROM teams WHERE name='États-Unis'), '2026-06-19 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Turquie'), (SELECT id FROM teams WHERE name='Paraguay'), '2026-06-20 03:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Turquie'), (SELECT id FROM teams WHERE name='États-Unis'), '2026-06-25 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Paraguay'), (SELECT id FROM teams WHERE name='Australie'), '2026-06-25 02:00:00', 'pending');

-- Groupe E
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Allemagne'), (SELECT id FROM teams WHERE name='Curaçao'), '2026-06-14 17:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Côte d\'Ivoire'), (SELECT id FROM teams WHERE name='Équateur'), '2026-06-14 23:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Allemagne'), (SELECT id FROM teams WHERE name='Côte d\'Ivoire'), '2026-06-20 20:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Équateur'), (SELECT id FROM teams WHERE name='Curaçao'), '2026-06-21 00:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Curaçao'), (SELECT id FROM teams WHERE name='Côte d\'Ivoire'), '2026-06-25 20:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Équateur'), (SELECT id FROM teams WHERE name='Allemagne'), '2026-06-25 20:00:00', 'pending');

-- Groupe F
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Pays-Bas'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-14 20:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Suède'), (SELECT id FROM teams WHERE name='Tunisie'), '2026-06-15 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Pays-Bas'), (SELECT id FROM teams WHERE name='Suède'), '2026-06-20 17:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Tunisie'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-21 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Tunisie'), (SELECT id FROM teams WHERE name='Pays-Bas'), '2026-06-25 23:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Japon'), (SELECT id FROM teams WHERE name='Suède'), '2026-06-25 23:00:00', 'pending');

-- Groupe G
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Belgique'), (SELECT id FROM teams WHERE name='Égypte'), '2026-06-14 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Iran'), (SELECT id FROM teams WHERE name='Nouvelle-Zélande'), '2026-06-16 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Belgique'), (SELECT id FROM teams WHERE name='Iran'), '2026-06-21 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Nouvelle-Zélande'), (SELECT id FROM teams WHERE name='Égypte'), '2026-06-22 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Nouvelle-Zélande'), (SELECT id FROM teams WHERE name='Belgique'), '2026-06-27 03:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Égypte'), (SELECT id FROM teams WHERE name='Iran'), '2026-06-27 03:00:00', 'pending');

-- Groupe H
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Espagne'), (SELECT id FROM teams WHERE name='Cap-Vert'), '2026-06-15 16:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Arabie saoudite'), (SELECT id FROM teams WHERE name='Uruguay'), '2026-06-15 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Espagne'), (SELECT id FROM teams WHERE name='Arabie saoudite'), '2026-06-21 16:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Uruguay'), (SELECT id FROM teams WHERE name='Cap-Vert'), '2026-06-21 20:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Cap-Vert'), (SELECT id FROM teams WHERE name='Arabie saoudite'), '2026-06-27 00:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Uruguay'), (SELECT id FROM teams WHERE name='Espagne'), '2026-06-27 00:00:00', 'pending');

-- Groupe I
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='France'), (SELECT id FROM teams WHERE name='Sénégal'), '2026-06-16 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Irak'), (SELECT id FROM teams WHERE name='Norvège'), '2026-06-16 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Norvège'), (SELECT id FROM teams WHERE name='France'), '2026-06-26 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Sénégal'), (SELECT id FROM teams WHERE name='Irak'), '2026-06-26 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Norvège'), (SELECT id FROM teams WHERE name='Sénégal'), '2026-06-27 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name='France'), (SELECT id FROM teams WHERE name='Irak'), '2026-06-27 02:00:00', 'pending');

-- Groupe J
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Argentine'), (SELECT id FROM teams WHERE name='Algérie'), '2026-06-17 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Autriche'), (SELECT id FROM teams WHERE name='Jordanie'), '2026-06-17 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Argentine'), (SELECT id FROM teams WHERE name='Autriche'), '2026-06-22 17:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Jordanie'), (SELECT id FROM teams WHERE name='Algérie'), '2026-06-23 03:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Algérie'), (SELECT id FROM teams WHERE name='Autriche'), '2026-06-28 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Jordanie'), (SELECT id FROM teams WHERE name='Argentine'), '2026-06-28 02:00:00', 'pending');

-- Groupe K
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Portugal'), (SELECT id FROM teams WHERE name='RD Congo'), '2026-06-17 17:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Ouzbékistan'), (SELECT id FROM teams WHERE name='Colombie'), '2026-06-18 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Portugal'), (SELECT id FROM teams WHERE name='Ouzbékistan'), '2026-06-23 17:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Colombie'), (SELECT id FROM teams WHERE name='RD Congo'), '2026-06-24 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Colombie'), (SELECT id FROM teams WHERE name='Portugal'), '2026-06-28 23:00:00', 'pending'),
((SELECT id FROM teams WHERE name='RD Congo'), (SELECT id FROM teams WHERE name='Ouzbékistan'), '2026-06-28 23:00:00', 'pending');

-- Groupe L
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Angleterre'), (SELECT id FROM teams WHERE name='Croatie'), '2026-06-17 20:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Ghana'), (SELECT id FROM teams WHERE name='Panama'), '2026-06-17 23:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Ghana'), (SELECT id FROM teams WHERE name='Angleterre'), '2026-06-22 21:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Panama'), (SELECT id FROM teams WHERE name='Croatie'), '2026-06-23 23:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Panama'), (SELECT id FROM teams WHERE name='Angleterre'), '2026-06-27 21:00:00', 'pending'),
((SELECT id FROM teams WHERE name='Croatie'), (SELECT id FROM teams WHERE name='Ghana'), '2026-06-27 21:00:00', 'pending');

-- PHASE ÉLIMINATOIRE (32 matchs)
-- 16ièmes (16 matchs)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-06-28 19:00:00', 'pending'),
(NULL, NULL, '2026-06-29 17:00:00', 'pending'),
(NULL, NULL, '2026-06-29 20:30:00', 'pending'),
(NULL, NULL, '2026-06-30 01:00:00', 'pending'),
(NULL, NULL, '2026-06-30 17:00:00', 'pending'),
(NULL, NULL, '2026-06-30 21:00:00', 'pending'),
(NULL, NULL, '2026-07-01 01:00:00', 'pending'),
(NULL, NULL, '2026-07-01 16:00:00', 'pending'),
(NULL, NULL, '2026-07-01 20:00:00', 'pending'),
(NULL, NULL, '2026-07-02 00:00:00', 'pending'),
(NULL, NULL, '2026-07-02 19:00:00', 'pending'),
(NULL, NULL, '2026-07-02 23:00:00', 'pending'),
(NULL, NULL, '2026-07-03 03:00:00', 'pending'),
(NULL, NULL, '2026-07-03 18:00:00', 'pending'),
(NULL, NULL, '2026-07-03 23:00:00', 'pending'),
(NULL, NULL, '2026-07-04 01:30:00', 'pending');

-- 8ièmes (8 matchs)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-04 17:00:00', 'pending'),
(NULL, NULL, '2026-07-04 21:00:00', 'pending'),
(NULL, NULL, '2026-07-05 20:00:00', 'pending'),
(NULL, NULL, '2026-07-06 00:00:00', 'pending'),
(NULL, NULL, '2026-07-06 19:00:00', 'pending'),
(NULL, NULL, '2026-07-07 00:00:00', 'pending'),
(NULL, NULL, '2026-07-07 16:00:00', 'pending'),
(NULL, NULL, '2026-07-07 20:00:00', 'pending');

-- Quarts (4 matchs)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-09 20:00:00', 'pending'),
(NULL, NULL, '2026-07-10 19:00:00', 'pending'),
(NULL, NULL, '2026-07-11 21:00:00', 'pending'),
(NULL, NULL, '2026-07-12 01:00:00', 'pending');

-- Semis (2 matchs)
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-14 19:00:00', 'pending'),
(NULL, NULL, '2026-07-15 19:00:00', 'pending');

-- 3e place (1 match) - 23h belgique = 21h UTC
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-18 21:00:00', 'pending');

-- Final (1 match) - 21h belgique = 19h UTC
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
(NULL, NULL, '2026-07-19 19:00:00', 'pending');
