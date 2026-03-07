CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'new_star',
    'new_comment',
    'asset_validated',
    'new_follower'
  )),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_user_id_read_idx ON notifications(user_id, read);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
TO authenticated
USING (
  user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- No direct INSERT policy for authenticated users
-- Server-side inserts via SECURITY DEFINER functions only

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
TO authenticated
USING (
  user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- ─── RPC functions ────────────────────────────────────────────────────────────

-- Create a notification (SECURITY DEFINER so API routes can insert)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_actor_id uuid DEFAULT NULL,
  p_asset_id uuid DEFAULT NULL,
  p_collection_id uuid DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  -- Don't notify users about their own actions
  IF p_user_id = p_actor_id THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (user_id, type, actor_id, asset_id, collection_id)
  VALUES (p_user_id, p_type, p_actor_id, p_asset_id, p_collection_id)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM notifications
  WHERE user_id = p_user_id AND read = false;
$$ LANGUAGE sql SECURITY DEFINER;

-- Mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id uuid)
RETURNS void AS $$
  UPDATE notifications
  SET read = true
  WHERE user_id = p_user_id AND read = false;
$$ LANGUAGE sql SECURITY DEFINER;
