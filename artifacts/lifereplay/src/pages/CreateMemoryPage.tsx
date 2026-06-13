import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Image, Video, Mic, Square, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createMemory } from "@/hooks/useMemories";
import { useMediaUpload, getMediaType } from "@/hooks/useMediaUpload";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  memory_date: z.string().min(1, "Date is required"),
  location: z.string().optional(),
  tags: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface FilePreview {
  file: File;
  url: string;
}

export default function CreateMemoryPage() {
  const [, setLocation] = useLocation();
  const [photos, setPhotos] = useState<FilePreview[]>([]);
  const [videos, setVideos] = useState<FilePreview[]>([]);
  const [voices, setVoices] = useState<FilePreview[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { uploadMultiple } = useMediaUpload();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      memory_date: format(new Date(), "yyyy-MM-dd"),
      location: "",
      tags: "",
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const previews = files.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setPhotos(prev => [...prev, ...previews]);
    e.target.value = "";
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const previews = files.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setVideos(prev => [...prev, ...previews]);
    e.target.value = "";
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const previews = files.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setVoices(prev => [...prev, ...previews]);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        setVoices(prev => [...prev, { file, url: URL.createObjectURL(blob) }]);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const tags = values.tags
        ? values.tags.split(",").map(t => t.trim()).filter(Boolean)
        : undefined;

      const memory = await createMemory({
        title: values.title,
        description: values.description || null,
        memory_date: values.memory_date,
        location: values.location || null,
        tags: tags && tags.length > 0 ? tags : null,
      });

      const allUploads: Promise<unknown>[] = [];
      if (photos.length > 0) allUploads.push(uploadMultiple(photos.map(p => p.file), memory.id, "photo"));
      if (videos.length > 0) allUploads.push(uploadMultiple(videos.map(v => v.file), memory.id, "video"));
      if (voices.length > 0) allUploads.push(uploadMultiple(voices.map(v => v.file), memory.id, "voice"));
      await Promise.all(allUploads);

      toast.success("Memory saved!");
      setLocation(`/memories/${memory.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save memory");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full p-4 md:p-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2 mb-6">
        <button
          data-testid="button-back"
          onClick={() => history.back()}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-serif text-xl font-semibold text-foreground">New memory</h1>
          <p className="text-xs text-muted-foreground">Capture a moment from your life</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input data-testid="input-title" placeholder="A title for this memory…" className="bg-card border-card-border text-base font-serif" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Date & Location */}
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="memory_date" render={({ field }) => (
              <FormItem>
                <FormLabel>Date <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input data-testid="input-date" type="date" className="bg-card border-card-border" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input data-testid="input-location" placeholder="Where were you?" className="bg-card border-card-border" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Description */}
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  data-testid="input-description"
                  placeholder="Tell the story of this memory…"
                  rows={4}
                  className="bg-card border-card-border resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Tags */}
          <FormField control={form.control} name="tags" render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input data-testid="input-tags" placeholder="family, travel, birthday (comma separated)" className="bg-card border-card-border" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Photos */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Image size={15} className="text-sky-500" /> Photos
            </label>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label
              data-testid="button-add-photos"
              className="flex items-center gap-2 bg-muted hover:bg-muted/80 border border-dashed border-border rounded-xl px-4 py-3 text-sm text-muted-foreground cursor-pointer transition-colors"
            >
              <Plus size={15} /> Add photos
              <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>

          {/* Videos */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Video size={15} className="text-violet-500" /> Videos
            </label>
            {videos.length > 0 && (
              <ul className="space-y-1">
                {videos.map((v, i) => (
                  <li key={i} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    <Video size={13} className="text-violet-500 shrink-0" />
                    <span className="text-xs text-foreground truncate flex-1">{v.file.name}</span>
                    <button type="button" onClick={() => setVideos(prev => prev.filter((_, j) => j !== i))}>
                      <X size={13} className="text-muted-foreground hover:text-destructive" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label
              data-testid="button-add-videos"
              className="flex items-center gap-2 bg-muted hover:bg-muted/80 border border-dashed border-border rounded-xl px-4 py-3 text-sm text-muted-foreground cursor-pointer transition-colors"
            >
              <Plus size={15} /> Add videos
              <input type="file" accept="video/*" multiple onChange={handleVideoChange} className="hidden" />
            </label>
          </div>

          {/* Voice Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mic size={15} className="text-emerald-500" /> Voice notes
            </label>
            {voices.length > 0 && (
              <ul className="space-y-1">
                {voices.map((v, i) => (
                  <li key={i} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    <Mic size={13} className="text-emerald-500 shrink-0" />
                    <span className="text-xs text-foreground truncate flex-1">{v.file.name}</span>
                    <audio src={v.url} controls className="h-6 w-28" />
                    <button type="button" onClick={() => setVoices(prev => prev.filter((_, j) => j !== i))}>
                      <X size={13} className="text-muted-foreground hover:text-destructive" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <label
                data-testid="button-upload-voice"
                className="flex-1 flex items-center gap-2 bg-muted hover:bg-muted/80 border border-dashed border-border rounded-xl px-4 py-3 text-sm text-muted-foreground cursor-pointer transition-colors"
              >
                <Plus size={15} /> Upload audio
                <input type="file" accept="audio/*" multiple onChange={handleVoiceChange} className="hidden" />
              </label>
              <button
                type="button"
                data-testid="button-record-voice"
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isRecording
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground border border-dashed border-border"
                }`}
              >
                {isRecording ? <><Square size={14} /> Stop</> : <><Mic size={14} /> Record</>}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              data-testid="button-save-memory"
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 text-base rounded-xl"
            >
              {saving ? "Saving memory…" : "Save memory"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
