-- =============================================================
-- Synapse: RLS Policies for Auth
-- Run this after 0001_initial_schema.sql
-- =============================================================

-- ---------------------------------------------------------------
-- ASSETS
-- ---------------------------------------------------------------

-- Anyone (including anonymous) can read published assets.
CREATE POLICY "assets_public_read_published" ON assets
  FOR SELECT USING (status = 'published');

-- Authenticated asset owners can read all their own assets (any status).
CREATE POLICY "assets_owner_read_all" ON assets
  FOR SELECT USING (
    creator_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Authenticated users can insert assets they own.
CREATE POLICY "assets_owner_insert" ON assets
  FOR INSERT WITH CHECK (
    creator_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Asset owners can update their own assets.
CREATE POLICY "assets_owner_update" ON assets
  FOR UPDATE USING (
    creator_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Asset owners can delete their own assets.
CREATE POLICY "assets_owner_delete" ON assets
  FOR DELETE USING (
    creator_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ---------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------

-- Users can read their own profile row.
CREATE POLICY "users_own_select" ON users
  FOR SELECT USING (auth_id = auth.uid());

-- Authenticated users can create their own profile row (first login).
CREATE POLICY "users_own_insert" ON users
  FOR INSERT WITH CHECK (auth_id = auth.uid());

-- Users can update their own profile row.
CREATE POLICY "users_own_update" ON users
  FOR UPDATE USING (auth_id = auth.uid());

-- ---------------------------------------------------------------
-- COMMENTS
-- ---------------------------------------------------------------

-- Anyone can read comments on published assets.
CREATE POLICY "comments_public_read" ON comments
  FOR SELECT USING (
    asset_id IN (SELECT id FROM assets WHERE status = 'published')
  );

-- Authenticated users can insert comments.
CREATE POLICY "comments_auth_insert" ON comments
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Comment authors can delete their own comments.
CREATE POLICY "comments_own_delete" ON comments
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ---------------------------------------------------------------
-- VOTES
-- ---------------------------------------------------------------

-- Anyone can read vote counts.
CREATE POLICY "votes_public_read" ON votes
  FOR SELECT USING (true);

-- Authenticated users can manage their own votes.
CREATE POLICY "votes_own_insert" ON votes
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "votes_own_delete" ON votes
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
