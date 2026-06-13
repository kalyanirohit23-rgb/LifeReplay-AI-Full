# Supabase Setup for LifeReplay AI

Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query):

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Memories table
create table if not exists public.memories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  memory_date date not null,
  location text,
  tags text[],
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Memory media table
create table if not exists public.memory_media (
  id uuid default uuid_generate_v4() primary key,
  memory_id uuid references public.memories(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text check (type in ('photo', 'video', 'voice')) not null,
  file_name text not null,
  file_url text not null,
  file_size bigint,
  mime_type text,
  duration_seconds integer,
  created_at timestamptz default now() not null
);

-- Row Level Security
alter table public.memories enable row level security;
alter table public.memory_media enable row level security;

-- RLS Policies for memories
create policy "Users can view own memories"
  on public.memories for select using (auth.uid() = user_id);
create policy "Users can insert own memories"
  on public.memories for insert with check (auth.uid() = user_id);
create policy "Users can update own memories"
  on public.memories for update using (auth.uid() = user_id);
create policy "Users can delete own memories"
  on public.memories for delete using (auth.uid() = user_id);

-- RLS Policies for memory_media
create policy "Users can view own media"
  on public.memory_media for select using (auth.uid() = user_id);
create policy "Users can insert own media"
  on public.memory_media for insert with check (auth.uid() = user_id);
create policy "Users can update own media"
  on public.memory_media for update using (auth.uid() = user_id);
create policy "Users can delete own media"
  on public.memory_media for delete using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists memories_user_id_idx on public.memories(user_id);
create index if not exists memories_memory_date_idx on public.memories(memory_date desc);
create index if not exists memory_media_memory_id_idx on public.memory_media(memory_id);
```

## Storage Bucket

In Supabase Dashboard → Storage → New Bucket:
- Name: `memory-media`
- Public: ✅ (or set up signed URLs for private)

Then add Storage Policy:
```sql
create policy "Users can upload their own media"
  on storage.objects for insert
  with check (bucket_id = 'memory-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their own media"
  on storage.objects for select
  using (bucket_id = 'memory-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own media"
  on storage.objects for delete
  using (bucket_id = 'memory-media' and auth.uid()::text = (storage.foldername(name))[1]);
```

## Authentication

In Supabase Dashboard → Authentication → Providers:
- Enable **Email** provider
- Enable **Google** provider (requires Google OAuth credentials)

## Environment Variables

In Replit Secrets, add:
- `VITE_SUPABASE_URL` — your project URL (Settings → API → Project URL)
- `VITE_SUPABASE_ANON_KEY` — your anon/public key (Settings → API → Project API keys)
