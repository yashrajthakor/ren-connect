import { Link } from "react-router-dom";
import { Lock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMemberStatus } from "@/hooks/useMemberStatus";

interface Props {
  children: React.ReactNode;
  featureName?: string;
}

export default function PendingApprovalGate({ children, featureName = "this feature" }: Props) {
  const { isPending, loading } = useMemberStatus();

  if (loading) return null;
  if (!isPending) return <>{children}</>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-8 sm:p-10 text-center border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          Profile Under Review
        </h2>
        <p className="text-muted-foreground mb-1">
          Your profile is currently under review by an admin.
        </p>
        <p className="text-muted-foreground mb-6">
          Access to {featureName} will be enabled once your profile is approved.
        </p>
        <div className="inline-flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-6">
          <Clock className="h-4 w-4 animate-pulse" />
          <span>Awaiting approval</span>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="default">
            <Link to="/dashboard/profile">View My Profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/directory">Browse Directory</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}