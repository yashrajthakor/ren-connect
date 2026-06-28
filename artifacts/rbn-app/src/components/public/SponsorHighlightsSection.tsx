import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Phone, Globe, ExternalLink, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSponsors, type Sponsor } from "@/hooks/useSponsors";

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  return (
    <div className="flex-shrink-0 w-72 sm:w-80 bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-[hsl(var(--royal-gold,22_80%_54%))] to-primary" />

      <div className="p-5 flex flex-col h-full">
        {/* Logo + badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center shrink-0 shadow-sm">
            {sponsor.logo_url ? (
              <img
                src={sponsor.logo_url}
                alt={sponsor.firm_name}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <Building2 className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border border-primary/20">
            🤝 Sponsor
          </span>
        </div>

        {/* Name & firm */}
        <h3 className="font-display font-bold text-secondary text-lg leading-tight">
          {sponsor.sponsor_name}
        </h3>
        <p className="text-sm font-medium text-muted-foreground">{sponsor.firm_name}</p>

        {/* Category */}
        <span className="mt-2 inline-block self-start text-xs rounded-full bg-secondary/10 text-secondary px-2.5 py-0.5 font-medium border border-secondary/15">
          {sponsor.business_category}
        </span>

        {/* Tagline */}
        {sponsor.tagline && (
          <p className="mt-3 text-sm text-muted-foreground italic line-clamp-2 flex-1">
            "{sponsor.tagline}"
          </p>
        )}

        {/* Divider */}
        <div className="my-4 border-t border-border" />

        {/* Contact info */}
        <div className="space-y-1.5 mb-4">
          <a
            href={`tel:${sponsor.contact_number}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{sponsor.contact_number}</span>
          </a>
          {sponsor.website && (
            <a
              href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{sponsor.website.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
        </div>

        {/* CTA */}
        <div className="flex gap-2">
          <Button
            asChild
            size="sm"
            className="flex-1 text-xs"
            variant="default"
          >
            <a href={`tel:${sponsor.contact_number}`}>
              <Phone className="h-3.5 w-3.5 mr-1" /> Contact Sponsor
            </a>
          </Button>
          {sponsor.website && (
            <Button asChild size="sm" variant="outline" className="text-xs px-2.5">
              <a
                href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SponsorHighlightsSection() {
  const { data: sponsors = [], isLoading } = useSponsors();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const posRef = useRef(0);

  // Duplicate list for seamless infinite loop
  const items = sponsors.length > 0 ? [...sponsors, ...sponsors, ...sponsors] : [];

  const CARD_WIDTH = 336; // w-80 + gap
  const SPEED = 0.6; // px per frame

  useEffect(() => {
    if (!trackRef.current || items.length === 0) return;

    const totalWidth = sponsors.length * CARD_WIDTH;

    const animate = () => {
      if (!isPaused) {
        posRef.current += SPEED;
        if (posRef.current >= totalWidth) {
          posRef.current -= totalWidth;
        }
        if (trackRef.current) {
          trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
        }
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPaused, items.length, sponsors.length]);

  const scroll = (dir: "left" | "right") => {
    const delta = CARD_WIDTH * 2;
    const totalWidth = sponsors.length * CARD_WIDTH;
    if (dir === "right") {
      posRef.current = (posRef.current + delta) % totalWidth;
    } else {
      posRef.current = (posRef.current - delta + totalWidth) % totalWidth;
    }
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
    }
  };

  if (isLoading || sponsors.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-2">
              Premium Partners
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-secondary leading-tight">
              🤝 Our Sponsors
            </h2>
            <p className="mt-2 text-muted-foreground max-w-lg">
              Proudly supported by leading businesses within the RBN community.
            </p>
          </div>
          {/* Nav arrows */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="h-10 w-10 rounded-full border border-border bg-card shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5 text-secondary" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="h-10 w-10 rounded-full border border-border bg-card shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5 text-secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 z-10 pointer-events-none bg-gradient-to-r from-background/80 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 z-10 pointer-events-none bg-gradient-to-l from-background/80 to-transparent" />

        <div className="overflow-hidden">
          <div
            ref={trackRef}
            className="flex gap-5 py-2 will-change-transform"
            style={{ width: "max-content" }}
          >
            {items.map((sponsor, i) => (
              <SponsorCard key={`${sponsor.id}-${i}`} sponsor={sponsor} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile arrows */}
      <div className="flex sm:hidden justify-center gap-3 mt-6">
        <button
          onClick={() => scroll("left")}
          className="h-10 w-10 rounded-full border border-border bg-card shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-secondary" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="h-10 w-10 rounded-full border border-border bg-card shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-secondary" />
        </button>
      </div>
    </section>
  );
}
