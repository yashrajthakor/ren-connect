// Send Web Push notifications to all of a user's registered devices.
// Triggered by a Postgres AFTER INSERT trigger on public.notifications.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@rajputbusinessnetwork.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const TYPE_LABELS: Record<string, string> = {
  lead_received: "📌 New Lead",
  lead_updated: "📋 Lead Updated",
  business_closed: "✅ Business Closed",
  announcement: "📢 Announcement",
  admin_update: "⚙️ Admin Update",
  new_application: "🔔 New Member Application",
  new_ask: "💬 New Ask",
  ask_updated: "✏️ Ask Updated",
  ask_resolved: "✅ Ask Resolved",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { notification_id } = await req.json();
    if (!notification_id) {
      return new Response(JSON.stringify({ error: "missing notification_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: notif, error: nerr } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notification_id)
      .single();
    if (nerr || !notif) {
      return new Response(JSON.stringify({ error: "notification not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", notif.user_id);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const title = TYPE_LABELS[notif.type] || notif.title || "🔔 RBN";
    const payload = JSON.stringify({
      id: notif.id,
      title,
      body: notif.body || notif.title || "You have a new notification",
      link: notif.link || "/dashboard/notifications",
      type: notif.type,
      requireInteraction: notif.type === "announcement" || notif.type === "new_application",
      vibrate: [200, 100, 200],
    });

    let sent = 0;
    const stale: string[] = [];

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 60 * 60 * 24 }
          );
          sent++;
        } catch (err: any) {
          const status = err?.statusCode;
          if (status === 404 || status === 410) {
            stale.push(s.endpoint);
          } else {
            console.error("push error", status, err?.body || err?.message);
          }
        }
      })
    );

    if (stale.length) {
      await supabase.from("push_subscriptions").delete().in("endpoint", stale);
    }

    return new Response(JSON.stringify({ ok: true, sent, removed: stale.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-push error", err);
    return new Response(JSON.stringify({ error: err?.message || "internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});