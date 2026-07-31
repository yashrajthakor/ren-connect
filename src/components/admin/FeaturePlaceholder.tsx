import { useNavigate } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  title: string;
  message: string;
  backTo?: string;
}

/**
 * Reusable "not built yet" screen for Valuable Members action pages whose
 * backend doesn't exist yet (Phase 1 only prepares the navigation
 * structure). Keeps the menu item live rather than hiding it.
 */
export default function FeaturePlaceholder({ title, message, backTo }: Props) {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Card className="p-8 sm:p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Construction className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {backTo && (
          <Button variant="outline" className="mt-6" onClick={() => navigate(backTo)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Valuable Members
          </Button>
        )}
      </Card>
    </div>
  );
}
