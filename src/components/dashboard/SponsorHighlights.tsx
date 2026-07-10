import { useEffect, useRef, useState } from "react";
import { Award, Building2, ChevronLeft, ChevronRight, Globe, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActiveSponsors, sponsorTypeEmoji, type Sponsor } from "@/hooks/useSponsors";

const AUTO_MS = 3500;

const hostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const SponsorHighlights = () => {
  const { data: sponsors = [] } = useActiveSponsors();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [selected, setSelected] = useState<Sponsor | null>(null);

  // Auto-scroll one card at a time; native touch scrolling handles swipes.
  useEffect(() => {
    if (sponsors.length <= 1) return;
    const id = setInterval(() => {
      const el = scrollRef.current;
      if (!el || pausedRef.current) return;
      const first = el.firstElementChild as HTMLElement | null;
      const step = first ? first.offsetWidth + 12 : 240;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft >= maxScroll - 8 ? 0 : el.scrollLeft + step;
      el.scrollTo({ left: next, behavior: "smooth" });
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [sponsors.length]);

  if (sponsors.length === 0) return null;

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 12 : 240;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-base sm:text-lg font-bold text-foreground">
          <Award className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Sponsor Highlights
        </h2>
        {sponsors.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Previous sponsors"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-primary hover:text-primary-foreground hover:border-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Next sponsors"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-primary hover:text-primary-foreground hover:border-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        onPointerEnter={() => (pausedRef.current = true)}
        onPointerLeave={() => (pausedRef.current = false)}
        onTouchStart={() => (pausedRef.current = true)}
        onTouchEnd={() => (pausedRef.current = false)}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sponsors.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelected(s)}
            className="snap-start shrink-0 w-52 sm:w-60 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="mb-2.5 flex h-16 sm:h-20 items-center justify-center rounded-lg bg-white p-2 ring-1 ring-border">
              {s.logo ? (
                <img
                  src={s.logo}
                  alt={s.firmName}
                  className="max-h-12 sm:max-h-16 w-auto max-w-full object-contain"
                />
              ) : (
                <Building2 className="h-8 w-8 text-primary/50" />
              )}
            </div>
            {s.sponsorshipType && (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                <span aria-hidden="true">{sponsorTypeEmoji(s.sponsorshipType)}</span>
                <span className="truncate">{s.sponsorshipType}</span>
              </span>
            )}
            <p className="mt-1.5 truncate text-sm font-semibold text-foreground">{s.firmName}</p>
            <p className="truncate text-xs text-muted-foreground">{s.ownerName}</p>
          </button>
        ))}
      </div>

      {/* Sponsor detail popup */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-sm">
          {selected && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{selected.firmName}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center pt-2 text-center">
                <div className="flex h-32 w-full items-center justify-center rounded-xl bg-white p-4 ring-1 ring-border">
                  {selected.logo ? (
                    <img
                      src={selected.logo}
                      alt={selected.firmName}
                      className="max-h-24 w-auto max-w-full object-contain"
                    />
                  ) : (
                    <Building2 className="h-12 w-12 text-primary/50" />
                  )}
                </div>
                {selected.sponsorshipType && (
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-gradient-to-r from-primary/25 to-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                    <span aria-hidden="true">{sponsorTypeEmoji(selected.sponsorshipType)}</span>
                    {selected.sponsorshipType}
                  </span>
                )}
                <h3 className="mt-2 font-display text-xl font-bold text-foreground">
                  {selected.firmName}
                </h3>
                <p className="mt-0.5 text-sm font-semibold text-primary">{selected.ownerName}</p>
                {selected.tagline && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {selected.tagline}
                  </p>
                )}
                <div className="mt-4 flex w-full flex-col gap-2">
                  {selected.website && (
                    <a
                      href={selected.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                    >
                      <Globe className="h-4 w-4 text-primary" />
                      {hostname(selected.website)}
                    </a>
                  )}
                  {selected.contactNumber && (
                    <a
                      href={`tel:${selected.contactNumber.replace(/\s+/g, "")}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                    >
                      <Phone className="h-4 w-4 text-primary" />
                      {selected.contactNumber}
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default SponsorHighlights;
