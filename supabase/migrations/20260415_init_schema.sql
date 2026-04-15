-- ZenArc Supabase Schema Migration
-- Note: Profiles table is handled in 20260415_01_users_logic.sql

-- 2. Projects
create table projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  background_type text check (background_type in ('color', 'image', 'gradient')) default 'color',
  background_value text not null default '#f8fafc',
  owner_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Columns
create table columns (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  color text not null,
  position integer not null, -- Sort order
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Cards
create table cards (
  id uuid default gen_random_uuid() primary key,
  column_id uuid references columns(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  description text,
  start_date date,
  due_date date,
  start_time time,
  due_time time,
  completed boolean default false not null,
  is_archived boolean default false not null, -- Added for archive feature
  position integer not null, -- Sort order within column
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Labels
create table labels (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  color text not null
);

-- 6. Junction: Card <-> Labels
create table card_labels (
  card_id uuid references cards(id) on delete cascade not null,
  label_id uuid references labels(id) on delete cascade not null,
  primary key (card_id, label_id)
);

-- 7. Junction: Card <-> Assignees (Profiles)
create table card_assignees (
  card_id uuid references cards(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade not null,
  primary key (card_id, profile_id)
);

-- 8. Checklist Items
create table checklist_items (
  id uuid default gen_random_uuid() primary key,
  card_id uuid references cards(id) on delete cascade not null,
  text text not null,
  checked boolean default false not null,
  position integer not null
);

-- 9. Comments
create table card_comments (
  id uuid default gen_random_uuid() primary key,
  card_id uuid references cards(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Activities
create table activities (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  card_id uuid references cards(id) on delete set null,
  user_id uuid references profiles(id) not null,
  type text not null, -- 'move', 'create', 'update', 'delete', 'comment'
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Color Swatches (Palette)
create table color_swatches (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  color_value text not null, -- HSL or Hex
  category text not null default 'default', -- 'label', 'column', 'background'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) - Basic setup
alter table projects enable row level security;
alter table profiles enable row level security;
alter table columns enable row level security;
alter table cards enable row level security;
alter table labels enable row level security;
alter table card_labels enable row level security;
alter table card_assignees enable row level security;
alter table checklist_items enable row level security;
alter table card_comments enable row level security;
alter table activities enable row level security;
alter table color_swatches enable row level security;

-- Policies for Projects (Owner only)
create policy "Users can view their own projects" on projects for select using (auth.uid() = owner_id);
create policy "Users can insert their own projects" on projects for insert with check (auth.uid() = owner_id);
create policy "Users can update their own projects" on projects for update using (auth.uid() = owner_id);
create policy "Users can delete their own projects" on projects for delete using (auth.uid() = owner_id);

-- Policies for Sub-resources (Access via Project ownership)
-- Note: Simplified for now, assuming owner access.
create policy "Owner can manage columns" on columns for all using (
  exists (select 1 from projects where projects.id = columns.project_id and projects.owner_id = auth.uid())
);

create policy "Owner can manage cards" on cards for all using (
  exists (select 1 from projects where projects.id = cards.project_id and projects.owner_id = auth.uid())
);

create policy "Owner can manage labels" on labels for all using (
  exists (select 1 from projects where projects.id = labels.project_id and projects.owner_id = auth.uid())
);

create policy "Owner can manage checklist items" on checklist_items for all using (
  exists (select 1 from cards join projects on cards.project_id = projects.id 
          where cards.id = checklist_items.card_id and projects.owner_id = auth.uid())
);

-- 12. Seed Data (Initial Board Reference)
-- LƯU Ý: Chèn user vào auth.users trước, sau đó chèn vào profiles.
-- Điều này cho phép bạn đăng nhập bằng email 'test@example.com' / password 'password123'
