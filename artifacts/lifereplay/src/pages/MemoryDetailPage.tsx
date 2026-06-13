import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, MapPin, Calendar, Pencil, Trash2, Image, Video, Mic, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useMemory, deleteMemory } from "@/hooks/useMemories";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { MemoryMedia } from "@/lib/database.types";

function Lightbox({ photos, initialIndex, onClose }: {
  photos: MemoryMedia[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  return (
    <div
      data-testid="lightbox"
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        data-testid="button-lightbox-close"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
      >
        <X size={20} />
      </button>
      {photos.length > 1 && (
        <>
          <button
            data-testid="button-lightbox-prev"
            onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + photos.length) % photos.length); }}
            className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            data-testid="button-lightbox-next"
            onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % photos.length); }}
            className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
      <img
        src={photos[idx].file_url}
        alt={photos[idx].file_name}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MemoryDetailPage({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const { memory, loading } = useMemory(id);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const photos = memory?.memory_media?.filter(m => m.type === "photo") ?? [];
  const videos = memory?.memory_media?.filter(m => m.type === "video") ?? [];
  const voices = memory?.memory_media?.filter(m => m.type === "voice") ?? [];

  const handleDelete = async () => {
    try {
      await deleteMemory(id);
      toast.success("Memory deleted");
      setLocation("/timeline");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col animate-pulse max-w-2xl mx-auto w-full">
        <div className="aspect-[3/2] bg-muted" />
        <div className="p-4 space-y-3">
          <div className="h-7 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Memory not found</p>
        <Link href="/timeline" className="text-primary text-sm hover:underline">Back to timeline</Link>
      </div>
    );
  }

  const coverPhoto = photos[0];

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full pb-10">
      {/* Hero */}
      <div className="relative">
        {coverPhoto ? (
          <img
            src={coverPhoto.file_url}
            alt={memory.title}
            className="w-full aspect-[3/2] object-cover"
          />
        ) : (
          <div className="w-full aspect-[3/2] bg-gradient-to-br from-amber-900 to-amber-700 flex items-center justify-center">
            <Image size={48} className="text-white/20" />
          </div>
        )}
        {/* Overlay actions */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between">
          <button
            data-testid="button-back"
            onClick={() => history.back()}
            className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white glass"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-2">
            <Link
              href={`/memories/${id}/edit`}
              data-testid="button-edit-memory"
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white glass"
            >
              <Pencil size={18} />
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  data-testid="button-delete-memory"
                  className="p-2 bg-black/50 hover:bg-destructive/80 rounded-full text-white glass"
                >
                  <Trash2 size={18} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this memory?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{memory.title}" and all its media. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    data-testid="button-confirm-delete"
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete forever
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Title & meta */}
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">{memory.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar size={14} />
              {format(new Date(memory.memory_date), "MMMM d, yyyy")}
            </span>
            {memory.location && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin size={14} />
                {memory.location}
              </span>
            )}
          </div>
          {memory.tags && memory.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {memory.tags.map((tag) => (
                <span key={tag} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {memory.description && (
          <div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{memory.description}</p>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <Image size={15} className="text-sky-500" /> Photos ({photos.length})
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  data-testid={`img-photo-${photo.id}`}
                  onClick={() => setLightboxIdx(i)}
                  className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                >
                  <img src={photo.file_url} alt={photo.file_name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <Video size={15} className="text-violet-500" /> Videos ({videos.length})
            </h2>
            <div className="space-y-3">
              {videos.map((video) => (
                <div key={video.id} className="rounded-xl overflow-hidden bg-muted">
                  <video
                    data-testid={`video-${video.id}`}
                    src={video.file_url}
                    controls
                    className="w-full max-h-64"
                  />
                  <p className="px-3 py-2 text-xs text-muted-foreground">{video.file_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voice notes */}
        {voices.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <Mic size={15} className="text-emerald-500" /> Voice notes ({voices.length})
            </h2>
            <div className="space-y-2">
              {voices.map((voice) => (
                <div key={voice.id} className="flex items-center gap-3 bg-muted rounded-xl p-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Mic size={14} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{voice.file_name}</p>
                    <audio
                      data-testid={`audio-${voice.id}`}
                      src={voice.file_url}
                      controls
                      className="mt-1 w-full h-8"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox photos={photos} initialIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </div>
  );
}
