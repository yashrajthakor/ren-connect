import { X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Shown when this admin page was opened from a Statistics Overview KPI card
 * with a filter baked into the URL (?from=&to=&membership=). Lets the admin
 * see what's applied and clear it back to the page's normal unfiltered view.
 */
export default function AdminFilterBanner({ label }: { label: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => navigate(location.pathname, { replace: true })}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <X className="h-3.5 w-3.5" /> Clear filter
      </button>
    </div>
  );
}
