import { Link } from "wouter";
import { MapPin, Image, Video, Mic, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { MemoryWithMedia } from "@/lib/database.types";

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
  const photos = memory.memory_media?.filter((m) => m.type === "photo") ?? [];
  const videos = memory.memory_media?.filter((m) => m.type === "video") ?? [];
  const voices = memory.memory_media?.filter((m) => m.type === "voice") ?? [];
  const coverPhoto = photos[0];

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
          {memory.location && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {memory.location}
            </span>
          )}
        </div>
        {memory.tags && memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {memory.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
            {memory.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{memory.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
