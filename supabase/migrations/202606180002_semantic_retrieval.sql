-- LifeReplay v3 semantic retrieval migration
-- Embeddings + grounded retrieval helpers.

create extension if not exists vector;
create extension if not exists pg_trgm;

create table if not exists public.memory_embeddings (
  memory_id      uuid primary key references public.memories(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete cascade not null,
  content        text not null,
  embedding      vector(1536) not null,
  embedding_model text not null default 'text-embedding-3-small',
  updated_at     timestamptz default now() not null
);

alter table public.memory_embeddings enable row level security;

drop policy if exists "Users can view own memory embeddings" on public.memory_embeddings;
create policy "Users can view own memory embeddings"
  on public.memory_embeddings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can upsert own memory embeddings" on public.memory_embeddings;
create policy "Users can upsert own memory embeddings"
  on public.memory_embeddings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own memory embeddings" on public.memory_embeddings;
create policy "Users can update own memory embeddings"
  on public.memory_embeddings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own memory embeddings" on public.memory_embeddings;
create policy "Users can delete own memory embeddings"
  on public.memory_embeddings for delete
  using (auth.uid() = user_id);

create index if not exists memory_embeddings_user_idx on public.memory_embeddings(user_id);
create index if not exists memory_embeddings_vector_idx
  on public.memory_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create index if not exists memories_search_title_trgm on public.memories using gin (title gin_trgm_ops);
create index if not exists memories_search_body_trgm on public.memories using gin (body gin_trgm_ops);

create or replace function public.match_memories_hybrid(
  query_embedding vector(1536),
  query_text text,
  match_count int default 20
)
returns table (
  memory_id uuid,
  vector_score double precision,
  keyword_score double precision,
  hybrid_score double precision
)
language sql
stable
security invoker
as $$
  with vector_hits as (
    select
      me.memory_id,
      1 - (me.embedding <=> query_embedding) as vector_score
    from public.memory_embeddings me
    where me.user_id = auth.uid()
    order by me.embedding <=> query_embedding
    limit greatest(match_count * 2, 40)
  ),
  keyword_hits as (
    select
      m.id as memory_id,
      greatest(
        similarity(coalesce(m.title, ''), query_text),
        similarity(coalesce(m.body, ''), query_text),
        similarity(array_to_string(coalesce(m.tags, '{}'::text[]), ' '), query_text),
        similarity(array_to_string(coalesce(m.people, '{}'::text[]), ' '), query_text),
        similarity(coalesce(m.place, ''), query_text)
      ) as keyword_score
    from public.memories m
    where m.user_id = auth.uid()
      and (
        coalesce(m.title, '') % query_text
        or coalesce(m.body, '') % query_text
        or array_to_string(coalesce(m.tags, '{}'::text[]), ' ') % query_text
        or array_to_string(coalesce(m.people, '{}'::text[]), ' ') % query_text
        or coalesce(m.place, '') % query_text
      )
    order by keyword_score desc
    limit greatest(match_count * 2, 40)
  ),
  combined as (
    select
      coalesce(v.memory_id, k.memory_id) as memory_id,
      coalesce(v.vector_score, 0) as vector_score,
      coalesce(k.keyword_score, 0) as keyword_score
    from vector_hits v
    full outer join keyword_hits k using (memory_id)
  )
  select
    c.memory_id,
    c.vector_score,
    c.keyword_score,
    (0.7 * c.vector_score) + (0.3 * c.keyword_score) as hybrid_score
  from combined c
  order by hybrid_score desc
  limit match_count;
$$;
