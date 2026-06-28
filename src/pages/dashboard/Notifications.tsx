import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Inbox } from "lucide-react";
import { useCurrentUserId } from "@/hooks/useLeads";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const typeLabel: Record<string, string> = {
  lead_received: "Lead",
  lead_updated: "Lead update",
  business_closed: "Business closed",
  announcement: "Announcement",
  admin_update: "Admin",
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { data: userId } = useCurrentUserId();
  const { list, unreadCount, markRead, markAllRead, isLoading } = useNotifications(userId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "px-4 sm:px-6 py-4 flex items-start gap-3 hover:bg-muted/40 transition-colors cursor-pointer",
                  !n.read_at && "bg-primary/5"
                )}
                onClick={() => {
                  if (!n.read_at) markRead.mutate(n.id);
                  if (n.link) navigate(n.link);
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                      {typeLabel[n.type] || n.type}
                    </Badge>
                    {!n.read_at && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="font-medium text-foreground">{n.title}</p>
                  {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
