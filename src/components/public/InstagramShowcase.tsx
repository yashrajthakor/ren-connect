import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Instagram, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstagramPost = {
  id: number;
  instagramUrl: string;
};

type EmbedCardProps = {
  post: InstagramPost;
  index: number;
};

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

const INITIAL_VISIBLE_COUNT = 6;
const POSTS: InstagramPost[] = [
  {
    id: 1,
    instagramUrl: "https://www.instagram.com/p/DaPw-HCt2cx/",
  },
  {
    id: 2,
    instagramUrl: "https://www.instagram.com/p/DZcu7QDtksv/",
  },
  {
    id: 3,
    instagramUrl: "https://www.instagram.com/p/DZe_h29DTGd/?img_index=1",
  }
];

// ---- embed.js loader (singleton, shared across all cards) ----
let embedScriptPromise: Promise<void> | null = null;

const loadInstagramEmbedScript = (): Promise<void> => {
  if (window.instgrm) return Promise.resolve();

  if (!embedScriptPromise) {
    embedScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.instagram.com/embed.js"]',
      );

      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("embed.js failed to load")));
        // Script may have already finished loading before this listener attached
        if (window.instgrm) resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("embed.js failed to load"));
      document.body.appendChild(script);
    });
  }

  return embedScriptPromise;
};

const isValidInstagramUrl = (instagramUrl: string) =>
  /instagram\.com\/(p|reel)\/[^/?#]+/i.test(instagramUrl);

const InstagramEmbedCard = ({ post, index }: EmbedCardProps) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const blockquoteRef = useRef<HTMLQuoteElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [embedState, setEmbedState] = useState<"loading" | "loaded" | "error">("loading");

  const isValidUrl = useMemo(() => isValidInstagramUrl(post.instagramUrl), [post.instagramUrl]);

  // Lazy-mount when scrolled into view
  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Load embed.js + process the blockquote once visible
  useEffect(() => {
    if (!isVisible || !isValidUrl) {
      if (!isValidUrl) setEmbedState("error");
      return;
    }

    let cancelled = false;

    loadInstagramEmbedScript()
      .then(() => {
        if (cancelled) return;
        window.instgrm?.Embeds.process();
      })
      .catch(() => {
        if (!cancelled) setEmbedState("error");
      });

    // embed.js replaces the <blockquote> with a real <iframe> once it
    // successfully hydrates. We watch for that DOM swap to know it worked,
    // since there's no callback API for individual embed success/failure.
    const container = blockquoteRef.current?.parentElement;
    let mutationObserver: MutationObserver | null = null;

    if (container) {
      mutationObserver = new MutationObserver(() => {
        if (container.querySelector("iframe")) {
          setEmbedState("loaded");
          mutationObserver?.disconnect();
        }
      });
      mutationObserver.observe(container, { childList: true, subtree: true });
    }

    // Fallback: if embed.js never swaps in an iframe within a few seconds
    // (blocked post, deleted post, private account, rate limit, etc.), show
    // the graceful fallback card instead of a permanently blank box.
    const timeoutId = window.setTimeout(() => {
      setEmbedState((current) => (current === "loaded" ? current : "error"));
    }, 8000);

    return () => {
      cancelled = true;
      mutationObserver?.disconnect();
      window.clearTimeout(timeoutId);
    };
  }, [isVisible, isValidUrl, post.instagramUrl]);

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="group h-full rounded-[16px] border border-border/80 bg-white p-2 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)]">
        <div className="overflow-hidden rounded-[12px] border border-border/70 bg-muted/70">
          {embedState === "error" ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 bg-white px-6 text-center">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Instagram className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold text-secondary">This post isn't loading right now.</p>
                <p className="text-sm text-muted-foreground">
                  We can't display the embed in this browser session, but the original Instagram post is still available.
                </p>
              </div>
              <Button asChild variant="royal" size="sm">
                <a href={post.instagramUrl} target="_blank" rel="noreferrer noopener">
                  View on Instagram <ArrowUpRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </div>
          ) : (
            <>
              {embedState === "loading" && (
                <div className="pointer-events-none absolute inset-0 flex min-h-[320px] flex-col justify-between bg-white p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-10 w-24 rounded-full bg-muted" />
                    <div className="h-48 rounded-[12px] bg-muted" />
                    <div className="h-4 w-full rounded-full bg-muted" />
                    <div className="h-4 w-3/4 rounded-full bg-muted" />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading Instagram embed…
                  </div>
                </div>
              )}

              {isVisible && (
                <div className={embedState === "loading" ? "invisible h-0 overflow-hidden" : "block"}>
                  <blockquote
                    ref={blockquoteRef}
                    className="instagram-media"
                    data-instgrm-permalink={post.instagramUrl}
                    data-instgrm-version="14"
                    style={{ margin: 0, width: "100%" }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const InstagramShowcase = () => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const hasMore = visibleCount < POSTS.length;

  return (
    <section className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Latest on Instagram
        </p>
        <h2 className="font-display text-3xl font-bold leading-tight text-secondary sm:text-4xl">
        See Instagram posts from our business network Post /stories.
        </h2>
        <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
        Follow us on Instagram to stay updated with our latest posts, business insights, and community highlights. Join the conversation and be part of our growing network.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {POSTS.slice(0, visibleCount).map((post, index) => (
          <InstagramEmbedCard key={post.id} post={post} index={index} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            className="rounded-full px-6"
            onClick={() => setVisibleCount((current) => Math.min(current + 2, POSTS.length))}
          >
            View More
          </Button>
        </div>
      )}

      <div className="mt-12 rounded-[24px] border border-border/80 bg-gradient-to-br from-secondary via-[hsl(213,25%,18%)] to-secondary p-8 text-card shadow-xl sm:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">
              Follow 
            </p>
            <h3 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
              Follow us for more engagement, meeting updates and business insights.
            </h3>
          </div>
          <Button asChild variant="royal" size="lg" className="rounded-full">
            <a href="https://www.instagram.com/rbn.business.network/" target="_blank" rel="noreferrer noopener">
              Follow on Instagram <ArrowUpRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default InstagramShowcase;
