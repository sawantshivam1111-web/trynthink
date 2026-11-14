-- Enable UUID
create extension if not exists "uuid-ossp";

-- users handled by auth.users
create table public.permissions (
  user_id uuid references auth.users(id) primary key,
  notifications boolean default false,
  usage_opt_in boolean default false
);

create table public.thinking_profile (
  user_id uuid references auth.users(id) primary key,
  method text,
  strengths text[],
  weaknesses text[],
  created_at timestamp default now()
);

create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  type text check (type in ('break','challenge','tutor')),
  duration int,
  created_at timestamp default now()
);

create table public.responses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  challenge_id text,
  draft text,
  submitted boolean default false,
  ai_assist_level text,
  created_at timestamp default now()
);

create table public.stars (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  amount int,
  source text,
  created_at timestamp default now()
);

create table public.community_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  body text not null,
  votes int default 0,
  created_at timestamp default now()
);

create table public.votes (
  user_id uuid references auth.users(id),
  post_id uuid references public.community_posts(id),
  primary key (user_id, post_id)
);

-- Row Level Security
alter table public.permissions enable row level security;
alter table public.thinking_profile enable row level security;
alter table public.sessions enable row level security;
alter table public.responses enable row level security;
alter table public.stars enable row level security;
alter table public.community_posts enable row level security;
alter table public.votes enable row level security;

create policy "users can manage own data" on public.permissions for all using (auth.uid() = user_id);
create policy "users can manage own profile" on public.thinking_profile for all using (auth.uid() = user_id);