import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateAsk, useUpdateAsk, type Ask } from "@/hooks/useAsks";

const schema = z.object({
  title: z.string().trim().min(3, "At least 3 characters").max(120),
  description: z.string().trim().min(10, "At least 10 characters").max(1000),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high"]),
  contact_details: z
    .string()
    .trim()
    .max(80)
    .regex(/^[+\d][\d\s\-()]{6,18}$/i, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  editAsk?: Ask | null;
}

export default function CreateAskDialog({ open, onOpenChange, userId, editAsk }: Props) {
  const create = useCreateAsk();
  const update = useUpdateAsk();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium" },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: editAsk?.title ?? "",
        description: editAsk?.description ?? "",
        category: editAsk?.category ?? "",
        city: editAsk?.city ?? "",
        priority: editAsk?.priority ?? "medium",
        contact_details: editAsk?.contact_details ?? "",
      });
    }
  }, [open, editAsk, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (editAsk) {
        await update.mutateAsync({
          id: editAsk.id,
          patch: {
            title: data.title,
            description: data.description,
            category: data.category || null,
            city: data.city || null,
            priority: data.priority,
            contact_details: data.contact_details || null,
          },
        });
        toast({ title: "Ask updated" });
      } else {
        await create.mutateAsync({
          user_id: userId,
          title: data.title,
          description: data.description,
          category: data.category || null,
          city: data.city || null,
          priority: data.priority,
          contact_details: data.contact_details || null,
        });
        toast({ title: "Ask published", description: "Your community can now see it." });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Could not save ask", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editAsk ? "Edit ask" : "Post a new ask"}</DialogTitle>
          <DialogDescription>
            Share a business need or requirement with the REN community.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Looking for textile supplier in Surat" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} placeholder="Describe what you need..." {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" placeholder="e.g. Manufacturing" {...register("category")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="e.g. Mumbai" {...register("city")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={watch("priority")} onValueChange={(v) => setValue("priority", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_details">Contact (phone)</Label>
              <Input id="contact_details" placeholder="+91 98xxx xxxxx" {...register("contact_details")} />
              {errors.contact_details && <p className="text-xs text-destructive">{errors.contact_details.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {editAsk ? "Save changes" : "Publish Ask"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
