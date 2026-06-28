import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin, Sparkles } from "lucide-react";
import { format } from "date-fns";
import {
  useActiveNotices,
  NOTICE_CATEGORY_EMOJI,
  NOTICE_CATEGORY_LABEL,
  type Notice,
} from "@/hooks/useNoticeBoard";
import NoticeDetailDialog from "./NoticeDetailDialog";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  subtitle?: string;
  limit?: number;
  className?: string;
}

export default function NoticeBoardSection({
  title = "Notice Board",
  subtitle = "Important updates from the RBN community",
  limit = 6,
  className,
}: Props) {
  const { data: notices = [], isLoading } = useActiveNotices();
  const [selected, setSelected] = useState<Notice | null>(null);

  if (isLoading || notices.length === 0) return null;

  const visible = notices.slice(0, limit);

  return (
    <section className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", className)}>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary font-semibold mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            Latest
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((n) => {
          const isHigh = n.priority === "high";
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setSelected(n)}
              className={cn(
                "text-left group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5",
                isHigh
                  ? "border-primary/40 bg-gradient-to-br from-primary/[0.06] to-card shadow-[0_4px_16px_-8px_hsl(var(--primary)/0.35)]"
                  : "border-border"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <Badge variant="secondary" className="capitalize">
                  <span className="mr-1">{NOTICE_CATEGORY_EMOJI[n.category]}</span>
                  {NOTICE_CATEGORY_LABEL[n.category]}
                </Badge>
                <div className="flex items-center gap-1.5">
                  {n.is_pinned && (
                    <Pin className="h-3.5 w-3.5 text-primary" aria-label="Pinned" />
                  )}
                  {isHigh && (
                    <Badge className="uppercase text-[10px] tracking-wider">High</Badge>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {n.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3">{n.description}</p>
              <p className="text-xs text-muted-foreground/80 mt-3">
                {format(new Date(n.publish_date), "PPP")}
              </p>
            </button>
          );
        })}
      </div>

      <NoticeDetailDialog notice={selected} onClose={() => setSelected(null)} />
    </section>
  );
}