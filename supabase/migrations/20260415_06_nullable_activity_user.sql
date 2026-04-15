-- Make user_id nullable in activities table
-- This allows activities to be written without a logged-in user (e.g., bypass auth mode)
alter table activities
  alter column user_id drop not null;
