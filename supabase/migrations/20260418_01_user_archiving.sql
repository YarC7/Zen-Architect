-- Add soft delete/archiving support to profiles
ALTER TABLE profiles ADD COLUMN deleted_at timestamp with time zone;
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at);

-- Update RLS policies to handle deleted_at if needed
-- (Assuming we want to filter them out in normal views, but allow admin to manage)
