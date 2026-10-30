import { Crown, Network, Shield, Trophy } from "lucide-react";
import { useT } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import Reveal from "./Reveal";

const pillars: { numeral: string; icon: typeof Crown; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { numeral: "I", icon: Crown, titleKey: "pillars.p1.title", descKey: "pillars.p1.desc" },
  { numeral: "II", icon: Shield, titleKey: "pillars.p2.title", descKey: "pillars.p2.desc" },
  { numeral: "III", icon: Network, titleKey: "pillars.p3.title", descKey: "pillars.p3.desc" },
  { numeral: "IV", icon: Trophy, titleKey: "pillars.p4.title", descKey: "pillars.p4.desc" },
];

/** "The RBN Code" — the four pillars drawn as arched columns of a palace facade. */
export default function RbnCodeSection() {
  const t = useT();
  return (
    <section className="relative overflow-hidden bg-royal-night text-card py-24 sm:py-28">
      <div className="absolute inset-0 bg-dot-grid pointer-events-none" />
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-x-0 -top-[0.12em] text-center font-wordmark font-semibold italic leading-none whitespace-nowrap text-outline-royal opacity-30 text-[30vw] lg:text-[22rem]"
      >
        Code
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto">
          <p className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
            <span className="h-px w-8 bg-primary/70" />
            {t("pillars.eyebrow")}
            <span className="h-px w-8 bg-primary/70" />
          </p>
          <h2 className="mt-4 font-wordmark font-semibold text-4xl sm:text-6xl leading-[1.02]">{t("pillars.heading")}</h2>
        </Reveal>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
          {pillars.map((p, i) => (
            <Reveal key={p.titleKey} delay={i * 120} className={i % 2 ? "lg:mt-16" : ""}>
              <article className="group relative h-full shape-arch border border-card/15 bg-gradient-to-b from-card/[0.08] to-card/[0.02] px-6 pt-14 pb-9 text-center transition-all duration-500 hover:-translate-y-2 hover:border-primary/60 hover:shadow-[0_30px_60px_-30px_hsl(var(--primary)/0.6)]">
                <div className="absolute inset-3 shape-arch border border-card/[0.06] pointer-events-none" />
                <span className="block font-wordmark text-7xl font-semibold leading-none text-gradient-royal transition-transform duration-500 group-hover:scale-110">
                  {p.numeral}
                </span>
                <div className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40 transition-colors duration-500 group-hover:bg-primary">
                  <p.icon className="h-5 w-5 text-primary transition-colors duration-500 group-hover:text-primary-foreground" />
                </div>
                <h3 className="mt-5 font-wordmark text-2xl font-semibold">{t(p.titleKey)}</h3>
                <div className="mx-auto my-4 flex items-center justify-center gap-2 text-primary/70" aria-hidden="true">
                  <span className="h-px w-6 bg-current" />
                  <span className="text-[8px]">◆</span>
                  <span className="h-px w-6 bg-current" />
                </div>
                <p className="text-sm text-card/65 leading-relaxed">{t(p.descKey)}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
