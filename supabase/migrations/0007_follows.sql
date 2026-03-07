CREATE TABLE follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX follows_follower_id_idx ON follows(follower_id);
CREATE INDEX follows_following_id_idx ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Anyone can see follow counts (needed for profile display)
CREATE POLICY "Public can read follows"
ON follows FOR SELECT
USING (true);

-- Authenticated users can follow
CREATE POLICY "Authenticated users can follow"
ON follows FOR INSERT
TO authenticated
WITH CHECK (
  follower_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
TO authenticated
USING (
  follower_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- ─── RPC functions ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION toggle_follow(
  p_follower_id uuid,
  p_following_id uuid
) RETURNS json AS $$
DECLARE
  v_existing boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM follows
    WHERE follower_id = p_follower_id
    AND following_id = p_following_id
  ) INTO v_existing;

  IF v_existing THEN
    DELETE FROM follows
    WHERE follower_id = p_follower_id
    AND following_id = p_following_id;
    RETURN json_build_object('following', false);
  ELSE
    INSERT INTO follows (follower_id, following_id)
    VALUES (p_follower_id, p_following_id);
    RETURN json_build_object('following', true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get follower and following counts for a user
CREATE OR REPLACE FUNCTION get_follow_counts(p_user_id uuid)
RETURNS json AS $$
  SELECT json_build_object(
    'followers', (SELECT COUNT(*) FROM follows WHERE following_id = p_user_id),
    'following', (SELECT COUNT(*) FROM follows WHERE follower_id = p_user_id)
  );
$$ LANGUAGE sql SECURITY DEFINER;
