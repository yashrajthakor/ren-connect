import { cn } from "@/lib/utils";
import { useFontReady } from "@/hooks/useFontReady";

const WORDMARK_FONT = '600 1em "Cormorant Garamond"';

/**
 * Oversized brand word that fades from gold into the background (hero + footer).
 * The outer div takes positioning classes; the inner span owns the rise animation,
 * so the animation's transform never fights a translate on the wrapper.
 */
export default function GiantWordmark({ text, className }: { text: string; className?: string }) {
  const ready = useFontReady(WORDMARK_FONT);
  return (
    <div aria-hidden="true" className={cn("pointer-events-none select-none", className)}>
      <span
        className={cn(
          "block font-wordmark font-semibold leading-[0.8] tracking-[-0.02em] text-wordmark-fade whitespace-nowrap",
          ready ? "animate-wordmark-rise motion-reduce:animate-none" : "opacity-0"
        )}
      >
        {text}
      </span>
    </div>
  );
}
