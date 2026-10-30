import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import heroHeritage from "@/assets/hero-heritage.jpg";
import heroBusiness from "@/assets/hero-business.jpg";
import heroHandshake from "@/assets/hero-handshake.jpg";
import renLogo from "@/assets/ren-logo.png";
import GiantWordmark from "./GiantWordmark";
import SplitWords from "./SplitWords";

const SLIDE_MS = 7000;
/** How long the outgoing text takes to fade before the next slide's text reveals. */
const TEXT_EXIT_MS = 500;
/** Gap between consecutive words in the headline reveal. */
const WORD_STEP_MS = 110;

type SlideDef = {
  image: string;
  eyebrowKey: TranslationKey;
  titleKey: TranslationKey;
  accentKey: TranslationKey;
  descKey: TranslationKey;
};

const heroSlides: SlideDef[] = [
  { image: heroHeritage, eyebrowKey: "hero.s1.eyebrow", titleKey: "hero.s1.title", accentKey: "hero.s1.accent", descKey: "hero.s1.desc" },
  { image: heroBusiness, eyebrowKey: "hero.s2.eyebrow", titleKey: "hero.s2.title", accentKey: "hero.s2.accent", descKey: "hero.s2.desc" },
  { image: heroHandshake, eyebrowKey: "hero.s3.eyebrow", titleKey: "hero.s3.title", accentKey: "hero.s3.accent", descKey: "hero.s3.desc" },
];

export type HeroStat = { labelKey: TranslationKey; value: string };

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

export default function HeroSection({ stats, className }: { stats: HeroStat[]; className?: string }) {
  const t = useT();
  // `slide` drives the images; `textSlide` lags behind so the old copy can fade out first.
  const [slide, setSlide] = useState(0);
  const [textSlide, setTextSlide] = useState(0);
  const [leaving, setLeaving] = useState(false);

  // Restarts whenever the slide changes, so a manual pick gets the full duration too.
  useEffect(() => {
    const timer = setTimeout(() => setSlide((s) => (s + 1) % heroSlides.length), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [slide]);

  useEffect(() => {
    if (slide === textSlide) return;
    setLeaving(true);
    const timer = setTimeout(() => {
      setTextSlide(slide);
      setLeaving(false);
    }, TEXT_EXIT_MS);
    return () => clearTimeout(timer);
  }, [slide, textSlide]);

  const current = heroSlides[textSlide];
  const title = t(current.titleKey);
  const accent = t(current.accentKey);
  const sealText = `${t("common.brandFull")} • ${t("common.tagline").replace(/[.।]$/, "")} • `;

  // Reveal order: eyebrow → title words → accent words → description → buttons.
  const titleStart = 200;
  const accentStart = titleStart + wordCount(title) * WORD_STEP_MS + 100;
  const descStart = accentStart + wordCount(accent) * WORD_STEP_MS + 150;
  const ctaStart = descStart + 250;

  return (
    <section className={cn("relative flex flex-col overflow-hidden bg-royal-night text-card", className)}>
      {/* Background slideshow: slow cross-fade while each photo gently settles from a zoom */}
      {heroSlides.map((s, i) => (
        <img
          key={i}
          src={s.image}
          alt={i === slide ? t(s.titleKey) : ""}
          aria-hidden={i !== slide}
          className={cn(
            "absolute inset-0 h-full w-full object-cover will-change-[opacity,transform] motion-reduce:!transition-none",
            i === slide ? "opacity-100 scale-100" : "opacity-0 scale-110"
          )}
          style={{ transition: "opacity 1.8s ease-in-out, transform 9s cubic-bezier(0.22, 1, 0.36, 1)" }}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(213_30%_11%/0.95)] via-[hsl(213_30%_11%/0.72)] to-[hsl(213_30%_11%/0.25)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(213_30%_11%/0.9)] via-transparent to-transparent" />

      {/* Gradient brand mark, sitting behind the frosted stats bar */}
      <GiantWordmark
        text="RBN"
        className="absolute bottom-0 right-0 sm:right-[3vw] opacity-80 text-[48vw] sm:text-[34vw] lg:text-[46vh]"
      />

      <div className="relative z-10 flex flex-1 items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-[5vh]">
          <div
            key={textSlide}
            className={cn(
              "max-w-[46rem] transition-[opacity,transform,filter] duration-500 ease-out",
              leaving && "opacity-0 -translate-y-3 blur-[6px]"
            )}
          >
            <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-primary animate-soft-reveal motion-reduce:animate-none">
              <span className="h-px w-10 bg-primary" />
              {t(current.eyebrowKey)}
            </p>

            <h1 className="mt-5 lg:mt-[2.5vh] font-wordmark font-semibold text-[2.6rem] sm:text-6xl lg:text-[clamp(2.75rem,min(9vh,5.4vw),5.5rem)] leading-[1.02] tracking-tight">
              <SplitWords text={title} delay={titleStart} step={WORD_STEP_MS} />
              <span className="block italic">
                <SplitWords text={accent} delay={accentStart} step={WORD_STEP_MS} wordClassName="text-gradient-royal pr-[0.06em]" />
              </span>
            </h1>

            <p
              className="mt-5 lg:mt-[2.5vh] text-base sm:text-lg text-card/80 max-w-2xl leading-relaxed animate-soft-reveal motion-reduce:animate-none"
              style={{ animationDelay: `${descStart}ms` }}
            >
              {t(current.descKey)}
            </p>

            <div
              className="mt-7 lg:mt-[4vh] flex flex-wrap gap-3 animate-soft-reveal motion-reduce:animate-none"
              style={{ animationDelay: `${ctaStart}ms` }}
            >
              <Button asChild variant="royal" size="lg" className="btn-shine">
                <Link to="/signup">
                  {t("hero.cta.join")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-card/5 border-card/30 text-card hover:bg-card hover:text-secondary backdrop-blur-sm"
              >
                <Link to="/directory">{t("hero.cta.explore")}</Link>
              </Button>
            </div>
          </div>

          {/* Slide dots */}
          <div className="mt-8 lg:mt-[4vh] flex items-center gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === slide}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-700 ease-out",
                  i === slide ? "w-10 bg-primary" : "w-1.5 bg-card/40 hover:bg-card/70"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Rotating seal */}
      <div
        aria-hidden="true"
        className="absolute right-[7%] top-[26%] z-10 hidden h-[clamp(8rem,22vh,11rem)] w-[clamp(8rem,22vh,11rem)] -translate-y-1/2 md:block animate-soft-reveal"
        style={{ animationDelay: "900ms" }}
      >
        <div className="relative h-full w-full rounded-full bg-[hsl(213_30%_11%/0.6)] ring-1 ring-primary/40 backdrop-blur-md shadow-2xl">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full animate-spin-slow text-primary motion-reduce:animate-none">
            <defs>
              <path id="rbn-seal-circle" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
            </defs>
            <text className="fill-current uppercase" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.2em" }}>
              <textPath href="#rbn-seal-circle" textLength="470" lengthAdjust="spacing">
                {sealText}
              </textPath>
            </text>
          </svg>
          <div className="absolute inset-[30%] rounded-full bg-white p-1.5 shadow-inner">
            <img src={renLogo} alt="" className="h-full w-full object-contain" />
          </div>
        </div>
      </div>

      {/* Frosted stats bar */}
      <div className="relative z-10 border-t border-card/10 bg-[hsl(213_30%_11%/0.55)] backdrop-blur-md">
        <dl className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-y-4 py-5 lg:py-[2.2vh]">
          {stats.map((s, i) => (
            <div
              key={s.labelKey}
              className={cn(
                "flex flex-col-reverse animate-soft-reveal motion-reduce:animate-none",
                i % 2 === 1 && "pl-6 border-l border-card/10",
                i === 2 && "lg:pl-6 lg:border-l"
              )}
              style={{ animationDelay: `${1000 + i * 120}ms` }}
            >
              <dt className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-card/60">{t(s.labelKey)}</dt>
              <dd className="font-wordmark text-3xl sm:text-4xl lg:text-[clamp(1.9rem,5vh,3rem)] font-semibold text-gradient-royal leading-tight">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
