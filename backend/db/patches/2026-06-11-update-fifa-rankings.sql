BEGIN;

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS fifa_ranking integer,
  ADD COLUMN IF NOT EXISTS fifa_ranking_source varchar(255),
  ADD COLUMN IF NOT EXISTS fifa_ranking_updated_at date;

WITH ranking_data(team_name, fifa_ranking, aliases) AS (
  VALUES
    ('Argentina', 1, ARRAY['Argentina', 'Argentine']),
    ('Spain', 2, ARRAY['Spain', 'Espagne']),
    ('France', 3, ARRAY['France']),
    ('England', 4, ARRAY['England', 'Angleterre']),
    ('Portugal', 5, ARRAY['Portugal']),
    ('Brazil', 6, ARRAY['Brazil', 'Brésil', 'Bresil']),
    ('Morocco', 7, ARRAY['Morocco', 'Maroc']),
    ('Netherlands', 8, ARRAY['Netherlands', 'Pays-Bas', 'Pays Bas']),
    ('Belgium', 9, ARRAY['Belgium', 'Belgique']),
    ('Germany', 10, ARRAY['Germany', 'Allemagne']),
    ('Croatia', 11, ARRAY['Croatia', 'Croatie']),
    ('Colombia', 13, ARRAY['Colombia', 'Colombie']),
    ('Mexico', 14, ARRAY['Mexico', 'Mexique']),
    ('Senegal', 15, ARRAY['Senegal', 'Sénégal']),
    ('Uruguay', 16, ARRAY['Uruguay']),
    ('United States', 17, ARRAY['United States', 'United States of America', 'USA', 'États-Unis', 'Etats-Unis']),
    ('Japan', 18, ARRAY['Japan', 'Japon']),
    ('Switzerland', 19, ARRAY['Switzerland', 'Suisse']),
    ('Iran', 20, ARRAY['Iran']),
    ('Turkey', 22, ARRAY['Turkey', 'Turquie', 'Türkiye']),
    ('Ecuador', 23, ARRAY['Ecuador', 'Équateur', 'Equateur']),
    ('Austria', 24, ARRAY['Austria', 'Autriche']),
    ('South Korea', 25, ARRAY['South Korea', 'Korea Republic', 'Corée du Sud', 'Coree du Sud']),
    ('Australia', 27, ARRAY['Australia', 'Australie']),
    ('Algeria', 28, ARRAY['Algeria', 'Algérie', 'Algerie']),
    ('Egypt', 29, ARRAY['Egypt', 'Égypte', 'Egypte']),
    ('Canada', 30, ARRAY['Canada']),
    ('Norway', 31, ARRAY['Norway', 'Norvège', 'Norvege']),
    ('Ivory Coast', 33, ARRAY['Ivory Coast', 'Côte d''Ivoire', 'Cote d''Ivoire']),
    ('Panama', 34, ARRAY['Panama']),
    ('Sweden', 38, ARRAY['Sweden', 'Suède', 'Suede']),
    ('Czech Republic', 40, ARRAY['Czech Republic', 'Czechia', 'République tchèque', 'Republique tcheque', 'Tchéquie', 'Tchequie']),
    ('Paraguay', 41, ARRAY['Paraguay']),
    ('Scotland', 42, ARRAY['Scotland', 'Écosse', 'Ecosse']),
    ('Tunisia', 45, ARRAY['Tunisia', 'Tunisie']),
    ('DR Congo', 46, ARRAY['DR Congo', 'Congo DR', 'Democratic Republic of the Congo', 'RD Congo', 'Congo']),
    ('Uzbekistan', 50, ARRAY['Uzbekistan', 'Ouzbékistan', 'Ouzbekistan']),
    ('Qatar', 56, ARRAY['Qatar']),
    ('Iraq', 57, ARRAY['Iraq', 'Irak']),
    ('South Africa', 60, ARRAY['South Africa', 'Afrique du Sud']),
    ('Saudi Arabia', 61, ARRAY['Saudi Arabia', 'Arabie saoudite', 'Arabie Saoudite']),
    ('Jordan', 63, ARRAY['Jordan', 'Jordanie']),
    ('Bosnia and Herzegovina', 64, ARRAY['Bosnia and Herzegovina', 'Bosnia & Herzegovina', 'Bosnie-Herzégovine', 'Bosnie-Herzegovine']),
    ('Cape Verde', 67, ARRAY['Cape Verde', 'Cabo Verde', 'Cap-Vert', 'Cap Vert']),
    ('Ghana', 73, ARRAY['Ghana']),
    ('Curaçao', 82, ARRAY['Curaçao', 'Curacao']),
    ('Haiti', 83, ARRAY['Haiti', 'Haïti']),
    ('New Zealand', 85, ARRAY['New Zealand', 'Nouvelle-Zélande', 'Nouvelle-Zelande'])
), updated AS (
  UPDATE teams t
  SET fifa_ranking = r.fifa_ranking,
      fifa_ranking_source = 'FIFA/Coca-Cola Men''s World Ranking',
      fifa_ranking_updated_at = DATE '2026-06-11'
  FROM ranking_data r
  WHERE t.name = ANY(r.aliases)
  RETURNING t.id, t.name, t.fifa_ranking
)
SELECT 'updated teams' AS check_name, COUNT(*)::text AS value
FROM updated;

WITH ranking_data(team_name, fifa_ranking, aliases) AS (
  VALUES
    ('Argentina', 1, ARRAY['Argentina', 'Argentine']),
    ('Spain', 2, ARRAY['Spain', 'Espagne']),
    ('France', 3, ARRAY['France']),
    ('England', 4, ARRAY['England', 'Angleterre']),
    ('Portugal', 5, ARRAY['Portugal']),
    ('Brazil', 6, ARRAY['Brazil', 'Brésil', 'Bresil']),
    ('Morocco', 7, ARRAY['Morocco', 'Maroc']),
    ('Netherlands', 8, ARRAY['Netherlands', 'Pays-Bas', 'Pays Bas']),
    ('Belgium', 9, ARRAY['Belgium', 'Belgique']),
    ('Germany', 10, ARRAY['Germany', 'Allemagne']),
    ('Croatia', 11, ARRAY['Croatia', 'Croatie']),
    ('Colombia', 13, ARRAY['Colombia', 'Colombie']),
    ('Mexico', 14, ARRAY['Mexico', 'Mexique']),
    ('Senegal', 15, ARRAY['Senegal', 'Sénégal']),
    ('Uruguay', 16, ARRAY['Uruguay']),
    ('United States', 17, ARRAY['United States', 'United States of America', 'USA', 'États-Unis', 'Etats-Unis']),
    ('Japan', 18, ARRAY['Japan', 'Japon']),
    ('Switzerland', 19, ARRAY['Switzerland', 'Suisse']),
    ('Iran', 20, ARRAY['Iran']),
    ('Turkey', 22, ARRAY['Turkey', 'Turquie', 'Türkiye']),
    ('Ecuador', 23, ARRAY['Ecuador', 'Équateur', 'Equateur']),
    ('Austria', 24, ARRAY['Austria', 'Autriche']),
    ('South Korea', 25, ARRAY['South Korea', 'Korea Republic', 'Corée du Sud', 'Coree du Sud']),
    ('Australia', 27, ARRAY['Australia', 'Australie']),
    ('Algeria', 28, ARRAY['Algeria', 'Algérie', 'Algerie']),
    ('Egypt', 29, ARRAY['Egypt', 'Égypte', 'Egypte']),
    ('Canada', 30, ARRAY['Canada']),
    ('Norway', 31, ARRAY['Norway', 'Norvège', 'Norvege']),
    ('Ivory Coast', 33, ARRAY['Ivory Coast', 'Côte d''Ivoire', 'Cote d''Ivoire']),
    ('Panama', 34, ARRAY['Panama']),
    ('Sweden', 38, ARRAY['Sweden', 'Suède', 'Suede']),
    ('Czech Republic', 40, ARRAY['Czech Republic', 'Czechia', 'République tchèque', 'Republique tcheque', 'Tchéquie', 'Tchequie']),
    ('Paraguay', 41, ARRAY['Paraguay']),
    ('Scotland', 42, ARRAY['Scotland', 'Écosse', 'Ecosse']),
    ('Tunisia', 45, ARRAY['Tunisia', 'Tunisie']),
    ('DR Congo', 46, ARRAY['DR Congo', 'Congo DR', 'Democratic Republic of the Congo', 'RD Congo', 'Congo']),
    ('Uzbekistan', 50, ARRAY['Uzbekistan', 'Ouzbékistan', 'Ouzbekistan']),
    ('Qatar', 56, ARRAY['Qatar']),
    ('Iraq', 57, ARRAY['Iraq', 'Irak']),
    ('South Africa', 60, ARRAY['South Africa', 'Afrique du Sud']),
    ('Saudi Arabia', 61, ARRAY['Saudi Arabia', 'Arabie saoudite', 'Arabie Saoudite']),
    ('Jordan', 63, ARRAY['Jordan', 'Jordanie']),
    ('Bosnia and Herzegovina', 64, ARRAY['Bosnia and Herzegovina', 'Bosnia & Herzegovina', 'Bosnie-Herzégovine', 'Bosnie-Herzegovine']),
    ('Cape Verde', 67, ARRAY['Cape Verde', 'Cabo Verde', 'Cap-Vert', 'Cap Vert']),
    ('Ghana', 73, ARRAY['Ghana']),
    ('Curaçao', 82, ARRAY['Curaçao', 'Curacao']),
    ('Haiti', 83, ARRAY['Haiti', 'Haïti']),
    ('New Zealand', 85, ARRAY['New Zealand', 'Nouvelle-Zélande', 'Nouvelle-Zelande'])
)
SELECT r.team_name AS missing_from_teams_table
FROM ranking_data r
WHERE NOT EXISTS (
  SELECT 1
  FROM teams t
  WHERE t.name = ANY(r.aliases)
)
ORDER BY r.fifa_ranking;

SELECT name, fifa_ranking, fifa_ranking_updated_at
FROM teams
WHERE fifa_ranking IS NOT NULL
ORDER BY fifa_ranking NULLS LAST, name;

COMMIT;
