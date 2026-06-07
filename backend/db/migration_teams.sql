-- Migration: Add Teams table and refactor matches
-- This script migrates from team names to team IDs

-- Step 1: Create teams table
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  flag_emoji VARCHAR(10)
);

-- Step 2: Insert all 2026 World Cup teams with emoji flags
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

-- Step 3: Add team1_id and team2_id columns to matches
ALTER TABLE matches
ADD COLUMN team1_id INTEGER,
ADD COLUMN team2_id INTEGER;

-- Step 4: Populate team IDs from team names
UPDATE matches m
SET team1_id = t.id
FROM teams t
WHERE m.team1 = t.name;

UPDATE matches m
SET team2_id = t.id
FROM teams t
WHERE m.team2 = t.name;

-- Step 5: Add foreign key constraints
ALTER TABLE matches
ADD CONSTRAINT fk_matches_team1 FOREIGN KEY (team1_id) REFERENCES teams(id),
ADD CONSTRAINT fk_matches_team2 FOREIGN KEY (team2_id) REFERENCES teams(id);

-- Step 6: Drop old columns
ALTER TABLE matches DROP COLUMN team1;
ALTER TABLE matches DROP COLUMN team2;

-- Step 7: Make IDs NOT NULL
ALTER TABLE matches ALTER COLUMN team1_id SET NOT NULL;
ALTER TABLE matches ALTER COLUMN team2_id SET NOT NULL;

-- Step 8: Create indices
CREATE INDEX idx_matches_team1 ON matches(team1_id);
CREATE INDEX idx_matches_team2 ON matches(team2_id);
