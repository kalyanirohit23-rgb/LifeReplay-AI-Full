-- LifeReplay v3 foundation migration
-- Core schema, RLS policies, and storage hardening.

create extension if not exists "uuid-ossp";

create table if not exists public.memories (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  body          text,
  memory_date   date not null,
  memory_type   text check (memory_type in ('personal','travel','family','work','celebration','milestone','other')),
  location_id   uuid,
  mood          text,
  tags          text[] default '{}'::text[] not null,
  people        text[] default '{}'::text[] not null,
  place         text,
  is_favorite   boolean default false not null,
  metadata      jsonb default '{}'::jsonb not null,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- Backfill for repositories where memories table already exists from earlier versions.
alter table public.memories add column if not exists mood text;
alter table public.memories add column if not exists tags text[] default '{}'::text[] not null;
alter table public.memories add column if not exists people text[] default '{}'::text[] not null;
alter table public.memories add column if not exists place text;
alter table public.memories add column if not exists is_favorite boolean default false not null;
alter table public.memories add column if not exists metadata jsonb default '{}'::jsonb not null;
alter table public.memories add column if not exists updated_at timestamptz default now() not null;

create table if not exists public.memory_media (
  id               uuid default uuid_generate_v4() primary key,
  memory_id        uuid references public.memories(id) on delete cascade not null,
  user_id          uuid references auth.users(id) on delete cascade not null,
  type             text check (type in ('photo', 'video', 'voice')) not null,
  file_name        text not null,
  file_url         text not null,
  file_size        bigint,
  mime_type        text,
  duration_seconds integer,
  created_at       timestamptz default now() not null
);

alter table public.memories enable row level security;
alter table public.memory_media enable row level security;

drop policy if exists "Users can view own memories" on public.memories;
create policy "Users can view own memories"
  on public.memories for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own memories" on public.memories;
create policy "Users can insert own memories"
  on public.memories for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own memories" on public.memories;
create policy "Users can update own memories"
  on public.memories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own memories" on public.memories;
create policy "Users can delete own memories"
  on public.memories for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own media" on public.memory_media;
create policy "Users can view own media"
  on public.memory_media for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own media" on public.memory_media;
create policy "Users can insert own media"
  on public.memory_media for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own media" on public.memory_media;
create policy "Users can update own media"
  on public.memory_media for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own media" on public.memory_media;
create policy "Users can delete own media"
  on public.memory_media for delete
  using (auth.uid() = user_id);

create index if not exists memories_user_id_idx on public.memories(user_id);
create index if not exists memories_date_idx on public.memories(memory_date desc);
create index if not exists memories_type_idx on public.memories(memory_type);
create index if not exists memories_favorite_idx on public.memories(is_favorite) where is_favorite = true;
create index if not exists memories_tags_gin_idx on public.memories using gin(tags);
create index if not exists memories_people_gin_idx on public.memories using gin(people);
create index if not exists memory_media_memory_idx on public.memory_media(memory_id);
create index if not exists memory_media_user_idx on public.memory_media(user_id);

drop policy if exists "Authenticated users can upload media" on storage.objects;
create policy "Authenticated users can upload media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'memory-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated users can view media" on storage.objects;
create policy "Authenticated users can view media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'memory-media');

drop policy if exists "Public can view media" on storage.objects;
create policy "Public can view media"
  on storage.objects for select
  to anon
  using (bucket_id = 'memory-media');

drop policy if exists "Users can delete own media files" on storage.objects;
create policy "Users can delete own media files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'memory-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
