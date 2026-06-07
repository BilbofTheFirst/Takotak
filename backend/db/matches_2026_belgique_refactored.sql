-- World Cup 2026 Group Stage Matches (refactored with team IDs)
-- Using team names to reference IDs (adjust the VALUES to use team IDs based on teams table)

-- Group A (Mexique, Afrique du Sud, Corée du Sud, République tchèque)
INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Mexique'),
  (SELECT id FROM teams WHERE name = 'Afrique du Sud'),
  '2026-06-11 21:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Corée du Sud'),
  (SELECT id FROM teams WHERE name = 'République tchèque'),
  '2026-06-12 04:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'République tchèque'),
  (SELECT id FROM teams WHERE name = 'Afrique du Sud'),
  '2026-06-18 16:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Mexique'),
  (SELECT id FROM teams WHERE name = 'Corée du Sud'),
  '2026-06-18 23:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'République tchèque'),
  (SELECT id FROM teams WHERE name = 'Mexique'),
  '2026-06-24 23:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Afrique du Sud'),
  (SELECT id FROM teams WHERE name = 'Corée du Sud'),
  '2026-06-24 23:00:00', 'pending';

-- Group B (Canada, Bosnie-Herzégovine, Qatar, Suisse)
INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Canada'),
  (SELECT id FROM teams WHERE name = 'Bosnie-Herzégovine'),
  '2026-06-12 19:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Qatar'),
  (SELECT id FROM teams WHERE name = 'Suisse'),
  '2026-06-13 19:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Suisse'),
  (SELECT id FROM teams WHERE name = 'Bosnie-Herzégovine'),
  '2026-06-18 19:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Canada'),
  (SELECT id FROM teams WHERE name = 'Qatar'),
  '2026-06-19 01:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Suisse'),
  (SELECT id FROM teams WHERE name = 'Canada'),
  '2026-06-24 19:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Bosnie-Herzégovine'),
  (SELECT id FROM teams WHERE name = 'Qatar'),
  '2026-06-24 19:00:00', 'pending';

-- Group C (Brésil, Maroc, Haïti, Écosse)
INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Brésil'),
  (SELECT id FROM teams WHERE name = 'Maroc'),
  '2026-06-13 22:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Haïti'),
  (SELECT id FROM teams WHERE name = 'Écosse'),
  '2026-06-14 01:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Écosse'),
  (SELECT id FROM teams WHERE name = 'Maroc'),
  '2026-06-19 22:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Brésil'),
  (SELECT id FROM teams WHERE name = 'Haïti'),
  '2026-06-20 00:30:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Écosse'),
  (SELECT id FROM teams WHERE name = 'Brésil'),
  '2026-06-24 22:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Maroc'),
  (SELECT id FROM teams WHERE name = 'Haïti'),
  '2026-06-24 22:00:00', 'pending';

-- Group D (États-Unis, Paraguay, Australie, Turquie)
INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'États-Unis'),
  (SELECT id FROM teams WHERE name = 'Paraguay'),
  '2026-06-12 23:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Australie'),
  (SELECT id FROM teams WHERE name = 'Turquie'),
  '2026-06-14 04:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Turquie'),
  (SELECT id FROM teams WHERE name = 'Paraguay'),
  '2026-06-20 02:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'États-Unis'),
  (SELECT id FROM teams WHERE name = 'Australie'),
  '2026-06-19 19:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Turquie'),
  (SELECT id FROM teams WHERE name = 'États-Unis'),
  '2026-06-25 02:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Paraguay'),
  (SELECT id FROM teams WHERE name = 'Australie'),
  '2026-06-25 02:00:00', 'pending';

-- Group E (Allemagne, Côte d'Ivoire, Équateur, Curaçao)
INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Allemagne'),
  (SELECT id FROM teams WHERE name = 'Curaçao'),
  '2026-06-14 17:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Équateur'),
  (SELECT id FROM teams WHERE name = 'Côte d''Ivoire'),
  '2026-06-14 20:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Allemagne'),
  (SELECT id FROM teams WHERE name = 'Côte d''Ivoire'),
  '2026-06-20 20:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Équateur'),
  (SELECT id FROM teams WHERE name = 'Curaçao'),
  '2026-06-21 00:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Équateur'),
  (SELECT id FROM teams WHERE name = 'Allemagne'),
  '2026-06-25 20:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Curaçao'),
  (SELECT id FROM teams WHERE name = 'Côte d''Ivoire'),
  '2026-06-25 20:00:00', 'pending';

-- Group F (Pays-Bas, Japon, Suède, Tunisie)
INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Pays-Bas'),
  (SELECT id FROM teams WHERE name = 'Japon'),
  '2026-06-14 20:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Suède'),
  (SELECT id FROM teams WHERE name = 'Tunisie'),
  '2026-06-15 02:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Pays-Bas'),
  (SELECT id FROM teams WHERE name = 'Suède'),
  '2026-06-20 17:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Tunisie'),
  (SELECT id FROM teams WHERE name = 'Japon'),
  '2026-06-21 04:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Japon'),
  (SELECT id FROM teams WHERE name = 'Suède'),
  '2026-06-25 23:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Tunisie'),
  (SELECT id FROM teams WHERE name = 'Pays-Bas'),
  '2026-06-25 23:00:00', 'pending';

-- Group G (Belgique, Égypte, Iran, Nouvelle-Zélande)
INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Belgique'),
  (SELECT id FROM teams WHERE name = 'Égypte'),
  '2026-06-15 19:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Iran'),
  (SELECT id FROM teams WHERE name = 'Nouvelle-Zélande'),
  '2026-06-16 02:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Belgique'),
  (SELECT id FROM teams WHERE name = 'Iran'),
  '2026-06-21 19:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Nouvelle-Zélande'),
  (SELECT id FROM teams WHERE name = 'Égypte'),
  '2026-06-22 01:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Égypte'),
  (SELECT id FROM teams WHERE name = 'Iran'),
  '2026-06-27 03:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Nouvelle-Zélande'),
  (SELECT id FROM teams WHERE name = 'Belgique'),
  '2026-06-27 03:00:00', 'pending';

-- Group H (Espagne, Cap-Vert, Arabie saoudite, Uruguay)
INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Espagne'),
  (SELECT id FROM teams WHERE name = 'Cap-Vert'),
  '2026-06-15 16:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Arabie saoudite'),
  (SELECT id FROM teams WHERE name = 'Uruguay'),
  '2026-06-15 22:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Espagne'),
  (SELECT id FROM teams WHERE name = 'Arabie saoudite'),
  '2026-06-21 16:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Uruguay'),
  (SELECT id FROM teams WHERE name = 'Cap-Vert'),
  '2026-06-21 22:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Cap-Vert'),
  (SELECT id FROM teams WHERE name = 'Arabie saoudite'),
  '2026-06-26 23:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Uruguay'),
  (SELECT id FROM teams WHERE name = 'Espagne'),
  '2026-06-27 00:00:00', 'pending';

-- Group I (France, Sénégal, Irak, Norvège)
INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'France'),
  (SELECT id FROM teams WHERE name = 'Sénégal'),
  '2026-06-16 19:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Irak'),
  (SELECT id FROM teams WHERE name = 'Norvège'),
  '2026-06-16 22:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'France'),
  (SELECT id FROM teams WHERE name = 'Irak'),
  '2026-06-22 21:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Norvège'),
  (SELECT id FROM teams WHERE name = 'Sénégal'),
  '2026-06-23 00:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Norvège'),
  (SELECT id FROM teams WHERE name = 'France'),
  '2026-06-26 19:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Sénégal'),
  (SELECT id FROM teams WHERE name = 'Irak'),
  '2026-06-26 19:00:00', 'pending';

-- Group J (Argentine, Algérie, Autriche, Jordanie)
INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Argentine'),
  (SELECT id FROM teams WHERE name = 'Algérie'),
  '2026-06-17 01:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Autriche'),
  (SELECT id FROM teams WHERE name = 'Jordanie'),
  '2026-06-17 04:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Argentine'),
  (SELECT id FROM teams WHERE name = 'Autriche'),
  '2026-06-22 17:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Jordanie'),
  (SELECT id FROM teams WHERE name = 'Algérie'),
  '2026-06-23 03:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Algérie'),
  (SELECT id FROM teams WHERE name = 'Autriche'),
  '2026-06-28 02:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Jordanie'),
  (SELECT id FROM teams WHERE name = 'Argentine'),
  '2026-06-28 02:00:00', 'pending';

-- Group K (Portugal, RD Congo, Ouzbékistan, Colombie)
INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Portugal'),
  (SELECT id FROM teams WHERE name = 'RD Congo'),
  '2026-06-17 17:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Ouzbékistan'),
  (SELECT id FROM teams WHERE name = 'Colombie'),
  '2026-06-18 02:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Portugal'),
  (SELECT id FROM teams WHERE name = 'Ouzbékistan'),
  '2026-06-23 17:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Colombie'),
  (SELECT id FROM teams WHERE name = 'RD Congo'),
  '2026-06-24 02:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Colombie'),
  (SELECT id FROM teams WHERE name = 'Portugal'),
  '2026-06-27 23:30:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'RD Congo'),
  (SELECT id FROM teams WHERE name = 'Ouzbékistan'),
  '2026-06-27 23:30:00', 'pending';

-- Group L (Angleterre, Croatie, Ghana, Panama)
INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Angleterre'),
  (SELECT id FROM teams WHERE name = 'Croatie'),
  '2026-06-17 20:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Ghana'),
  (SELECT id FROM teams WHERE name = 'Panama'),
  '2026-06-17 23:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Angleterre'),
  (SELECT id FROM teams WHERE name = 'Ghana'),
  '2026-06-23 20:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Panama'),
  (SELECT id FROM teams WHERE name = 'Croatie'),
  '2026-06-23 23:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Panama'),
  (SELECT id FROM teams WHERE name = 'Angleterre'),
  '2026-06-28 21:00:00', 'pending';

INSERT INTO matches (team1_id, team2_id, start_time, status)
SELECT
  (SELECT id FROM teams WHERE name = 'Croatie'),
  (SELECT id FROM teams WHERE name = 'Ghana'),
  '2026-06-28 21:00:00', 'pending';
