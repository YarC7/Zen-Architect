-- Migration to add 'key' field to projects table
-- The 'key' field is a unique identifier (e.g., 'ZEN', 'PROJ') for each project.

ALTER TABLE projects ADD COLUMN key text;

-- Generate initial keys for existing projects based on their titles (first 3-5 uppercase letters)
-- This is a simple heuristic; users can change it later.
UPDATE projects 
SET key = UPPER(SUBSTRING(REGEXP_REPLACE(title, '[^a-zA-Z]', '', 'g') FROM 1 FOR 5))
WHERE key IS NULL;

-- If some projects ended up with empty keys (e.g. title has no letters), handle them
UPDATE projects
SET key = UPPER(SUBSTRING(id::text FROM 1 FOR 5))
WHERE key IS NULL OR key = '';

-- Ensure 'key' is NOT NULL and UNIQUE after backfilling
ALTER TABLE projects ALTER COLUMN key SET NOT NULL;
ALTER TABLE projects ADD CONSTRAINT projects_key_unique UNIQUE (key);
