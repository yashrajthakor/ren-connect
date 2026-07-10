import { useEffect, useRef, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, Globe, Sparkles } from "lucide-react";
import { useActiveSponsors, sponsorTypeEmoji, type Sponsor } from "@/hooks/useSponsors";
import { useT } from "@/i18n/LanguageProvider";

const ROTATE_MS = 5500;

const hostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

type Props = {
  items?: Sponsor[];
};

const SponsorshipShowcase = ({ items }: Props) => {
  const t = useT();
  const { data: fetched = [], isLoading } = useActiveSponsors();
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const list = (items ?? fetched).filter((s) => s.logo && s.firmName);

  // Auto-scroll; restartable so manual navigation doesn't fight the timer.
  const restartTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (list.length <= 1) return;
    timerRef.current = setInterval(
      () => setActive((i) => (i + 1) % list.length),
      ROTATE_MS
    );
  };

  useEffect(() => {
    restartTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  useEffect(() => {
    setActive(0);
  }, [list.length]);

  if (isLoading && !items) return null;
  if (list.length === 0) return null;

  const sponsor = list[Math.min(active, list.length - 1)];

  const goTo = (i: number) => {
    setActive(((i % list.length) + list.length) % list.length);
    restartTimer();
  };

  return (
    <aside
      className="w-full lg:w-[24rem] xl:w-[30rem] shrink-0 animate-fade-up"
      style={{ animationDelay: "450ms", opacity: 0 }}
      aria-label={t("sponsor.sectionLabel")}
    >
      <div className="relative overflow-hidden rounded-2xl border border-card/25 bg-card/10 backdrop-blur-md shadow-2xl">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        <div className="relative p-5 sm:p-6">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between gap-3">
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

          {/* Split card: logo (40%) | info (60%); stacks on mobile */}
          <div
            key={sponsor.id}
            className="flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-5 animate-fade-up"
          >
            <div className="sm:w-[40%] shrink-0">
              <div className="flex h-32 sm:h-full sm:min-h-[10rem] items-center justify-center rounded-xl bg-white p-4 ring-1 ring-card/25 shadow-lg">
                {sponsor.logo ? (
                  <img
                    src={sponsor.logo}
                    alt={sponsor.firmName}
                    className="max-h-24 sm:max-h-32 w-auto max-w-full object-contain"
                  />
                ) : (
                  <Building2 className="h-12 w-12 text-primary/60" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1 flex flex-col justify-center">
              {sponsor.sponsorshipType && (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/40 bg-gradient-to-r from-primary/25 to-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary shadow-sm">
                  <span aria-hidden="true">{sponsorTypeEmoji(sponsor.sponsorshipType)}</span>
                  {sponsor.sponsorshipType}
                </span>
              )}
              <h3 className="mt-2.5 font-display text-xl sm:text-2xl font-bold leading-tight text-card">
                {sponsor.firmName}
              </h3>
              <p className="mt-1 text-sm font-semibold text-primary">{sponsor.ownerName}</p>
              {sponsor.tagline && (
                <p className="mt-1.5 text-sm leading-relaxed text-card/70 line-clamp-3">
                  {sponsor.tagline}
                </p>
              )}
              {sponsor.website && (
                <a
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-card/80 underline-offset-4 transition hover:text-primary hover:underline"
                >
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  {hostname(sponsor.website)}
                </a>
              )}
            </div>
          </div>

          {/* Navigation: arrows + pagination */}
          {list.length > 1 && (
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Previous sponsor"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-card/25 bg-card/10 text-card/70 transition hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-center gap-2">
                {list.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === active ? "w-8 bg-primary" : "w-1.5 bg-card/30 hover:bg-card/50"
                    }`}
                    aria-label={`${t("sponsor.viewSponsor")} ${item.firmName}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="Next sponsor"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-card/25 bg-card/10 text-card/70 transition hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default SponsorshipShowcase;
