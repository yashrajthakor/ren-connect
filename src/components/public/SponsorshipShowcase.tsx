import { useEffect, useState } from "react";
import { Building2, Quote, Sparkles } from "lucide-react";
import { useActiveSponsors, type Sponsor } from "@/hooks/useSponsors";
import { useT } from "@/i18n/LanguageProvider";

const ROTATE_MS = 5500;

type Props = {
  items?: Sponsor[];
};

const SponsorshipShowcase = ({ items }: Props) => {
  const t = useT();
  const { data: fetched = [], isLoading } = useActiveSponsors();
  const [active, setActive] = useState(0);
  const list = (items ?? fetched).filter((s) => s.logo && s.firmName);

  useEffect(() => {
    if (list.length <= 1) return;
    const timer = setInterval(
      () => setActive((i) => (i + 1) % list.length),
      ROTATE_MS
    );
    return () => clearInterval(timer);
  }, [list.length]);

  useEffect(() => {
    setActive(0);
  }, [list.length]);

  if (isLoading && !items) return null;
  if (list.length === 0) return null;

  const sponsor = list[active];

  return (
    <aside
      className="w-full lg:w-[22rem] xl:w-[26rem] shrink-0 animate-fade-up"
      style={{ animationDelay: "450ms", opacity: 0 }}
      aria-label={t("sponsor.sectionLabel")}
    >
      <div className="relative overflow-hidden rounded-2xl border border-card/25 bg-card/10 p-6 sm:p-7 backdrop-blur-md shadow-2xl">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3 w-3" />
              {t("sponsor.badge")}
            </span>
            {list.length > 1 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-card/50">
                {active + 1} / {list.length}
              </span>
            )}
          </div>

          <div className="mb-5 flex h-20 items-center justify-center rounded-xl border border-card/15 bg-secondary/40 px-4">
            {sponsor.logo ? (
              <img
                src={sponsor.logo}
                alt={sponsor.firmName}
                className="max-h-14 w-auto max-w-full object-contain"
              />
            ) : (
              <Building2 className="h-10 w-10 text-primary/60" />
            )}
          </div>

          <div key={sponsor.id} className="space-y-2 animate-fade-up">
            <h3 className="font-display text-xl font-bold leading-tight text-card">
              {sponsor.firmName}
            </h3>
            <p className="text-sm font-medium text-primary">{sponsor.ownerName}</p>
            {sponsor.tagline && (
              <p className="flex items-start gap-2 text-sm leading-relaxed text-card/70">
                <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                <span>{sponsor.tagline}</span>
              </p>
            )}
          </div>

          {list.length > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {list.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-8 bg-primary" : "w-1.5 bg-card/30 hover:bg-card/50"
                  }`}
                  aria-label={`${t("sponsor.viewSponsor")} ${item.firmName}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default SponsorshipShowcase;
