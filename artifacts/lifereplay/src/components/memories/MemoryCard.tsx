import { Link } from "wouter";
import { Image, Video, Mic, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import type { MemoryWithMedia } from "@/lib/database.types";
import { MEMORY_TYPE_LABELS } from "@/lib/database.types";

interface MemoryCardProps {
  memory: MemoryWithMedia;
  className?: string;
}

const gradients = [
  "from-amber-900 to-amber-700",
  "from-stone-800 to-stone-600",
  "from-zinc-800 to-zinc-600",
  "from-neutral-800 to-amber-900",
  "from-yellow-900 to-amber-800",
];

function getGradient(id: string) {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return gradients[sum % gradients.length];
}

export default function MemoryCard({ memory, className = "" }: MemoryCardProps) {
  const photos  = memory.memory_media?.filter((m) => m.type === "photo") ?? [];
  const videos  = memory.memory_media?.filter((m) => m.type === "video") ?? [];
  const voices  = memory.memory_media?.filter((m) => m.type === "voice") ?? [];
  const coverPhoto = photos[0];

  const typeLabel = memory.memory_type
    ? (MEMORY_TYPE_LABELS[memory.memory_type as keyof typeof MEMORY_TYPE_LABELS] ?? memory.memory_type)
    : null;

  return (
    <Link
      href={`/memories/${memory.id}`}
      data-testid={`card-memory-${memory.id}`}
      className={`group block bg-card border border-card-border rounded-xl overflow-hidden memory-card-hover cursor-pointer ${className}`}
    >
      {/* Cover */}
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        {coverPhoto ? (
          <img
            src={coverPhoto.file_url}
            alt={memory.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getGradient(memory.id)} flex items-center justify-center`}>
            <Image size={32} className="text-white/30" />
          </div>
        )}
        {/* Media counts overlay */}
        {(photos.length > 0 || videos.length > 0 || voices.length > 0) && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {photos.length > 0 && (
              <span className="flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                <Image size={10} />{photos.length}
              </span>
            )}
            {videos.length > 0 && (
              <span className="flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                <Video size={10} />{videos.length}
              </span>
            )}
            {voices.length > 0 && (
              <span className="flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                <Mic size={10} />{voices.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-serif font-semibold text-sm text-card-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {memory.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {format(new Date(memory.memory_date), "MMM d, yyyy")}
          </span>
          {typeLabel && (
            <span className="flex items-center gap-1">
              <Tag size={11} />
              {typeLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
