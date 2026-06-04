import { useState } from "react";
import { Megaphone } from "lucide-react";
import { useActiveNotices, NOTICE_CATEGORY_EMOJI, type Notice } from "@/hooks/useNoticeBoard";
import NoticeDetailDialog from "./NoticeDetailDialog";

/**
 * Continuous scrolling ticker showing active notices.
 * High priority notices always appear (and are duplicated first).
 * Pauses on hover. Click an item to view detail.
 */
export default function NoticeTicker() {
  const { data: notices = [] } = useActiveNotices();
  const [selected, setSelected] = useState<Notice | null>(null);

  if (!notices.length) return null;

  // Duplicate the list for seamless marquee
  const items = [...notices, ...notices];

  return (
    <>
      <div className="relative w-full bg-gradient-to-r from-secondary via-secondary/95 to-secondary text-card border-y border-primary/30 overflow-hidden">
        <div className="flex items-center">
          <div className="flex shrink-0 items-center gap-2 bg-primary text-primary-foreground px-3 sm:px-4 py-2 font-semibold text-xs sm:text-sm uppercase tracking-wider z-10 shadow-[4px_0_12px_-4px_hsl(var(--secondary)/0.6)]">
            <Megaphone className="h-4 w-4" />
            <span className="hidden xs:inline">RBN Notices</span>
            <span className="xs:hidden">Notices</span>
          </div>
          <div className="group flex-1 overflow-hidden py-2">
            <div
              className="flex gap-10 whitespace-nowrap animate-[ticker_45s_linear_infinite] group-hover:[animation-play-state:paused]"
              style={{ willChange: "transform" }}
            >
              {items.map((n, idx) => (
                <button
                  key={`${n.id}-${idx}`}
                  type="button"
                  onClick={() => setSelected(n)}
                  className={`inline-flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors ${
                    n.priority === "high" ? "text-primary" : "text-card/90"
                  }`}
                >
                  <span aria-hidden>{NOTICE_CATEGORY_EMOJI[n.category]}</span>
                  <span>{n.title}</span>
                  {n.priority === "high" && (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-primary text-primary-foreground">
                      Priority
                    </span>
                  )}
                  <span className="text-card/30 select-none">•</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <NoticeDetailDialog notice={selected} onClose={() => setSelected(null)} />
    </>
  );
}