import { useState } from "react";
import { Link } from "wouter";
import { Plus, Image, Video, Mic, BookOpen, Clock, ArrowRight, AlertTriangle, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMemories } from "@/hooks/useMemories";
import MemoryCard from "@/components/memories/MemoryCard";

const SETUP_SQL = `-- Run this in Supabase Dashboard → SQL Editor → New Query

create extension if not exists "uuid-ossp";

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

alter table public.memories enable row level security;
alter table public.memory_media enable row level security;

create policy "Users can view own memories" on public.memories
  for select using (auth.uid() = user_id);
create policy "Users can insert own memories" on public.memories
  for insert with check (auth.uid() = user_id);
create policy "Users can update own memories" on public.memories
  for update using (auth.uid() = user_id);
create policy "Users can delete own memories" on public.memories
  for delete using (auth.uid() = user_id);

create policy "Users can view own media" on public.memory_media
  for select using (auth.uid() = user_id);
create policy "Users can insert own media" on public.memory_media
  for insert with check (auth.uid() = user_id);
create policy "Users can update own media" on public.memory_media
  for update using (auth.uid() = user_id);
create policy "Users can delete own media" on public.memory_media
  for delete using (auth.uid() = user_id);

create index if not exists memories_user_id_idx on public.memories(user_id);
create index if not exists memories_memory_date_idx on public.memories(memory_date desc);
create index if not exists memory_media_memory_id_idx on public.memory_media(memory_id);`;

function DatabaseSetupBanner({ error }: { error: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isDbMissing =
    error.includes("does not exist") ||
    error.includes("relation") ||
    error.includes("Database tables are not set up");

  if (!isDbMissing) {
    return (
      <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <span>{error}</span>
      </div>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Database tables need to be created</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Run the SQL script below in your Supabase dashboard to set up the memories and media tables.
          </p>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline mt-1 inline-block"
          >
            Open Supabase Dashboard →
          </a>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-amber-500/20">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
            <span className="text-xs text-muted-foreground font-mono">SQL Editor → New Query → Paste & Run</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy SQL</>}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-muted-foreground overflow-x-auto max-h-48 whitespace-pre-wrap break-all bg-muted/30">
            {SETUP_SQL}
          </pre>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xl font-semibold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function MemorySkeleton() {
  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { memories, loading, error } = useMemories();

  const totalPhotos = memories.reduce((a, m) => a + (m.memory_media?.filter(x => x.type === "photo").length ?? 0), 0);
  const totalVideos = memories.reduce((a, m) => a + (m.memory_media?.filter(x => x.type === "video").length ?? 0), 0);
  const totalVoice  = memories.reduce((a, m) => a + (m.memory_media?.filter(x => x.type === "voice").length ?? 0), 0);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ?? "there";

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {!error && memories.length === 0
              ? "Start capturing your memories"
              : !error
              ? `${memories.length} ${memories.length === 1 ? "memory" : "memories"} preserved`
              : ""}
          </p>
        </div>
        <Link
          href="/memories/new"
          data-testid="button-new-memory-hero"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={16} />
          New
        </Link>
      </div>

      {/* DB setup / error banner */}
      {error && <DatabaseSetupBanner error={error} />}

      {/* Stats */}
      {!error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={BookOpen} label="Memories" value={memories.length} color="bg-amber-500" />
          <StatCard icon={Image}    label="Photos"   value={totalPhotos}    color="bg-sky-500" />
          <StatCard icon={Video}    label="Videos"   value={totalVideos}    color="bg-violet-500" />
          <StatCard icon={Mic}      label="Voice"    value={totalVoice}     color="bg-emerald-500" />
        </div>
      )}

      {/* Recent Memories */}
      {!error && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">Recent memories</h2>
            {memories.length > 0 && (
              <Link
                href="/timeline"
                data-testid="link-view-all-memories"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View all <ArrowRight size={12} />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <MemorySkeleton key={i} />)}
            </div>
          ) : memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="text-primary" size={28} />
              </div>
              <div>
                <p className="font-serif text-lg font-semibold text-foreground">No memories yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Every great story starts with a first entry
                </p>
              </div>
              <Link
                href="/memories/new"
                data-testid="button-create-first-memory"
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus size={16} />
                Capture your first memory
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {memories.slice(0, 6).map((m) => (
                <MemoryCard key={m.id} memory={m} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick link to timeline */}
      {!error && memories.length > 6 && (
        <Link
          href="/timeline"
          data-testid="link-see-full-timeline"
          className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-4 py-3 rounded-xl text-sm font-medium transition-colors border border-border"
        >
          <Clock size={16} />
          See full timeline
        </Link>
      )}
    </div>
  );
}
