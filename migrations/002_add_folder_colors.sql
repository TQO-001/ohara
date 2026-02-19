-- Add color field to notes_items for folder color coding
ALTER TABLE notes_items ADD COLUMN IF NOT EXISTS color TEXT;

-- Add some helpful comments
COMMENT ON COLUMN notes_items.color IS 'Hex color code for folders (e.g. #8B5CF6)';
