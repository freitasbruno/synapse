-- =============================================================
-- Synapse: Initial Schema Migration
-- =============================================================

-- ---------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id              uuid        UNIQUE NOT NULL,
  display_name         text        NOT NULL,
  email                text        UNIQUE NOT NULL,
  photo_url            text,
  role                 text        NOT NULL DEFAULT 'member'
                                   CHECK (role IN ('member', 'manager')),
  bio                  text,
  technical_focus      text,
  profile_complete     boolean     NOT NULL DEFAULT false,
  contributions_count  integer     NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- ASSETS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assets (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id            uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                 text        NOT NULL,
  type                  text        NOT NULL
                                    CHECK (type IN ('prompt', 'tool', 'app', 'workflow')),
  description           text,
  content               text,
  description_sequence  jsonb       NOT NULL DEFAULT '[]',
  external_url          text,
  tags                  text[]      NOT NULL DEFAULT '{}',
  attachments           jsonb       NOT NULL DEFAULT '[]',
  status                text        NOT NULL DEFAULT 'draft'
                                    CHECK (status IN ('draft', 'published')),
  vote_count            integer     NOT NULL DEFAULT 0,
  star_count            integer     NOT NULL DEFAULT 0,
  comment_count         integer     NOT NULL DEFAULT 0,
  view_count            integer     NOT NULL DEFAULT 0,
  is_manager_validated  boolean     NOT NULL DEFAULT false,
  validation_score      numeric     NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  last_published_at     timestamptz
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- COMMENTS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   uuid        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name  text        NOT NULL,
  text       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- VOTES
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS votes (
  id         text        PRIMARY KEY, -- format: userId_assetId
  asset_id   uuid        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- ACTIVITY LOGS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text        NOT NULL
                         CHECK (type IN ('copy_action', 'ai_refine_trigger')),
  asset_id   uuid        REFERENCES assets(id) ON DELETE SET NULL,
  user_id    uuid        REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- AI USAGE LOGS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          text        NOT NULL DEFAULT 'refinement',
  tokens_input  integer     NOT NULL DEFAULT 0,
  tokens_output integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- SYSTEM STATS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_stats (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  date                date    UNIQUE NOT NULL,
  total_refine_calls  integer NOT NULL DEFAULT 0,
  total_tokens        integer NOT NULL DEFAULT 0
);

ALTER TABLE system_stats ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- TRIGGER: auto-update assets.updated_at
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------
-- COMPOSITE INDEXES
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_assets_status_created_at
  ON assets (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assets_status_star_count
  ON assets (status, star_count DESC);

CREATE INDEX IF NOT EXISTS idx_comments_asset_id_created_at
  ON comments (asset_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_votes_asset_id
  ON votes (asset_id);

CREATE INDEX IF NOT EXISTS idx_votes_user_id
  ON votes (user_id);
