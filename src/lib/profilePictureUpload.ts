import { supabase } from "@/integrations/supabase/client";

/** Same collision-resistant path convention as uploadMeetingPhoto (useMeetings.ts). */
export async function uploadProfilePicture(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("profile-pictures").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("profile-pictures").getPublicUrl(path);
  return data.publicUrl;
}
