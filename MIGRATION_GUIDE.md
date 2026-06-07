# Database Refactoring: Teams Table Migration

## Overview
This migration refactors the database to use a separate `teams` table instead of storing team names directly in the `matches` table. This provides:
- ✅ Single source of truth for team data
- ✅ Easy to add team properties (logo, confederation, etc.)
- ✅ Reduced data redundancy
- ✅ Cleaner API responses with team metadata

## Migration Steps

### Step 1: Backup your database (recommended)
```bash
pg_dump takotak_db > backup_takotak_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Run the migration script

The migration is split into logical steps:

#### Option A: Quick Migration (if DB has old matches)
1. Run `migration_teams.sql` - Creates teams table, migrates data
2. The script will:
   - Create `teams` table with all 2026 World Cup teams
   - Add `team1_id` and `team2_id` columns to matches
   - Populate IDs from existing team names
   - Drop old `team1` and `team2` columns

```bash
psql takotak_db < backend/db/migration_teams.sql
```

#### Option B: Fresh Database Setup
If starting fresh, just run the updated schema:
```bash
psql takotak_db < backend/db/schema.sql
```

Then seed with matches:
```bash
# For group stage
psql takotak_db < backend/db/matches_2026_belgique_refactored.sql

# For knockout (handled dynamically in frontend for now)
# No pre-seeding needed - knockout brackets are calculated from group results
```

### Step 3: Update your API environment
No code changes needed! The backend routes have been updated to:
- Accept the new schema automatically
- Join with teams table for team names and flags
- Return both `team_id` and `team` name in responses

### Step 4: Restart the application
```bash
# Backend
npm restart
# or if using PM2
pm2 restart takotak-api

# Frontend
npm start
```

## Database Schema Changes

### Before
```sql
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  team1 VARCHAR(100),
  team2 VARCHAR(100),
  start_time TIMESTAMP,
  status VARCHAR(20),
  ...
);
```

### After
```sql
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  flag_emoji VARCHAR(10)
);

CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  team1_id INTEGER REFERENCES teams(id),
  team2_id INTEGER REFERENCES teams(id),
  start_time TIMESTAMP,
  status VARCHAR(20),
  ...
);
```

## API Response Changes

### Before
```json
{
  "id": 1,
  "team1": "Belgique",
  "team2": "Égypte",
  "start_time": "2026-06-15T19:00:00Z"
}
```

### After
```json
{
  "id": 1,
  "team1_id": 9,
  "team2_id": 20,
  "team1": "Belgique",
  "team1_flag": "🇧🇪",
  "team2": "Égypte",
  "team2_flag": "🇪🇬",
  "start_time": "2026-06-15T19:00:00Z"
}
```

## Rollback (if needed)
```bash
psql takotak_db < backup_takotak_YYYYMMDD_HHMMSS.sql
```

## Notes
- All existing predictions and results continue to work (they reference `match_id`, not team names)
- The `flag_emoji` is now in the database, so no need for frontend mapping
- API routes have been updated to handle the new schema
- Team names are now normalized in the database (no typos/inconsistencies)
- "République tchèque" is now the official name (instead of "Tchéquie")

## Testing the Migration

After migration, verify:
```bash
# Check teams were created
psql takotak_db -c "SELECT COUNT(*) as team_count FROM teams;"
# Should return: 140+

# Check matches have team IDs
psql takotak_db -c "SELECT team1_id, team2_id, start_time FROM matches LIMIT 5;"
# Should show numeric IDs instead of team names
```

## Questions?
If anything breaks:
1. Check the error message in the logs
2. Verify the migration script ran completely
3. Restore from backup if needed
