import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useValuableMembers } from "@/hooks/useValuableMembers";
import MemberQrCodeCard from "@/components/shared/MemberQrCodeCard";

export default function ValuableMemberQrCode() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { data: members = [], isLoading } = useValuableMembers();
  const member = members.find((m) => m.member_id === memberId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate("/admin/valuable-members")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Valuable Members
      </Button>

      {member ? (
        <MemberQrCodeCard memberId={member.member_id} memberName={member.full_name} />
      ) : (
        <Card className="p-10 text-center text-muted-foreground">Valuable Member not found.</Card>
      )}
    </div>
  );
}
