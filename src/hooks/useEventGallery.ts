import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EventGalleryImage } from "@/lib/events";

/** Postgres unique-violation code — thrown when the same Drive file is added twice to one event. */
const UNIQUE_VIOLATION = "23505";

export function useEventGalleryImages(eventId: string | null) {
  return useQuery({
    queryKey: ["event-gallery", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("event_gallery_images")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as EventGalleryImage[];
    },
  });
}

export function useEventGalleryMutations(eventId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["event-gallery", eventId] });

  const add = useMutation({
    mutationFn: async (input: { drive_url: string; drive_file_id: string; sort_order: number }) => {
      const { data, error } = await (supabase as any)
        .from("event_gallery_images")
        .insert({ event_id: eventId, ...input })
        .select()
        .single();
      if (error) {
        if (error.code === UNIQUE_VIOLATION) {
          throw new Error("This photo has already been added to this event.");
        }
        throw error;
      }
      return data as EventGalleryImage;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("event_gallery_images").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: invalidate,
  });

  /** Swaps sort_order between two adjacent rows — backs the Up/Down reorder buttons. */
  const swapOrder = useMutation({
    mutationFn: async ({ a, b }: { a: EventGalleryImage; b: EventGalleryImage }) => {
      const { error: e1 } = await (supabase as any)
        .from("event_gallery_images")
        .update({ sort_order: b.sort_order })
        .eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await (supabase as any)
        .from("event_gallery_images")
        .update({ sort_order: a.sort_order })
        .eq("id", b.id);
      if (e2) throw e2;
    },
    onSuccess: invalidate,
  });

  return { add, remove, swapOrder };
}
