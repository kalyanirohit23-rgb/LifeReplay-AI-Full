import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Image, Video, Mic, Square, X, Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createMemory, type CreateMemoryInput } from "@/hooks/useMemories";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { getErrorMessage } from "@/lib/errors";
import { MEMORY_TYPE_LABELS, type MemoryType } from "@/lib/database.types";
import { memoryDraftSchema } from "@/lib/validation";

const MEMORY_TYPES = Object.entries(MEMORY_TYPE_LABELS) as [MemoryType, string][];

const schema = memoryDraftSchema.pick({
  title: true,
  body: true,
  memory_date: true,
  memory_type: true,
});
type FormValues = z.infer<typeof schema>;

interface FilePreview {
  file: File;
  url: string;
}

export default function CreateMemoryPage() {
  const [, navigate] = useLocation();
  const [photos, setPhotos] = useState<FilePreview[]>([]);
  const [videos, setVideos] = useState<FilePreview[]>([]);
  const [voices, setVoices] = useState<FilePreview[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { uploadMultiple } = useMediaUpload();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:       "",
      body:        "",
      memory_date: format(new Date(), "yyyy-MM-dd"),
      memory_type: "",
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotos(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f) }))]);
    e.target.value = "";
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setVideos(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f) }))]);
    e.target.value = "";
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setVoices(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f) }))]);
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
    setSaveError(null);

    const insertInput: CreateMemoryInput = {
      title:       values.title,
      body:        values.body || null,
      memory_date: values.memory_date,
      memory_type: values.memory_type || null,
    };

    try {
      // ── Step 1: Save the memory record ──────────────────────────────
      const memory = await createMemory(insertInput);

      // ── Step 2: Upload media — failure is non-fatal ──────────────────
      // The memory is already saved. If the storage bucket isn't set up yet,
      // we still navigate to the dashboard and warn the user.
      const hasMedia = photos.length > 0 || videos.length > 0 || voices.length > 0;
      if (hasMedia) {
        try {
          const allUploads: Promise<unknown>[] = [];
          if (photos.length > 0) allUploads.push(uploadMultiple(photos.map(p => p.file), memory.id, "photo"));
          if (videos.length > 0) allUploads.push(uploadMultiple(videos.map(v => v.file), memory.id, "video"));
          if (voices.length > 0) allUploads.push(uploadMultiple(voices.map(v => v.file), memory.id, "voice"));
          await Promise.all(allUploads);
          toast.success("Memory saved!");
        } catch (uploadErr: unknown) {
          const uploadMsg = getErrorMessage(uploadErr);
          console.error("[CreateMemoryPage] ⚠️ media upload failed (memory still saved):", uploadErr);
          toast.success("Memory saved!");
          toast.error(`Media upload failed: ${uploadMsg}`, { duration: 8000 });
        }
      } else {
        toast.success("Memory saved!");
      }

      // ── Step 3: Go to dashboard (triggers refetch) ───────────────────
      navigate("/");
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      console.error("[CreateMemoryPage] ❌ save failed:", err);
      setSaveError(msg);
      toast.error(msg);
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

      {/* Inline error banner — shows exact Supabase error */}
      {saveError && (
        <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm mb-5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold">Failed to save memory</p>
            <p className="mt-0.5 break-words whitespace-pre-wrap font-mono text-xs">{saveError}</p>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input
                  data-testid="input-title"
                  placeholder="A title for this memory…"
                  className="bg-card border-card-border text-base font-serif"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Date & Memory Type */}
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="memory_date" render={({ field }) => (
              <FormItem>
                <FormLabel>Date <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input
                    data-testid="input-date"
                    type="date"
                    className="bg-card border-card-border"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="memory_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <select
                    data-testid="input-memory-type"
                    className="w-full h-10 rounded-lg border border-card-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    {...field}
                  >
                    <option value="">— Select type —</option>
                    {MEMORY_TYPES.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Body (was "description") */}
          <FormField control={form.control} name="body" render={({ field }) => (
            <FormItem>
              <FormLabel>Story</FormLabel>
              <FormControl>
                <Textarea
                  data-testid="input-body"
                  placeholder="Tell the story of this memory…"
                  rows={5}
                  className="bg-card border-card-border resize-none"
                  {...field}
                />
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
              {saving ? "Saving…" : "Save memory"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
