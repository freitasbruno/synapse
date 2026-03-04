-- RPC function for incrementing view_count safely without direct update access.
-- SECURITY DEFINER runs as the function owner, bypassing RLS.
CREATE OR REPLACE FUNCTION increment_view_count(asset_id uuid)
RETURNS void AS $$
  UPDATE assets SET view_count = view_count + 1 WHERE id = asset_id;
$$ LANGUAGE sql SECURITY DEFINER;
