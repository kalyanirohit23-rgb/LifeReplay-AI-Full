import { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMemory, updateMemory } from "@/hooks/useMemories";
import { getErrorMessage } from "@/lib/errors";
import { MEMORY_TYPE_LABELS, type MemoryType } from "@/lib/database.types";

const MEMORY_TYPES = Object.entries(MEMORY_TYPE_LABELS) as [MemoryType, string][];

const schema = z.object({
  title:       z.string().min(1, "Title is required"),
  body:        z.string().optional(),
  memory_date: z.string().min(1, "Date is required"),
  memory_type: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function EditMemoryPage({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const { memory, loading } = useMemory(id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", body: "", memory_date: "", memory_type: "" },
  });

  useEffect(() => {
    if (!memory) return;
    form.reset({
      title:       memory.title,
      body:        memory.body ?? "",
      memory_date: memory.memory_date,
      memory_type: memory.memory_type ?? "",
    });
  }, [memory, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await updateMemory(id, {
        title:       values.title,
        body:        values.body || null,
        memory_date: values.memory_date,
        memory_type: values.memory_type || null,
      });
      toast.success("Memory updated!");
      setLocation(`/memories/${id}`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col animate-pulse max-w-2xl mx-auto w-full p-4 space-y-4">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-12 bg-muted rounded" />
        <div className="h-12 bg-muted rounded" />
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Memory not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full p-4 md:p-6 pb-10">
      <div className="flex items-center gap-3 pt-2 mb-6">
        <button
          data-testid="button-back"
          onClick={() => history.back()}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-serif text-xl font-semibold text-foreground">Edit memory</h1>
          <p className="text-xs text-muted-foreground">Update the details of this memory</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input data-testid="input-title" placeholder="Memory title…" className="bg-card border-card-border font-serif text-base" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

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

          <FormField control={form.control} name="body" render={({ field }) => (
            <FormItem>
              <FormLabel>Story</FormLabel>
              <FormControl>
                <Textarea
                  data-testid="input-body"
                  placeholder="Tell the story…"
                  rows={5}
                  className="bg-card border-card-border resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="outline"
              data-testid="button-cancel-edit"
              onClick={() => setLocation(`/memories/${id}`)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              data-testid="button-save-edit"
              type="submit"
              disabled={form.formState.isSubmitting}
              className="flex-1 bg-primary text-primary-foreground font-semibold"
            >
              {form.formState.isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
