# Deployment Guide

## Prerequisites
- GitHub account with repo pushed
- Railway.app account (free)
- Vercel account (free)

## Database Setup (PostgreSQL on Railway)

1. Go to https://railway.app
2. Click "New Project" → "Provision PostgreSQL"
3. Copy the DATABASE_URL from the PostgreSQL config

## Backend Deployment (Node.js on Railway)

1. Go back to your Railway project
2. Add "New Service" → "GitHub Repo" → Select takotak repo
3. Configure:
   - Select `/backend` as root directory
   - Add variables:
     - `DATABASE_URL`: (paste from PostgreSQL)
     - `JWT_SECRET`: (generate something like: `your-secret-key-here`)
     - `PORT`: `3001`
4. Deploy! Railway will auto-deploy on push
5. Copy the public URL (e.g., `https://takotak-api.railway.app`)

## Frontend Deployment (React on Vercel)

1. Go to https://vercel.com
2. Import your GitHub repo
3. Configure:
   - Select `/frontend` as root directory
   - Environment variables:
     - `REACT_APP_API_URL`: (paste your Railway backend URL + `/api`)
   - Build command: `npm run build`
4. Deploy!

## Testing

After deployment:
1. Go to your Vercel frontend URL
2. Register with test account
3. Try making predictions
4. Check admin panel to add match results

## Quick Checklist

- [ ] PostgreSQL on Railway with DATABASE_URL
- [ ] Backend on Railway with env vars
- [ ] Frontend on Vercel with REACT_APP_API_URL
- [ ] Database initialized (run `npm run db:init` locally first, or Railway auto-runs it)
- [ ] Test login/register
- [ ] Test predictions
- [ ] Test admin panel

## Local Development

### Backend:
```bash
cd backend
npm install
# Create .env with DATABASE_URL and JWT_SECRET
# Initialize DB: npm run db:init
npm run dev
```

### Frontend:
```bash
cd frontend
npm install
# Create .env.local with REACT_APP_API_URL=http://localhost:3001/api
npm start
```

## Common Issues

**CORS errors**: Make sure backend has `REACT_APP_API_URL` pointing to correct backend URL
**404 on API calls**: Check that backend is running and routes are accessible
**Auth fails**: Verify JWT_SECRET is set on both local and remote

## Adding World Cup 2026 Matches

You'll need to add matches to the database. You can:
1. Use the admin panel (if you're admin user)
2. Or insert directly into DB:

```sql
INSERT INTO matches (team1, team2, start_time, status) VALUES
  ('Team1', 'Team2', '2026-06-11 20:00:00', 'pending'),
  ...;
```

Good luck! 🏆
