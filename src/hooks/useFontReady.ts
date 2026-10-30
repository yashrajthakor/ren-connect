import { useEffect, useState } from "react";

/**
 * True once the given CSS font (e.g. `600 1em "Cormorant Garamond"`) has loaded,
 * so display type can animate in with its real face instead of flashing the fallback.
 * Gives up waiting after `timeoutMs` so a slow font never hides content.
 */
export function useFontReady(font: string, timeoutMs = 2500): boolean {
  const [ready, setReady] = useState(() => typeof document === "undefined" || !("fonts" in document));

  useEffect(() => {
    if (ready) return;
    let alive = true;
    const done = () => alive && setReady(true);
    document.fonts.load(font).then(done, done);
    const timer = setTimeout(done, timeoutMs);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [font, ready, timeoutMs]);

  return ready;
}
