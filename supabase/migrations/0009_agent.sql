-- ─────────────────────────────────────────────────────────────────────────────
-- 0009_agent.sql  —  AI Research Agent
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable pgvector for semantic deduplication
CREATE EXTENSION IF NOT EXISTS vector;

-- ── agent_runs ────────────────────────────────────────────────────────────────
-- Tracks each research run triggered by a manager

CREATE TABLE agent_runs (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  domain                      text        NOT NULL,
  focus_notes                 text,
  max_assets                  integer     NOT NULL DEFAULT 10,
  status                      text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'searching', 'evaluating',
                      'deduplicating', 'drafting', 'completed', 'failed')),
  current_step_detail         text,
  assets_found                integer     DEFAULT 0,
  assets_evaluated            integer     DEFAULT 0,
  assets_passed_evaluation    integer     DEFAULT 0,
  assets_passed_deduplication integer     DEFAULT 0,
  assets_drafted              integer     DEFAULT 0,
  assets_approved             integer     DEFAULT 0,
  assets_rejected             integer     DEFAULT 0,
  error_message               text,
  triggered_by                uuid        REFERENCES users(id),
  started_at                  timestamptz DEFAULT now(),
  completed_at                timestamptz
);

-- ── agent_candidates ──────────────────────────────────────────────────────────
-- Individual use-case candidates found during the search phase

CREATE TABLE agent_candidates (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id                uuid        NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  title                 text        NOT NULL,
  summary               text,
  source_url            text,
  raw_content           text,
  evaluation_score      numeric,
  evaluation_reasoning  text,
  passed_evaluation     boolean,
  similarity_score      numeric,
  passed_deduplication  boolean,
  nearest_asset_id      uuid        REFERENCES assets(id),
  drafted_asset_id      uuid        REFERENCES assets(id),
  status                text        NOT NULL DEFAULT 'found'
    CHECK (status IN ('found', 'evaluated', 'deduplicated', 'drafted', 'skipped')),
  created_at            timestamptz DEFAULT now()
);

-- ── Extend assets table ───────────────────────────────────────────────────────

ALTER TABLE assets ADD COLUMN IF NOT EXISTS is_agent_generated  boolean DEFAULT false;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS agent_run_id        uuid    REFERENCES agent_runs(id);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS agent_candidate_id  uuid    REFERENCES agent_candidates(id);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS source_url          text;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS agent_quality_score numeric;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS embedding           vector(768);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX agent_runs_status_idx        ON agent_runs(status);
CREATE INDEX agent_runs_triggered_by_idx  ON agent_runs(triggered_by);
CREATE INDEX agent_candidates_run_id_idx  ON agent_candidates(run_id);
CREATE INDEX agent_candidates_status_idx  ON agent_candidates(run_id, status);

-- IVFFlat index for fast cosine similarity search (requires ≥ 1 row to train)
-- Created with lists=100; tune upward as asset count grows beyond ~1 million
CREATE INDEX assets_embedding_idx ON assets
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── Vector similarity helper ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION match_assets_by_embedding(
  query_embedding vector(768),
  match_count     integer DEFAULT 1
)
RETURNS TABLE (id uuid, title text, similarity numeric)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    title,
    (1 - (embedding <=> query_embedding))::numeric AS similarity
  FROM assets
  WHERE status = 'published'
    AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE agent_runs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_candidates ENABLE ROW LEVEL SECURITY;

-- agent_runs policies
CREATE POLICY "Managers can read agent runs"
  ON agent_runs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'manager'));

CREATE POLICY "Managers can insert agent runs"
  ON agent_runs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'manager'));

CREATE POLICY "Managers can update agent runs"
  ON agent_runs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'manager'));

-- agent_candidates policies
CREATE POLICY "Managers can read agent candidates"
  ON agent_candidates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'manager'));

CREATE POLICY "Managers can insert agent candidates"
  ON agent_candidates FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'manager'));

CREATE POLICY "Managers can update agent candidates"
  ON agent_candidates FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'manager'));
