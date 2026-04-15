-- Make profile_id nullable in card_comments table
-- This allows comments to be written without a logged-in user (e.g., bypass auth mode)
alter table card_comments
  alter column profile_id drop not null;
