import { Link } from "react-router-dom";
import { ChevronRight, Award } from "lucide-react";
import { useActiveSponsors, type Sponsor } from "@/hooks/useSponsors";

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

function SponsorCard({ s }: { s: Sponsor }) {
  const inner = (
    <div className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 w-[150px] sm:w-[170px] shrink-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary hover:shadow-primary/10">
      <div className="h-16 w-16 rounded-lg bg-white flex items-center justify-center overflow-hidden ring-1 ring-border">
        {s.logo ? (
          <img src={s.logo} alt={s.firmName} className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <Award className="h-8 w-8 text-primary/60" />
        )}
      </div>
      <p className="text-xs sm:text-sm font-semibold text-secondary text-center line-clamp-2 leading-snug">
        {s.firmName}
      </p>
    </div>
  );
  return s.website ? (
    <a href={s.website} target="_blank" rel="noopener noreferrer" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
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

  if (!isLoading && groups.length === 0) return null;

  return (
    <section id="our-sponsors" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
      <div className="bg-white rounded-[20px] shadow-[0_10px_40px_-15px_rgba(15,23,42,0.15)] border border-border p-6 sm:p-10">
        {/* Heading */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-primary/40" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-secondary whitespace-nowrap">
            Our Proud Sponsors
          </h2>
          <span className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-primary/40" />
        </div>

        {isLoading ? (
          <div className="flex gap-4 justify-center">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 w-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto whitespace-nowrap scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-start gap-8 flex-nowrap min-w-max">
              {groups.map((g) => (
                <div key={g.key} className="flex flex-col items-start gap-3 shrink-0">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${g.badge}`}>
                    <Award className="h-3 w-3" />
                    {g.label}
                  </span>
                  <div className="flex gap-4 flex-nowrap">
                    {g.items.map((s) => (
                      <SponsorCard key={s.id} s={s} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View All */}
        {/* <div className="flex justify-end mt-6">
          <Link
            to="/#our-sponsors"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline group"
          >
            View All Sponsors
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div> */}
      </div>
    </section>
  );
}