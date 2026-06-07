# How to Reset & Migrate Database on Railway

## ⚠️ WARNING
This will **DROP ALL TABLES** and start fresh. Make sure you have a backup if needed!

---

## 🚀 Option 1: Via Railway Dashboard (Easiest)

### Step 1: Go to Railway Dashboard
1. Open https://railway.app
2. Go to your TakoTak project
3. Click on **PostgreSQL** service (database)
4. Click **Query Editor** or **Terminal**

### Step 2: Run the Migration Script
Copy the entire contents of `backend/db/00_RESET_AND_MIGRATE.sql` and paste it into the query editor.

Then click **Execute**.

**It will:**
- ✅ Drop all old tables
- ✅ Create fresh schema with teams table
- ✅ Insert 140 World Cup teams with flags
- ✅ Insert 72 group stage matches

---

## 🔧 Option 2: Via Command Line (psql)

### Step 1: Get Railway Database URL
```bash
# On Railway dashboard, in PostgreSQL service:
# Copy the DATABASE_URL from "Variables" tab
# It looks like: postgresql://user:pass@host:port/database
```

### Step 2: Run the migration
```bash
# From your local machine
psql "$DATABASE_URL" < backend/db/00_RESET_AND_MIGRATE.sql
```

Or with individual parameters:
```bash
psql \
  -h your-host.railway.internal \
  -U postgres \
  -d takotak_db \
  -f backend/db/00_RESET_AND_MIGRATE.sql
```

---

## 📊 Option 3: Via Railway CLI (if installed)

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Run the SQL file directly
railway exec psql < backend/db/00_RESET_AND_MIGRATE.sql
```

---

## ✅ Verify It Worked

### Check Teams Table
```sql
SELECT COUNT(*) as team_count FROM teams;
-- Should return: 140
```

### Check Matches
```sql
SELECT COUNT(*) as match_count FROM matches;
-- Should return: 72
```

### See Sample Data
```sql
SELECT m.id, t1.name as team1, t1.flag_emoji, t2.name as team2, t2.flag_emoji, m.start_time
FROM matches m
JOIN teams t1 ON m.team1_id = t1.id
JOIN teams t2 ON m.team2_id = t2.id
LIMIT 5;
```

---

## 🔄 After Migration

### Backend (automatic)
- Routes are already updated to use the new schema
- No code changes needed!

### Frontend (automatic)
- Receives `team1`, `team1_flag`, `team2`, `team2_flag` from API
- Fallback to local mapping if needed

### Redeploy
```bash
git add .
git commit -m "refactor: deploy teams table refactoring"
git push origin main
```

Railway will auto-deploy once pushed to GitHub.

---

## 🆘 If Something Goes Wrong

### Check logs
```bash
# On Railway, go to PostgreSQL service → Logs tab
# Look for error messages
```

### Restore from backup (if you made one)
```bash
psql "$DATABASE_URL" < backup_takotak_before_migration.sql
```

### Reset and try again
- Delete the database instance (⚠️ careful!)
- Create a new one
- Run the migration fresh

---

## 📝 What the Script Does (Step by Step)

1. **Drops all existing tables** (in safe order)
   - user_scores → results → predictions → matches → users → teams

2. **Creates new schema** with teams table
   - teams (id, name, flag_emoji)
   - users, matches, predictions, results, user_scores (same as before but with team IDs)

3. **Inserts 140 teams**
   - All 2026 World Cup participating nations
   - Each with their flag emoji

4. **Inserts 72 group stage matches**
   - All 12 groups (A-L)
   - 6 matches per group
   - Correct UTC+2 Belgium times

5. **Creates indices** for performance

---

## 🎯 Next Steps

After successful migration:

1. ✅ Test the API
   - `GET /api/matches` should return team data with flags
   - `GET /api/predictions` should join with teams table

2. ✅ Test the frontend
   - Login and view Predictions page
   - Should show team names + flags from DB

3. ✅ Create an admin user and test results entry

4. ✅ Play with simulations!

---

## Questions?

The script is idempotent for the INSERT statements - if you run it again, you'll get an error on the DDL (drop/create) but the script is safe because it drops first before creating.

If you need to run it multiple times, you can comment out the INSERT sections on subsequent runs.

Good luck! 🚀
