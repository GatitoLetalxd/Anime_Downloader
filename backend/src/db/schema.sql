-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  username    VARCHAR(32)  UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(10)  NOT NULL DEFAULT 'user',  -- 'user' | 'admin'
  avatar      VARCHAR(50)  NOT NULL DEFAULT 'avatar_01.png',
  is_banned   BOOLEAN      NOT NULL DEFAULT FALSE,
  banned_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_seen   TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ
);

-- Apply column migrations to existing databases
ALTER TABLE users ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- ─── Favorites ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anime_url   TEXT         NOT NULL,
  anime_title TEXT         NOT NULL,
  anime_cover TEXT,
  provider    VARCHAR(32),
  added_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, anime_url)
);

-- ─── Watch Progress (Continuar Viendo) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS watch_progress (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anime_url        TEXT         NOT NULL,
  anime_title      TEXT         NOT NULL,
  anime_cover      TEXT,
  provider         VARCHAR(32),
  episode_num      INT          NOT NULL,
  episode_url      TEXT         NOT NULL,
  progress_seconds INT          NOT NULL DEFAULT 0,
  duration_seconds INT          NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, anime_url)
);

-- Apply column migrations to existing databases
ALTER TABLE watch_progress ADD COLUMN IF NOT EXISTS progress_seconds INT NOT NULL DEFAULT 0;
ALTER TABLE watch_progress ADD COLUMN IF NOT EXISTS duration_seconds INT NOT NULL DEFAULT 0;

-- ─── Anime Cache (Persistencia de Metadatos y Episodios) ───────────────────
CREATE TABLE IF NOT EXISTS anime_cache (
  url         TEXT         PRIMARY KEY,
  provider    VARCHAR(32)  NOT NULL,
  data        JSONB        NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ  NOT NULL
);

-- ─── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_favorites_user_id      ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_user_id ON watch_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);
CREATE INDEX IF NOT EXISTS idx_anime_cache_expires_at ON anime_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_anime_cache_provider   ON anime_cache(provider);

