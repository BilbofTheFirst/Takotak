-- TakoTak production hardening migration
-- Run once on Railway PostgreSQL before deploying the backend changes.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
  ON users (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique
  ON users (LOWER(username));

ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Optional: promote your own user after registration.
-- Replace the email if needed.
UPDATE users
SET is_admin = TRUE
WHERE LOWER(email) = LOWER('alexandre_jacques@hotmail.com');
