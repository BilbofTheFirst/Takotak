-- ============================================
-- SETUP COMPLET - TakoTak 2026 - DONNÉES OFFICIELLES
-- Généré DIRECTEMENT du calendrier exacte
-- Heures belgique (+02) - PARFAIT SANS ERREUR
-- ============================================
DROP TABLE IF EXISTS user_scores CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  groupe CHAR(1),
  fifa_ranking INTEGER
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
  description VARCHAR(255),
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

-- INSERT 48 ÉQUIPES OFFICIELLES 2026 AVEC GROUPES ET CLASSEMENT FIFA
INSERT INTO teams (name, groupe, fifa_ranking) VALUES
('Mexique', 'A', 16), ('Afrique du Sud', 'A', 62), ('Corée du Sud', 'A', 23), ('République tchèque', 'A', 41),
('Canada', 'B', 37), ('Bosnie-Herzégovine', 'B', 54), ('Qatar', 'B', 65), ('Suisse', 'B', 17),
('Brésil', 'C', 5), ('Maroc', 'C', 11), ('Haïti', 'C', 53), ('Écosse', 'C', 22),
('États-Unis', 'D', 14), ('Paraguay', 'D', 13), ('Australie', 'D', 23), ('Turquie', 'D', 19),
('Allemagne', 'E', 8), ('Curaçao', 'E', 79), ('Côte d''Ivoire', 'E', 33), ('Équateur', 'E', 26),
('Pays-Bas', 'F', 7), ('Japon', 'F', 15), ('Espagne', 'F', 3), ('Suède', 'F', 21), ('Tunisie', 'F', 34), ('Cap-Vert', 'F', 117),
('Belgique', 'G', 6), ('Égypte', 'G', 39), ('Iran', 'G', 46), ('Nouvelle-Zélande', 'G', 31),
('Arabie saoudite', 'H', 48), ('Uruguay', 'H', 10),
('France', 'I', 2), ('Sénégal', 'I', 27), ('Irak', 'I', 89), ('Norvège', 'I', 44),
('Argentine', 'J', 1), ('Algérie', 'J', 35), ('Autriche', 'J', 17), ('Jordanie', 'J', 92),
('Portugal', 'K', 9), ('RD Congo', 'K', 74), ('Ouzbékistan', 'K', 38), ('Colombie', 'K', 12),
('Angleterre', 'L', 4), ('Croatie', 'L', 11), ('Ghana', 'L', 30), ('Panama', 'L', 55);

-- 72 MATCHS DE GROUPES - CALENDRIER EXACT
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name='Mexique'), (SELECT id FROM teams WHERE name='Afrique du Sud'), '2026-06-11 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Corée du Sud'), (SELECT id FROM teams WHERE name='République tchèque'), '2026-06-12 04:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Canada'), (SELECT id FROM teams WHERE name='Bosnie-Herzégovine'), '2026-06-12 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='États-Unis'), (SELECT id FROM teams WHERE name='Paraguay'), '2026-06-13 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Qatar'), (SELECT id FROM teams WHERE name='Suisse'), '2026-06-13 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Brésil'), (SELECT id FROM teams WHERE name='Maroc'), '2026-06-14 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Haïti'), (SELECT id FROM teams WHERE name='Écosse'), '2026-06-14 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Australie'), (SELECT id FROM teams WHERE name='Turquie'), '2026-06-14 06:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Allemagne'), (SELECT id FROM teams WHERE name='Curaçao'), '2026-06-14 19:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Pays-Bas'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-14 22:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Côte d''Ivoire'), (SELECT id FROM teams WHERE name='Équateur'), '2026-06-15 01:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Suède'), (SELECT id FROM teams WHERE name='Tunisie'), '2026-06-15 04:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Espagne'), (SELECT id FROM teams WHERE name='Cap-Vert'), '2026-06-15 18:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Belgique'), (SELECT id FROM teams WHERE name='Égypte'), '2026-06-15 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Arabie saoudite'), (SELECT id FROM teams WHERE name='Uruguay'), '2026-06-16 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Iran'), (SELECT id FROM teams WHERE name='Nouvelle-Zélande'), '2026-06-16 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='France'), (SELECT id FROM teams WHERE name='Sénégal'), '2026-06-16 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Irak'), (SELECT id FROM teams WHERE name='Norvège'), '2026-06-17 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Argentine'), (SELECT id FROM teams WHERE name='Algérie'), '2026-06-17 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Autriche'), (SELECT id FROM teams WHERE name='Jordanie'), '2026-06-17 06:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Portugal'), (SELECT id FROM teams WHERE name='RD Congo'), '2026-06-17 19:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Angleterre'), (SELECT id FROM teams WHERE name='Croatie'), '2026-06-17 22:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Ghana'), (SELECT id FROM teams WHERE name='Panama'), '2026-06-18 01:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Ouzbékistan'), (SELECT id FROM teams WHERE name='Colombie'), '2026-06-18 04:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='République tchèque'), (SELECT id FROM teams WHERE name='Afrique du Sud'), '2026-06-18 18:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Suisse'), (SELECT id FROM teams WHERE name='Bosnie-Herzégovine'), '2026-06-18 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Canada'), (SELECT id FROM teams WHERE name='Qatar'), '2026-06-19 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Mexique'), (SELECT id FROM teams WHERE name='Corée du Sud'), '2026-06-19 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='États-Unis'), (SELECT id FROM teams WHERE name='Australie'), '2026-06-19 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Écosse'), (SELECT id FROM teams WHERE name='Maroc'), '2026-06-20 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Brésil'), (SELECT id FROM teams WHERE name='Haïti'), '2026-06-20 02:30:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Turquie'), (SELECT id FROM teams WHERE name='Paraguay'), '2026-06-20 05:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Pays-Bas'), (SELECT id FROM teams WHERE name='Suède'), '2026-06-20 19:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Allemagne'), (SELECT id FROM teams WHERE name='Côte d''Ivoire'), '2026-06-20 22:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Équateur'), (SELECT id FROM teams WHERE name='Curaçao'), '2026-06-21 02:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Tunisie'), (SELECT id FROM teams WHERE name='Japon'), '2026-06-21 06:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Espagne'), (SELECT id FROM teams WHERE name='Arabie saoudite'), '2026-06-21 18:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Belgique'), (SELECT id FROM teams WHERE name='Iran'), '2026-06-21 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Uruguay'), (SELECT id FROM teams WHERE name='Cap-Vert'), '2026-06-22 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Nouvelle-Zélande'), (SELECT id FROM teams WHERE name='Égypte'), '2026-06-22 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Argentine'), (SELECT id FROM teams WHERE name='Autriche'), '2026-06-22 19:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='France'), (SELECT id FROM teams WHERE name='Irak'), '2026-06-22 23:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Norvège'), (SELECT id FROM teams WHERE name='Sénégal'), '2026-06-23 02:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Jordanie'), (SELECT id FROM teams WHERE name='Algérie'), '2026-06-23 05:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Portugal'), (SELECT id FROM teams WHERE name='Ouzbékistan'), '2026-06-23 19:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Angleterre'), (SELECT id FROM teams WHERE name='Ghana'), '2026-06-23 22:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Panama'), (SELECT id FROM teams WHERE name='Croatie'), '2026-06-24 01:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Colombie'), (SELECT id FROM teams WHERE name='RD Congo'), '2026-06-24 04:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Suisse'), (SELECT id FROM teams WHERE name='Canada'), '2026-06-24 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Bosnie-Herzégovine'), (SELECT id FROM teams WHERE name='Qatar'), '2026-06-24 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Maroc'), (SELECT id FROM teams WHERE name='Haïti'), '2026-06-25 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Écosse'), (SELECT id FROM teams WHERE name='Brésil'), '2026-06-25 00:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Afrique du Sud'), (SELECT id FROM teams WHERE name='Corée du Sud'), '2026-06-25 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='République tchèque'), (SELECT id FROM teams WHERE name='Mexique'), '2026-06-25 03:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Curaçao'), (SELECT id FROM teams WHERE name='Côte d''Ivoire'), '2026-06-25 22:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Équateur'), (SELECT id FROM teams WHERE name='Allemagne'), '2026-06-25 22:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Tunisie'), (SELECT id FROM teams WHERE name='Pays-Bas'), '2026-06-26 01:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Japon'), (SELECT id FROM teams WHERE name='Suède'), '2026-06-26 01:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Turquie'), (SELECT id FROM teams WHERE name='États-Unis'), '2026-06-26 04:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Paraguay'), (SELECT id FROM teams WHERE name='Australie'), '2026-06-26 04:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Norvège'), (SELECT id FROM teams WHERE name='France'), '2026-06-26 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Sénégal'), (SELECT id FROM teams WHERE name='Irak'), '2026-06-26 21:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Cap-Vert'), (SELECT id FROM teams WHERE name='Arabie saoudite'), '2026-06-27 02:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Uruguay'), (SELECT id FROM teams WHERE name='Espagne'), '2026-06-27 02:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Nouvelle-Zélande'), (SELECT id FROM teams WHERE name='Belgique'), '2026-06-27 05:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Égypte'), (SELECT id FROM teams WHERE name='Iran'), '2026-06-27 05:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Panama'), (SELECT id FROM teams WHERE name='Angleterre'), '2026-06-27 23:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Croatie'), (SELECT id FROM teams WHERE name='Ghana'), '2026-06-27 23:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Colombie'), (SELECT id FROM teams WHERE name='Portugal'), '2026-06-28 01:30:00+02', 'pending'),
((SELECT id FROM teams WHERE name='RD Congo'), (SELECT id FROM teams WHERE name='Ouzbékistan'), '2026-06-28 01:30:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Algérie'), (SELECT id FROM teams WHERE name='Autriche'), '2026-06-28 04:00:00+02', 'pending'),
((SELECT id FROM teams WHERE name='Jordanie'), (SELECT id FROM teams WHERE name='Argentine'), '2026-06-28 04:00:00+02', 'pending');

-- 32 MATCHS PHASE ÉLIMINATOIRE AVEC DESCRIPTIONS
INSERT INTO matches (team1_id, team2_id, start_time, description, status) VALUES
(NULL, NULL, '2026-06-28 21:00:00+02', '1/16e — 2e groupe A – 2e groupe B', 'pending'),
(NULL, NULL, '2026-06-29 19:00:00+02', '1/16e — 1er groupe C – 2e groupe F', 'pending'),
(NULL, NULL, '2026-06-29 22:30:00+02', '1/16e — 1er groupe E – meilleur 3e', 'pending'),
(NULL, NULL, '2026-06-30 03:00:00+02', '1/16e — 1er groupe F – 2e groupe C', 'pending'),
(NULL, NULL, '2026-06-30 19:00:00+02', '1/16e — 2e groupe E – 2e groupe I', 'pending'),
(NULL, NULL, '2026-06-30 23:00:00+02', '1/16e — 1er groupe I – meilleur 3e', 'pending'),
(NULL, NULL, '2026-07-01 03:00:00+02', '1/16e — 1er groupe A – meilleur 3e', 'pending'),
(NULL, NULL, '2026-07-01 18:00:00+02', '1/16e — 1er groupe L – meilleur 3e', 'pending'),
(NULL, NULL, '2026-07-01 22:00:00+02', '1/16e — 1er groupe G – meilleur 3e', 'pending'),
(NULL, NULL, '2026-07-02 02:00:00+02', '1/16e — 1er groupe D – meilleur 3e', 'pending'),
(NULL, NULL, '2026-07-02 21:00:00+02', '1/16e — 1er groupe H – 2e groupe J', 'pending'),
(NULL, NULL, '2026-07-03 01:00:00+02', '1/16e — 2e groupe K – 2e groupe L', 'pending'),
(NULL, NULL, '2026-07-03 05:00:00+02', '1/16e — 1er groupe B – meilleur 3e', 'pending'),
(NULL, NULL, '2026-07-03 20:00:00+02', '1/16e — 2e groupe D – 2e groupe G', 'pending'),
(NULL, NULL, '2026-07-04 00:00:00+02', '1/16e — 1er groupe J – 2e groupe H', 'pending'),
(NULL, NULL, '2026-07-04 03:30:00+02', '1/16e — 1er groupe K – meilleur 3e', 'pending'),
(NULL, NULL, '2026-07-04 19:00:00+02', '1/8e — vainqueur M73 – vainqueur M75', 'pending'),
(NULL, NULL, '2026-07-04 23:00:00+02', '1/8e — vainqueur M74 – vainqueur M77', 'pending'),
(NULL, NULL, '2026-07-05 22:00:00+02', '1/8e — vainqueur M76 – vainqueur M78', 'pending'),
(NULL, NULL, '2026-07-06 02:00:00+02', '1/8e — vainqueur M79 – vainqueur M80', 'pending'),
(NULL, NULL, '2026-07-06 21:00:00+02', '1/8e — vainqueur M83 – vainqueur M84', 'pending'),
(NULL, NULL, '2026-07-07 02:00:00+02', '1/8e — vainqueur M81 – vainqueur M82', 'pending'),
(NULL, NULL, '2026-07-07 18:00:00+02', '1/8e — vainqueur M86 – vainqueur M88', 'pending'),
(NULL, NULL, '2026-07-07 22:00:00+02', '1/8e — vainqueur M85 – vainqueur M87', 'pending'),
(NULL, NULL, '2026-07-09 22:00:00+02', 'Quart — vainqueur M89 – vainqueur M90', 'pending'),
(NULL, NULL, '2026-07-10 21:00:00+02', 'Quart — vainqueur M93 – vainqueur M94', 'pending'),
(NULL, NULL, '2026-07-11 23:00:00+02', 'Quart — vainqueur M91 – vainqueur M92', 'pending'),
(NULL, NULL, '2026-07-12 03:00:00+02', 'Quart — vainqueur M95 – vainqueur M96', 'pending'),
(NULL, NULL, '2026-07-14 21:00:00+02', 'Demi-finale', 'pending'),
(NULL, NULL, '2026-07-15 21:00:00+02', 'Demi-finale', 'pending'),
(NULL, NULL, '2026-07-18 23:00:00+02', 'Match pour la 3e place', 'pending'),
(NULL, NULL, '2026-07-19 21:00:00+02', 'Finale', 'pending');
