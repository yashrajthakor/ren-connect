import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrentUserId } from "@/hooks/useLeads";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const typeAccent: Record<string, string> = {
  lead_received: "bg-primary/10 text-primary",
  lead_updated: "bg-blue-500/10 text-blue-600",
  business_closed: "bg-emerald-500/10 text-emerald-600",
  announcement: "bg-amber-500/10 text-amber-600",
  admin_update: "bg-purple-500/10 text-purple-600",
  new_application: "bg-orange-500/10 text-orange-600",
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const { data: userId } = useCurrentUserId();
  const { list, unreadCount, markRead, markAllRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);

  const handleClick = (n: AppNotification) => {
    if (!n.read_at) markRead.mutate(n.id);
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-semibold text-sm">Notifications</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[420px]">
          {list.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">You're all caught up.</div>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors flex gap-3",
                      !n.read_at && "bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        typeAccent[n.type] || "bg-muted text-foreground"
                      )}
                    >
                      {n.type === "business_closed" ? "₹" : n.title.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                        {!n.read_at && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                      </div>
                      {n.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t border-border px-3 py-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { navigate("/dashboard/notifications"); setOpen(false); }}>
            View all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
