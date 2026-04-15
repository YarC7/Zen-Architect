-- 1. Profiles (Linked to Auth/Users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  color text, -- HSL format string
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for Profiles
alter table profiles enable row level security;
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- 2. Auth Seed Logic (Many Users)
DO $$
DECLARE
  user_id uuid;
  user_email text;
  user_name text;
  user_color text;
  emails text[] := ARRAY[
    'admin@zenarc.com', 'dev1@zenarc.com', 'dev2@zenarc.com', 'design1@zenarc.com', 'design2@zenarc.com',
    'pm1@zenarc.com', 'pm2@zenarc.com', 'qa1@zenarc.com', 'qa2@zenarc.com', 'frontend1@zenarc.com',
    'backend1@zenarc.com', 'devops@zenarc.com', 'cto@zenarc.com', 'manager@zenarc.com', 'hr@zenarc.com'
  ];
  names text[] := ARRAY[
    'Admin User', 'Alice Developer', 'Bob Coder', 'Sarah Designer', 'Mike Visuals',
    'Chris Product', 'David Roadmap', 'Emma Tester', 'Frank Quality', 'Grace React',
    'Hank Node', 'Ivan Deploy', 'Kevin Tech', 'Liam Lead', 'Nancy People'
  ];
  colors text[] := ARRAY[
    '210 20% 98%', '142 71% 45%', '25 95% 53%', '262 83% 58%', '330 81% 60%',
    '199 89% 48%', '47 95% 50%', '0 84% 60%', '160 84% 39%', '280 60% 50%',
    '20 90% 60%', '200 70% 40%', '240 50% 30%', '100 40% 50%', '300 50% 70%'
  ];
BEGIN
  FOR i IN 1..cardinality(emails) LOOP
    user_id := ('00000000-0000-0000-0000-' || LPAD(i::text, 12, '0'))::uuid;
    user_email := emails[i];
    user_name := names[i];
    user_color := colors[i];

    -- Insert into auth.users (Tất cả dùng chung password: password123)
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (user_id, '00000000-0000-0000-0000-000000000000', user_email, crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', format('{"full_name":"%s"}', user_name)::jsonb, now(), now(), 'authenticated', '', '', '', '')
    ON CONFLICT (id) DO NOTHING;

    -- Insert into auth.identities
    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
    VALUES (gen_random_uuid(), user_id, format('{"sub":"%s","email":"%s"}', user_id::text, user_email)::jsonb, 'email', now(), now(), now(), user_id::text)
    ON CONFLICT DO NOTHING;

    -- Insert into profiles
    INSERT INTO public.profiles (id, username, full_name, avatar_url, color)
    VALUES (user_id, lower(replace(user_name, ' ', '_')), user_name, null, user_color)
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

