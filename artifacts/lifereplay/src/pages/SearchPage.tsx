import { useState } from "react";
import { Search, Calendar, Sparkles, SlidersHorizontal, Tag } from "lucide-react";
import { useMemories, useAvailableYears } from "@/hooks/useMemories";
import MemoryCard from "@/components/memories/MemoryCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MEMORY_TYPE_LABELS } from "@/lib/database.types";
import { AI_GROUNDING_POLICY, featureFlags } from "@/lib/featureFlags";

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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<string>("");
  const years = useAvailableYears();

  const { memories, loading } = useMemories({
    query:      query || undefined,
    year:       selectedYear,
    memoryType: selectedType || undefined,
  });

  const hasFilters = query || selectedYear || selectedType;

  const clearFilters = () => {
    setQuery("");
    setSelectedYear(undefined);
    setSelectedType("");
  };

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="pt-2">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Search</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Find memories by title, type, and year</p>
      </div>

      {/* Metadata Search */}
      <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</span>
        </div>

        {/* Keyword */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="input-search-query"
            type="search"
            placeholder="Search by title or story…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-background border-border"
          />
        </div>

        {/* Memory Type */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Tag size={12} /> Filter by type
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              data-testid="button-search-type-all"
              onClick={() => setSelectedType("")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                !selectedType
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              All
            </button>
            {Object.entries(MEMORY_TYPE_LABELS).map(([value, label]) => (
              <button
                key={value}
                data-testid={`button-search-type-${value}`}
                onClick={() => setSelectedType(selectedType === value ? "" : value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedType === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Year */}
        {years.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Calendar size={12} /> Filter by year
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                data-testid="button-search-year-all"
                onClick={() => setSelectedYear(undefined)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedYear === undefined
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                All
              </button>
              {years.map((y) => (
                <button
                  key={y}
                  data-testid={`button-search-year-${y}`}
                  onClick={() => setSelectedYear(selectedYear === y ? undefined : y)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedYear === y
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Search */}
      <div className="bg-card border border-card-border rounded-2xl p-4 relative overflow-hidden">
        {!featureFlags.aiSemanticSearch && (
          <div className="absolute inset-0 bg-card/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-2xl">
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-3 py-1">
                Coming Soon
              </Badge>
              <p className="text-sm font-semibold text-foreground">AI-powered memory search</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Search your memories using natural language. "Show me summer trips" or "Find photos from my birthday."
              </p>
            </div>
          </div>
        )}
        <div className={`${!featureFlags.aiSemanticSearch ? "opacity-30 pointer-events-none select-none" : ""}`}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI search</span>
          </div>
          <textarea
            disabled
            placeholder="Ask anything about your memories…"
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm resize-none h-20"
          />
          <button disabled className="mt-2 w-full bg-primary/30 text-primary-foreground/50 py-2 rounded-xl text-sm font-medium">
            Search with AI
          </button>
          <p className="text-[11px] text-muted-foreground mt-2">{AI_GROUNDING_POLICY}</p>
        </div>
      </div>

      {/* Results */}
      {hasFilters && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              {loading ? "Searching…" : `${memories.length} ${memories.length === 1 ? "result" : "results"}`}
            </h2>
            <button
              data-testid="button-clear-filters"
              onClick={clearFilters}
              className="text-xs text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <MemorySkeleton key={i} />)}
            </div>
          ) : memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Search size={36} className="text-muted-foreground/30" />
              <p className="font-serif text-lg font-semibold text-foreground">No memories found</p>
              <p className="text-sm text-muted-foreground">Try different keywords or remove some filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {memories.map((m) => <MemoryCard key={m.id} memory={m} />)}
            </div>
          )}
        </div>
      )}

      {!hasFilters && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Search size={36} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Use the filters above to find your memories</p>
        </div>
      )}
    </div>
  );
}
