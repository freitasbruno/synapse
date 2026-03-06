-- RLS policies for ai_usage_logs
-- (Table has RLS enabled but no policies were defined, blocking all access)

-- Authenticated users can insert their own usage logs
CREATE POLICY "users can insert own ai usage logs"
  ON ai_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Managers can read all usage logs (for the admin dashboard)
CREATE POLICY "managers can select all ai usage logs"
  ON ai_usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND role = 'manager'
    )
  );
