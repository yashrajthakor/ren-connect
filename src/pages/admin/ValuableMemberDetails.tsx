import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Award, Loader2, Pencil, RefreshCcw, Activity, QrCode, CalendarCheck2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useValuableMembers } from "@/hooks/useValuableMembers";
import { useMembersRoster } from "@/hooks/useMembersRoster";
import { getMembershipStatus, daysRemaining, formatDateOrNA } from "@/lib/membershipStatus";
import { MembershipStatusBadge } from "@/components/admin/MembershipStatusBadge";
import ConvertToPaidMemberDialog from "@/components/admin/ConvertToPaidMemberDialog";

function initials(name: string) {
  return (name || "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function ValuableMemberDetails() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { data: members = [], isLoading, refetch } = useValuableMembers();
  const { data: roster = [], refetch: refetchRoster } = useMembersRoster();
  const [editOpen, setEditOpen] = useState(false);
  const member = members.find((m) => m.member_id === memberId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading membership details...
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="p-10 text-center text-muted-foreground">
          <p>Valuable Member not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/valuable-members")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Valuable Members
          </Button>
        </Card>
      </div>
    );
  }

  const status = getMembershipStatus(member.paid_valid_through);
  const remaining = daysRemaining(member.paid_valid_through);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate("/admin/valuable-members")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Valuable Members
      </Button>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={member.profile_picture ?? undefined} />
          <AvatarFallback className="text-lg">{initials(member.full_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-display font-bold text-foreground truncate">{member.full_name}</h1>
          <p className="text-sm text-muted-foreground truncate">{member.business_name || "Not Available"}</p>
        </div>
        <MembershipStatusBadge status={status} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4 mr-1.5" /> Edit Membership
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/admin/valuable-members/${member.member_id}/renew`}>
            <RefreshCcw className="h-4 w-4 mr-1.5" /> Renew Membership
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/admin/valuable-members/${member.member_id}/activity`}>
            <Activity className="h-4 w-4 mr-1.5" /> Activity
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/admin/valuable-members/${member.member_id}/attendance`}>
            <CalendarCheck2 className="h-4 w-4 mr-1.5" /> Attendance
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/admin/valuable-members/${member.member_id}/qr-code`}>
            <QrCode className="h-4 w-4 mr-1.5" /> QR Code
          </Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Basic Information</h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="Name" value={member.full_name} />
            <Row label="Business" value={member.business_name} />
            <Row label="Mobile" value={member.phone} />
            <Row
              label="Category"
              value={member.categories && member.categories.length > 0 ? member.categories.join(", ") : null}
            />
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Award className="h-4 w-4 text-primary" /> Membership Information
          </h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="Membership Type" value="Valuable Member" />
            <Row label="Joining Date" value={formatDateOrNA(member.paid_joining_date)} raw />
            <Row label="Valid Through" value={formatDateOrNA(member.paid_valid_through)} raw />
            <Row
              label="Days Remaining"
              value={remaining === null ? "Not Available" : remaining < 0 ? `Expired ${Math.abs(remaining)} days ago` : `${remaining} days`}
              raw
            />
            <Row label="Invited By" value={member.invited_by_name} />
          </dl>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Renewal History</h2>
        <p className="text-sm text-muted-foreground">No renewal history available.</p>
      </Card>

      <ConvertToPaidMemberDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={member}
        roster={roster}
        onSuccess={() => {
          refetch();
          refetchRoster();
        }}
      />
    </div>
  );
}

function Row({ label, value, raw }: { label: string; value?: string | null; raw?: boolean }) {
  const display = raw ? value : value || "Not Available";
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground text-right">{display}</dd>
    </div>
  );
}
