import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageProvider";

const COLLAPSED_MAX_PX = 84;

interface CategoryFilterBarProps {
  categories: string[];
  activeCats: string[];
  onToggleCat: (cat: string) => void;
  onClearAll: () => void;
}

export function CategoryFilterBar({
  categories,
  activeCats,
  onToggleCat,
  onClearAll,
}: CategoryFilterBarProps) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el || categories.length === 0) {
      setCanExpand(false);
      return;
    }
    const check = () => setCanExpand(el.scrollHeight > COLLAPSED_MAX_PX + 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [categories]);

  const pillClass = (on: boolean) =>
    cn(
      "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all",
      on
        ? "bg-primary text-primary-foreground border-primary shadow-sm"
        : "bg-card text-secondary border-border hover:border-primary/50 hover:bg-muted/40",
    );

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5 space-y-3">
      <div className="relative">
        <div
          ref={listRef}
          className={cn(
            "flex flex-wrap gap-2 transition-[max-height] duration-300 ease-in-out",
            !expanded && canExpand && "max-h-[5.25rem] overflow-hidden",
          )}
        >
          <button
            type="button"
            onClick={onClearAll}
            className={pillClass(activeCats.length === 0)}
          >
            {t("dir.cat.All")}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onToggleCat(c)}
              className={pillClass(activeCats.includes(c))}
            >
              {c}
            </button>
          ))}
        </div>
        {!expanded && canExpand && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-muted/20 via-background/90 to-transparent"
            aria-hidden
          />
        )}
      </div>

      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {expanded ? (
            <>
              {t("dir.showLess")} <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              {t("dir.showMore")} ({categories.length}) <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}

      {activeCats.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/60">
          <span>{t("dir.filteringBy")}</span>
          {activeCats.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {c}
              <button
                type="button"
                onClick={() => onToggleCat(c)}
                aria-label={`Remove ${c}`}
                className="hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="underline hover:text-primary ml-1"
          >
            {t("dir.clearAll")}
          </button>
        </div>
      )}
    </div>
  );
}
