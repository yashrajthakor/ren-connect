import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarCheck2, Rss, Send, Inbox, IndianRupee, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useValuableMembers } from "@/hooks/useValuableMembers";

/**
 * Layout-only for Phase 1 — cards render with placeholder values until the
 * attendance/meetings/leads backends are wired into this module.
 */
const SUMMARY_CARDS = [
  { key: "attendance", icon: CalendarCheck2, label: "Attendance" },
  { key: "meetings", icon: Rss, label: "1:1 Meetings" },
  { key: "given", icon: Send, label: "Referrals Shared" },
  { key: "received", icon: Inbox, label: "Referrals Received" },
  { key: "business", icon: IndianRupee, label: "Business Generated" },
] as const;

export default function ValuableMemberActivity() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { data: members = [], isLoading } = useValuableMembers();
  const member = members.find((m) => m.member_id === memberId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate("/admin/valuable-members")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Valuable Members
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Activity</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </span>
          ) : (
            member?.full_name || "Member"
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {SUMMARY_CARDS.map((c) => (
          <Card key={c.key} className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <c.icon className="h-4 w-4" />
              <span className="truncate">{c.label}</span>
            </div>
            <p className="text-xl font-display font-bold text-foreground">—</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 text-center text-sm text-muted-foreground">
        Activity tracking will be available once the Attendance, 1:1 Feed and Leads integrations are connected
        for this module.
      </Card>
    </div>
  );
}
