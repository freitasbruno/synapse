CREATE TABLE asset_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL REFERENCES users(id),
  filename text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  label text,
  description text,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX asset_attachments_asset_id_idx ON asset_attachments(asset_id);
CREATE INDEX asset_attachments_uploader_id_idx ON asset_attachments(uploader_id);

-- RLS
ALTER TABLE asset_attachments ENABLE ROW LEVEL SECURITY;

-- Anyone can read attachment metadata on published public assets
CREATE POLICY "Public can read attachments on public assets"
ON asset_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM assets
    WHERE assets.id = asset_id
      AND assets.status = 'published'
      AND assets.visibility = 'public'
  )
);

-- Owners can read their own asset attachments (incl. drafts/private)
CREATE POLICY "Owners can read own asset attachments"
ON asset_attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assets
    JOIN users ON users.id = assets.creator_id
    WHERE assets.id = asset_id
      AND users.auth_id = auth.uid()
  )
);

-- Managers can read all attachments
CREATE POLICY "Managers can read all attachments"
ON asset_attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid() AND role = 'manager'
  )
);

-- Owners can insert attachments on their own assets
CREATE POLICY "Owners can insert attachments"
ON asset_attachments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assets
    JOIN users ON users.id = assets.creator_id
    WHERE assets.id = asset_id
      AND users.auth_id = auth.uid()
  )
);

-- Managers can insert attachments on any asset
CREATE POLICY "Managers can insert attachments"
ON asset_attachments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid() AND role = 'manager'
  )
);

-- Owners can delete their own attachments
CREATE POLICY "Owners can delete own attachments"
ON asset_attachments FOR DELETE
TO authenticated
USING (
  uploader_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Managers can delete any attachment
CREATE POLICY "Managers can delete any attachment"
ON asset_attachments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid() AND role = 'manager'
  )
);

-- Owners and managers can update (for download_count increment)
CREATE POLICY "Service can update download count"
ON asset_attachments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
