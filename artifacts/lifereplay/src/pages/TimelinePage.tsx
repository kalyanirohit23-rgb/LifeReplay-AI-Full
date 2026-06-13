import { useState } from "react";
import { Search, Calendar, MapPin, Image, Video, Mic } from "lucide-react";
import { format } from "date-fns";
import { useMemories, useAvailableYears } from "@/hooks/useMemories";
import type { MemoryWithMedia } from "@/lib/database.types";
import MemoryCard from "@/components/memories/MemoryCard";
import { Input } from "@/components/ui/input";

function groupByYearMonth(memories: MemoryWithMedia[]) {
  const map = new Map<number, Map<string, MemoryWithMedia[]>>();
  for (const m of memories) {
    const d = new Date(m.memory_date);
    const year = d.getFullYear();
    const month = format(d, "MMMM");
    if (!map.has(year)) map.set(year, new Map());
    const yMap = map.get(year)!;
    if (!yMap.has(month)) yMap.set(month, []);
    yMap.get(month)!.push(m);
  }
  return map;
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

export default function TimelinePage() {
  const [query, setQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const years = useAvailableYears();

  const { memories, loading } = useMemories({
    query: query || undefined,
    year: selectedYear,
  });

  const grouped = groupByYearMonth(memories);
  const sortedYears = [...grouped.keys()].sort((a, b) => b - a);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="pt-2">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Timeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your memories in chronological order</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-testid="input-timeline-search"
          type="search"
          placeholder="Search by title, description, location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-card border-card-border"
        />
      </div>

      {/* Year filter */}
      {years.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            data-testid="button-year-all"
            onClick={() => setSelectedYear(undefined)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectedYear === undefined
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            All years
          </button>
          {years.map((y) => (
            <button
              key={y}
              data-testid={`button-year-${y}`}
              onClick={() => setSelectedYear(selectedYear === y ? undefined : y)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedYear === y
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && (query || selectedYear) && (
        <p className="text-xs text-muted-foreground">
          {memories.length} {memories.length === 1 ? "memory" : "memories"} found
        </p>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => <MemorySkeleton key={i} />)}
        </div>
      ) : memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Calendar size={40} className="text-muted-foreground/40" />
          <p className="font-serif text-lg font-semibold text-foreground">No memories found</p>
          <p className="text-sm text-muted-foreground">
            {query || selectedYear ? "Try a different search" : "Start adding memories to see them here"}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedYears.map((year) => {
            const monthMap = grouped.get(year)!;
            const sortedMonths = [...monthMap.keys()];
            return (
              <div key={year}>
                {/* Year header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                    <span className="text-primary font-serif font-bold text-sm">{year}</span>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {[...monthMap.values()].reduce((a, b) => a + b.length, 0)} memories
                  </span>
                </div>

                {sortedMonths.map((month) => {
                  const monthMemories = monthMap.get(month)!;
                  return (
                    <div key={month} className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {month}
                        </span>
                        <div className="flex-1 h-px bg-border/50" />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {monthMemories.map((m) => (
                          <MemoryCard key={m.id} memory={m} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
