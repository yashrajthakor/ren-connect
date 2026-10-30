import { useT } from "@/i18n/LanguageProvider";

const industries = [
  "Manufacturing",
  "Real Estate",
  "Finance",
  "Technology",
  "Retail",
  "Trading",
  "Services",
  "Startups",
  "Travel",
  "Export / Import",
  "Hospitality",
  "Agriculture",
];

const half = Math.ceil(industries.length / 2);
const rows = [industries.slice(0, half), industries.slice(half)];

/** Two counter-scrolling bands of industry names — one solid, one hollow. */
export default function IndustriesMarquee() {
  const t = useT();
  return (
    <section className="relative overflow-hidden border-y border-border bg-accent/50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-3">{t("industries.eyebrow")}</p>
        <h2 className="font-wordmark font-semibold text-4xl sm:text-5xl text-secondary">{t("industries.heading")}</h2>
      </div>

      <div className="space-y-4 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        {rows.map((row, r) => (
          <div key={r} className="group flex overflow-hidden">
            <div
              className={`flex w-max shrink-0 items-center group-hover:[animation-play-state:paused] motion-reduce:animate-none ${
                r === 0 ? "animate-marquee" : "animate-marquee-reverse"
              }`}
            >
              {/* Four copies: the -50% loop stays seamless and wide screens stay filled */}
              {[...row, ...row, ...row, ...row].map((name, i) => (
                <span key={i} className="flex items-center" aria-hidden={i >= row.length}>
                  <span
                    className={`px-6 sm:px-8 font-wordmark text-4xl sm:text-6xl font-semibold whitespace-nowrap ${
                      r === 0
                        ? "text-secondary"
                        : "italic text-transparent [-webkit-text-stroke:1px_hsl(var(--secondary)/0.55)]"
                    }`}
                  >
                    {name}
                  </span>
                  <span className="text-primary text-xl sm:text-2xl">✦</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
