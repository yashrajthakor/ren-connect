import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  NOTICE_CATEGORY_EMOJI,
  NOTICE_CATEGORY_LABEL,
  NOTICE_PRIORITY_LABEL,
  type Notice,
} from "@/hooks/useNoticeBoard";

interface Props {
  notice: Notice | null;
  onClose: () => void;
}

export default function NoticeDetailDialog({ notice, onClose }: Props) {
  const open = !!notice;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {notice && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="capitalize">
                  <span className="mr-1">{NOTICE_CATEGORY_EMOJI[notice.category]}</span>
                  {NOTICE_CATEGORY_LABEL[notice.category]}
                </Badge>
                <Badge
                  variant={notice.priority === "high" ? "default" : "outline"}
                  className="uppercase text-[10px] tracking-wider"
                >
                  {NOTICE_PRIORITY_LABEL[notice.priority]} priority
                </Badge>
                {notice.is_pinned && (
                  <Badge variant="outline" className="text-[10px] uppercase">Pinned</Badge>
                )}
              </div>
              <DialogTitle className="text-xl font-display">{notice.title}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Published {format(new Date(notice.publish_date), "PPP")}
                {notice.expiry_date && ` · Expires ${format(new Date(notice.expiry_date), "PPP")}`}
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {notice.description}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}