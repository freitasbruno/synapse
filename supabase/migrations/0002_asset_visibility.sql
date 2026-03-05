-- ── STEP 1: Schema ────────────────────────────────────────────────────────────

ALTER TABLE assets
ADD COLUMN visibility text NOT NULL DEFAULT 'public'
CHECK (visibility IN ('public', 'private'));

CREATE INDEX assets_visibility_idx ON assets(visibility);

-- ── STEP 2: RLS ────────────────────────────────────────────────────────────────

-- Drop the existing public read policy
DROP POLICY IF EXISTS "Public can read published assets" ON assets;

-- Public can only see published + public assets
CREATE POLICY "Public can read published public assets"
ON assets FOR SELECT
USING (
  status = 'published' AND visibility = 'public'
);

-- Creators can always read their own assets regardless of visibility
CREATE POLICY "Creators can read their own assets"
ON assets FOR SELECT
TO authenticated
USING (
  creator_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Managers can read all assets
CREATE POLICY "Managers can read all assets"
ON assets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid() AND role = 'manager'
  )
);
