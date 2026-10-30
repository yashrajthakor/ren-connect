import { Award } from "lucide-react";
import { useActiveSponsors, type Sponsor } from "@/hooks/useSponsors";
import SponsorshipShowcase from "@/components/public/SponsorshipShowcase";
import Reveal from "@/components/public/landing/Reveal";

function badgeClassesFor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("platinum")) return "bg-slate-100 text-slate-700 border-slate-300";
  if (t.includes("gold")) return "bg-amber-50 text-amber-700 border-amber-300";
  if (t.includes("silver")) return "bg-zinc-100 text-zinc-700 border-zinc-300";
  if (t.includes("bronze")) return "bg-orange-50 text-orange-800 border-orange-300";
  if (t.includes("title")) return "bg-primary/10 text-primary border-primary/30";
  if (t.includes("event")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (t.includes("tech")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  return "bg-secondary/10 text-secondary border-secondary/20";
}

function SponsorTile({ s, tier, badge }: { s: Sponsor; tier: string; badge: string }) {
  const inner = (
    <div className="group relative flex h-full flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_18px_40px_-20px_hsl(var(--primary)/0.45)]">
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-primary to-[hsl(var(--royal-gold))] transition-transform duration-500 group-hover:scale-x-100" />
      <div className="flex h-16 w-full shrink-0 items-center justify-center">
        {s.logo ? (
          <img
            src={s.logo}
            alt={s.firmName}
            className="max-h-16 max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <Award className="h-8 w-8 text-primary/60" />
        )}
      </div>
      <p className="text-xs sm:text-sm font-semibold text-secondary line-clamp-2 leading-snug">{s.firmName}</p>
      <span className={`mt-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge}`}>
        <Award className="h-2.5 w-2.5 shrink-0" />
        <span className="line-clamp-1">{tier}</span>
      </span>
    </div>
  );
  return s.website ? (
    <a
      href={s.website}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {inner}
    </a>
  ) : (
    inner
  );
}

export default function SponsorsSection() {
  const { data: sponsors = [], isLoading } = useActiveSponsors();

  // Dynamically group sponsors by their `sponsorship_type` value, preserving
  // first-seen order (which reflects display_order/created_at from the query).
  const groups = (() => {
    const map = new Map<string, { key: string; label: string; badge: string; items: Sponsor[] }>();
    for (const s of sponsors) {
      const label = (s.sponsorshipType || "Other").trim();
      const key = label.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { key, label, badge: badgeClassesFor(label), items: [] });
      }
      map.get(key)!.items.push(s);
    }
    return Array.from(map.values());
  })();

  const hasSpotlight = sponsors.some((s) => s.logo && s.firmName);

  if (!isLoading && groups.length === 0) return null;

  return (
    <section id="our-sponsors" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <Reveal className="grid lg:grid-cols-2 gap-6 items-end mb-12">
        <div>
          <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
            <span className="h-px w-10 bg-primary" />
            Our Proud Sponsors
          </p>
          <h2 className="mt-4 font-wordmark font-semibold text-4xl sm:text-6xl text-secondary leading-[0.98]">
            The patrons behind <span className="italic text-gradient-royal pr-1">our brotherhood</span>
          </h2>
        </div>
        <p className="text-muted-foreground leading-relaxed lg:max-w-md lg:justify-self-end">
          Businesses from our own community who stand behind every meet, event and initiative of RBN.
        </p>
      </Reveal>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid lg:grid-cols-[auto_minmax(0,1fr)] gap-8 items-start">
          {hasSpotlight && (
            <Reveal className="rounded-[1.75rem] bg-royal-night p-2 sm:p-3 shadow-2xl lg:sticky lg:top-28">
              <SponsorshipShowcase />
            </Reveal>
          )}

          {/* One grid ordered by tier; each tile carries its own tier tag */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-fr">
            {groups.flatMap((g) =>
              g.items.map((s, i) => (
                <Reveal key={s.id} delay={Math.min(i, 6) * 60} className="h-full">
                  <SponsorTile s={s} tier={g.label} badge={g.badge} />
                </Reveal>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
