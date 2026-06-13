import { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMemory, updateMemory } from "@/hooks/useMemories";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  memory_date: z.string().min(1, "Date is required"),
  location: z.string().optional(),
  tags: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function EditMemoryPage({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const { memory, loading } = useMemory(id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", memory_date: "", location: "", tags: "" },
  });

  useEffect(() => {
    if (!memory) return;
    form.reset({
      title: memory.title,
      description: memory.description ?? "",
      memory_date: memory.memory_date,
      location: memory.location ?? "",
      tags: memory.tags?.join(", ") ?? "",
    });
  }, [memory, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const tags = values.tags
        ? values.tags.split(",").map(t => t.trim()).filter(Boolean)
        : undefined;

      await updateMemory(id, {
        title: values.title,
        description: values.description || null,
        memory_date: values.memory_date,
        location: values.location || null,
        tags: tags && tags.length > 0 ? tags : null,
      });

      toast.success("Memory updated!");
      setLocation(`/memories/${id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update memory");
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

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  data-testid="input-description"
                  placeholder="Tell the story…"
                  rows={4}
                  className="bg-card border-card-border resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="tags" render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input data-testid="input-tags" placeholder="family, travel, birthday" className="bg-card border-card-border" {...field} />
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
