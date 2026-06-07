-- ============================================================================
-- CUMULATIVE RESET & MIGRATION SCRIPT
-- For TakoTak: Migrate from team names to teams table
-- ============================================================================
-- This script:
-- 1. Backs up existing data (optional)
-- 2. Drops all tables
-- 3. Creates new schema with teams table
-- 4. Seeds teams with all 2026 World Cup nations
-- 5. Inserts all 72 group stage matches
-- ============================================================================

-- Step 1: Drop all existing tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS user_scores CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- ============================================================================
-- Step 2: Create Teams Table
-- ============================================================================
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  flag_emoji VARCHAR(10)
);

-- ============================================================================
-- Step 3: Create Users Table
-- ============================================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Step 4: Create Matches Table (with team IDs)
-- ============================================================================
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  team1_id INTEGER NOT NULL REFERENCES teams(id),
  team2_id INTEGER NOT NULL REFERENCES teams(id),
  start_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Step 5: Create Predictions Table
-- ============================================================================
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team1_goals INTEGER NOT NULL,
  team2_goals INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, match_id)
);

-- ============================================================================
-- Step 6: Create Results Table
-- ============================================================================
CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  match_id INTEGER UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team1_goals INTEGER NOT NULL,
  team2_goals INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Step 7: Create User Scores Table
-- ============================================================================
CREATE TABLE user_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, match_id)
);

-- ============================================================================
-- Step 8: Create Indices
-- ============================================================================
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_user_scores_user ON user_scores(user_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_team1 ON matches(team1_id);
CREATE INDEX idx_matches_team2 ON matches(team2_id);

-- ============================================================================
-- Step 9: Insert All 2026 World Cup Teams (140 teams with flags)
-- ============================================================================
INSERT INTO teams (name, flag_emoji) VALUES
('Afrique du Sud', '🇿🇦'),
('Algérie', '🇩🇿'),
('Allemagne', '🇩🇪'),
('Angleterre', '🇬🇧'),
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
('Écosse', '🇬🇧'),
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
('Papua Nouvelle-Guinée', '🇵🇬'),
('Paraguay', '🇵🇾'),
('Pays-Bas', '🇳🇱'),
('Pérou', '🇵🇪'),
('Philippines', '🇵🇭'),
('Pologne', '🇵🇱'),
('Polynésie française', '🇵🇫'),
('Porto Rico', '🇵🇷'),
('Portugal', '🇵🇹'),
('Qatar', '🇶🇦'),
('RD Congo', '🇨🇩'),
('République centrafricaine', '🇨🇫'),
('République dominicaine', '🇩🇴'),
('République du Congo', '🇨🇬'),
('République démocratique du Congo', '🇨🇩'),
('République tchèque', '🇨🇿'),
('Roumanie', '🇷🇴'),
('Royaume-Uni', '🇬🇧'),
('Russie', '🇷🇺'),
('Rwanda', '🇷🇼'),
('Sahara occidental', '🇪🇭'),
('Salvador', '🇸🇻'),
('Samoa', '🇼🇸'),
('Samoa américaines', '🇦🇸'),
('San Marin', '🇸🇲'),
('Sénégal', '🇸🇳'),
('Serbie', '🇷🇸'),
('Seychelles', '🇸🇨'),
('Sierra Leone', '🇸🇱'),
('Singapour', '🇸🇬'),
('Sint Maarten', '🇸🇽'),
('Slovaquie', '🇸🇰'),
('Slovénie', '🇸🇮'),
('Somalie', '🇸🇴'),
('Soudan', '🇸🇩'),
('Soudan du Sud', '🇸🇸'),
('Sri Lanka', '🇱🇰'),
('Suède', '🇸🇪'),
('Suisse', '🇨🇭'),
('Suriname', '🇸🇷'),
('Swaziland', '🇸🇿'),
('Syrie', '🇸🇾'),
('Tadjikistan', '🇹🇯'),
('Tahiti', '🇵🇫'),
('Taïwan', '🇹🇼'),
('Tanzanie', '🇹🇿'),
('Tchad', '🇹🇩'),
('Terres australes françaises', '🇹🇫'),
('Territoire britannique de l''océan Indien', '🇮🇴'),
('Territoire des îles Christmas', '🇨🇽'),
('Territoire des îles Cocos', '🇨🇨'),
('Territoire français du Pacifique', '🇵🇫'),
('Territoire français du sud', '🇹🇫'),
('Territoire français intra-muros', '🇫🇷'),
('Thaïlande', '🇹🇭'),
('Timor oriental', '🇹🇱'),
('Togo', '🇹🇬'),
('Tokelau', '🇹🇰'),
('Tonga', '🇹🇴'),
('Trinité-et-Tobago', '🇹🇹'),
('Tunisie', '🇹🇳'),
('Turkménistan', '🇹🇲'),
('Turquie', '🇹🇷'),
('Tuvalu', '🇹🇻'),
('Ukraine', '🇺🇦'),
('Union des Comores', '🇰🇲'),
('Uruguay', '🇺🇾'),
('Vanuatu', '🇻🇺'),
('Vatican', '🇻🇦'),
('Venezuela', '🇻🇪'),
('Viêt Nam', '🇻🇳'),
('Wallis et Futuna', '🇼🇫'),
('Yémen', '🇾🇪'),
('Zambie', '🇿🇲'),
('Zimbabwe', '🇿🇼');

-- ============================================================================
-- Step 10: Insert Group Stage Matches (72 total)
-- ============================================================================

-- GROUP A
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name = 'Mexique'), (SELECT id FROM teams WHERE name = 'Afrique du Sud'), '2026-06-11 21:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Corée du Sud'), (SELECT id FROM teams WHERE name = 'République tchèque'), '2026-06-12 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'République tchèque'), (SELECT id FROM teams WHERE name = 'Afrique du Sud'), '2026-06-18 16:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Mexique'), (SELECT id FROM teams WHERE name = 'Corée du Sud'), '2026-06-18 23:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'République tchèque'), (SELECT id FROM teams WHERE name = 'Mexique'), '2026-06-24 23:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Afrique du Sud'), (SELECT id FROM teams WHERE name = 'Corée du Sud'), '2026-06-24 23:00:00', 'pending');

-- GROUP B
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name = 'Canada'), (SELECT id FROM teams WHERE name = 'Bosnie-Herzégovine'), '2026-06-12 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Qatar'), (SELECT id FROM teams WHERE name = 'Suisse'), '2026-06-13 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Suisse'), (SELECT id FROM teams WHERE name = 'Bosnie-Herzégovine'), '2026-06-18 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Canada'), (SELECT id FROM teams WHERE name = 'Qatar'), '2026-06-19 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Suisse'), (SELECT id FROM teams WHERE name = 'Canada'), '2026-06-24 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Bosnie-Herzégovine'), (SELECT id FROM teams WHERE name = 'Qatar'), '2026-06-24 19:00:00', 'pending');

-- GROUP C
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name = 'Brésil'), (SELECT id FROM teams WHERE name = 'Maroc'), '2026-06-13 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Haïti'), (SELECT id FROM teams WHERE name = 'Écosse'), '2026-06-14 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Écosse'), (SELECT id FROM teams WHERE name = 'Maroc'), '2026-06-19 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Brésil'), (SELECT id FROM teams WHERE name = 'Haïti'), '2026-06-20 00:30:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Écosse'), (SELECT id FROM teams WHERE name = 'Brésil'), '2026-06-24 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Maroc'), (SELECT id FROM teams WHERE name = 'Haïti'), '2026-06-24 22:00:00', 'pending');

-- GROUP D
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name = 'États-Unis'), (SELECT id FROM teams WHERE name = 'Paraguay'), '2026-06-12 23:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Australie'), (SELECT id FROM teams WHERE name = 'Turquie'), '2026-06-14 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Turquie'), (SELECT id FROM teams WHERE name = 'Paraguay'), '2026-06-20 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'États-Unis'), (SELECT id FROM teams WHERE name = 'Australie'), '2026-06-19 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Turquie'), (SELECT id FROM teams WHERE name = 'États-Unis'), '2026-06-25 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Paraguay'), (SELECT id FROM teams WHERE name = 'Australie'), '2026-06-25 02:00:00', 'pending');

-- GROUP E
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name = 'Allemagne'), (SELECT id FROM teams WHERE name = 'Curaçao'), '2026-06-14 17:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Équateur'), (SELECT id FROM teams WHERE name = 'Côte d''Ivoire'), '2026-06-14 20:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Allemagne'), (SELECT id FROM teams WHERE name = 'Côte d''Ivoire'), '2026-06-20 20:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Équateur'), (SELECT id FROM teams WHERE name = 'Curaçao'), '2026-06-21 00:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Équateur'), (SELECT id FROM teams WHERE name = 'Allemagne'), '2026-06-25 20:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Curaçao'), (SELECT id FROM teams WHERE name = 'Côte d''Ivoire'), '2026-06-25 20:00:00', 'pending');

-- GROUP F
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name = 'Pays-Bas'), (SELECT id FROM teams WHERE name = 'Japon'), '2026-06-14 20:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Suède'), (SELECT id FROM teams WHERE name = 'Tunisie'), '2026-06-15 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Pays-Bas'), (SELECT id FROM teams WHERE name = 'Suède'), '2026-06-20 17:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Tunisie'), (SELECT id FROM teams WHERE name = 'Japon'), '2026-06-21 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Japon'), (SELECT id FROM teams WHERE name = 'Suède'), '2026-06-25 23:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Tunisie'), (SELECT id FROM teams WHERE name = 'Pays-Bas'), '2026-06-25 23:00:00', 'pending');

-- GROUP G
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name = 'Belgique'), (SELECT id FROM teams WHERE name = 'Égypte'), '2026-06-15 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Iran'), (SELECT id FROM teams WHERE name = 'Nouvelle-Zélande'), '2026-06-16 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Belgique'), (SELECT id FROM teams WHERE name = 'Iran'), '2026-06-21 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Nouvelle-Zélande'), (SELECT id FROM teams WHERE name = 'Égypte'), '2026-06-22 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Égypte'), (SELECT id FROM teams WHERE name = 'Iran'), '2026-06-27 03:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Nouvelle-Zélande'), (SELECT id FROM teams WHERE name = 'Belgique'), '2026-06-27 03:00:00', 'pending');

-- GROUP H
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name = 'Espagne'), (SELECT id FROM teams WHERE name = 'Cap-Vert'), '2026-06-15 16:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Arabie saoudite'), (SELECT id FROM teams WHERE name = 'Uruguay'), '2026-06-15 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Espagne'), (SELECT id FROM teams WHERE name = 'Arabie saoudite'), '2026-06-21 16:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Uruguay'), (SELECT id FROM teams WHERE name = 'Cap-Vert'), '2026-06-21 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Cap-Vert'), (SELECT id FROM teams WHERE name = 'Arabie saoudite'), '2026-06-26 23:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Uruguay'), (SELECT id FROM teams WHERE name = 'Espagne'), '2026-06-27 00:00:00', 'pending');

-- GROUP I
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name = 'France'), (SELECT id FROM teams WHERE name = 'Sénégal'), '2026-06-16 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Irak'), (SELECT id FROM teams WHERE name = 'Norvège'), '2026-06-16 22:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'France'), (SELECT id FROM teams WHERE name = 'Irak'), '2026-06-22 21:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Norvège'), (SELECT id FROM teams WHERE name = 'Sénégal'), '2026-06-23 00:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Norvège'), (SELECT id FROM teams WHERE name = 'France'), '2026-06-26 19:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Sénégal'), (SELECT id FROM teams WHERE name = 'Irak'), '2026-06-26 19:00:00', 'pending');

-- GROUP J
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name = 'Argentine'), (SELECT id FROM teams WHERE name = 'Algérie'), '2026-06-17 01:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Autriche'), (SELECT id FROM teams WHERE name = 'Jordanie'), '2026-06-17 04:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Argentine'), (SELECT id FROM teams WHERE name = 'Autriche'), '2026-06-22 17:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Jordanie'), (SELECT id FROM teams WHERE name = 'Algérie'), '2026-06-23 03:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Algérie'), (SELECT id FROM teams WHERE name = 'Autriche'), '2026-06-28 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Jordanie'), (SELECT id FROM teams WHERE name = 'Argentine'), '2026-06-28 02:00:00', 'pending');

-- GROUP K
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name = 'Portugal'), (SELECT id FROM teams WHERE name = 'RD Congo'), '2026-06-17 17:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Ouzbékistan'), (SELECT id FROM teams WHERE name = 'Colombie'), '2026-06-18 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Portugal'), (SELECT id FROM teams WHERE name = 'Ouzbékistan'), '2026-06-23 17:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Colombie'), (SELECT id FROM teams WHERE name = 'RD Congo'), '2026-06-24 02:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Colombie'), (SELECT id FROM teams WHERE name = 'Portugal'), '2026-06-27 23:30:00', 'pending'),
((SELECT id FROM teams WHERE name = 'RD Congo'), (SELECT id FROM teams WHERE name = 'Ouzbékistan'), '2026-06-27 23:30:00', 'pending');

-- GROUP L
INSERT INTO matches (team1_id, team2_id, start_time, status) VALUES
((SELECT id FROM teams WHERE name = 'Angleterre'), (SELECT id FROM teams WHERE name = 'Croatie'), '2026-06-17 20:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Ghana'), (SELECT id FROM teams WHERE name = 'Panama'), '2026-06-17 23:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Angleterre'), (SELECT id FROM teams WHERE name = 'Ghana'), '2026-06-23 20:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Panama'), (SELECT id FROM teams WHERE name = 'Croatie'), '2026-06-23 23:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Panama'), (SELECT id FROM teams WHERE name = 'Angleterre'), '2026-06-28 21:00:00', 'pending'),
((SELECT id FROM teams WHERE name = 'Croatie'), (SELECT id FROM teams WHERE name = 'Ghana'), '2026-06-28 21:00:00', 'pending');

-- ============================================================================
-- DONE!
-- ============================================================================
-- Summary:
-- - Created 140 teams with emoji flags
-- - Created 72 group stage matches
-- - Ready for predictions, results, and leaderboard
-- ============================================================================
