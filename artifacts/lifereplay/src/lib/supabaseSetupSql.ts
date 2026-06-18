export const CORE_SETUP_SQL = `-- Source of truth: supabase/migrations/202606180001_core_foundation.sql
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
`;

export const STORAGE_POLICY_SQL = `-- Source of truth: supabase/migrations/202606180001_core_foundation.sql
create policy "Authenticated users can upload media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'memory-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Authenticated users can view media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'memory-media');

create policy "Public can view media"
  on storage.objects for select
  to anon
  using (bucket_id = 'memory-media');

create policy "Users can delete own media files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'memory-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );`;
