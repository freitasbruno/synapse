-- Update the check constraint on assets.type
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_type_check;
ALTER TABLE assets
ADD CONSTRAINT assets_type_check
CHECK (type IN ('prompt', 'agent', 'app', 'workflow'));

-- Migrate any existing 'tool' assets to 'agent'
UPDATE assets SET type = 'agent' WHERE type = 'tool';
