-- Add soft delete support to main entities
-- This allows archiving/deleting records while preserving audit trail and recovery capability

-- 1. Columns table
ALTER TABLE columns ADD COLUMN deleted_at timestamp with time zone;
CREATE INDEX idx_columns_deleted_at ON columns(deleted_at);

-- 2. Cards table
ALTER TABLE cards ADD COLUMN deleted_at timestamp with time zone;
CREATE INDEX idx_cards_deleted_at ON cards(deleted_at);

-- 3. Labels table
ALTER TABLE labels ADD COLUMN deleted_at timestamp with time zone;
CREATE INDEX idx_labels_deleted_at ON labels(deleted_at);

-- 4. Checklist Items table
ALTER TABLE checklist_items ADD COLUMN deleted_at timestamp with time zone;
CREATE INDEX idx_checklist_items_deleted_at ON checklist_items(deleted_at);

-- 5. Card Comments table
ALTER TABLE card_comments ADD COLUMN deleted_at timestamp with time zone;
CREATE INDEX idx_card_comments_deleted_at ON card_comments(deleted_at);
