-- Collections
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private')),
  star_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Assets within collections (ordered)
CREATE TABLE collection_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(collection_id, asset_id)
);

-- Stars on collections (separate from asset stars)
CREATE TABLE collection_stars (
  id text PRIMARY KEY, -- format: userId_collectionId
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX collections_user_id_idx ON collections(user_id);
CREATE INDEX collection_assets_collection_id_idx ON collection_assets(collection_id);
CREATE INDEX collection_assets_position_idx ON collection_assets(collection_id, position);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_stars ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public can read public collections
CREATE POLICY "Public can read public collections"
ON collections FOR SELECT
USING (visibility = 'public');

-- Owners can read their own private collections
CREATE POLICY "Owners can read own collections"
ON collections FOR SELECT
TO authenticated
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Authenticated users can create collections
CREATE POLICY "Authenticated users can create collections"
ON collections FOR INSERT
TO authenticated
WITH CHECK (true);

-- Owners can update their own collections
CREATE POLICY "Owners can update own collections"
ON collections FOR UPDATE
TO authenticated
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Owners can delete their own collections
CREATE POLICY "Owners can delete own collections"
ON collections FOR DELETE
TO authenticated
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- collection_assets: readable if parent collection is readable
CREATE POLICY "Public can read public collection assets"
ON collection_assets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM collections
    WHERE id = collection_id AND visibility = 'public'
  )
);

CREATE POLICY "Owners can manage collection assets"
ON collection_assets FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM collections c
    JOIN users u ON u.id = c.user_id
    WHERE c.id = collection_id AND u.auth_id = auth.uid()
  )
);

-- collection_stars
CREATE POLICY "Public can read collection stars"
ON collection_stars FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can star collections"
ON collection_stars FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can remove own collection stars"
ON collection_stars FOR DELETE
TO authenticated
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ─── RPC functions ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION toggle_collection_star(
  p_collection_id uuid,
  p_user_id uuid
) RETURNS json AS $$
DECLARE
  v_star_id text := p_user_id::text || '_' || p_collection_id::text;
  v_existing boolean;
  v_new_count integer;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM collection_stars WHERE id = v_star_id
  ) INTO v_existing;

  IF v_existing THEN
    DELETE FROM collection_stars WHERE id = v_star_id;
    UPDATE collections
    SET star_count = GREATEST(star_count - 1, 0)
    WHERE id = p_collection_id
    RETURNING star_count INTO v_new_count;
    RETURN json_build_object('starred', false, 'star_count', v_new_count);
  ELSE
    INSERT INTO collection_stars (id, collection_id, user_id)
    VALUES (v_star_id, p_collection_id, p_user_id);
    UPDATE collections
    SET star_count = star_count + 1
    WHERE id = p_collection_id
    RETURNING star_count INTO v_new_count;
    RETURN json_build_object('starred', true, 'star_count', v_new_count);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
