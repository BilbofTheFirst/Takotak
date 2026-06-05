# TakoTak - World Cup Predictions App

Simple app for making and tracking World Cup predictions with friends.

## Features
- User registration & login
- Make predictions on matches
- Automatic point calculation
- Simulation mode
- Admin panel for results
- Rankings

## Tech Stack
- Backend: Node.js + Express
- Frontend: React
- Database: PostgreSQL
- Hosting: Railway (backend), Vercel (frontend)

## Quick Start

### Backend
```bash
cd backend
npm install
# Create .env with DATABASE_URL and JWT_SECRET
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Scoring System
- Exact score: 3 points
- Correct difference: 2 points
- Correct winner: 1 point
- Draw: 1 point
