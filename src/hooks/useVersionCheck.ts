import { useEffect, useRef, useState } from "react";

// Frontend half of the deployment cache-busting system.
//
// On a published build, Vite writes `/version.json` to the dist root and
// inlines the same build id into `import.meta.env.VITE_BUILD_ID` (via the
// `__BUILD_ID__` define in vite.config.ts). At runtime we periodically refetch
// `/version.json` with `cache: "no-store"`. If the server-side build id no
// longer matches the one this tab booted with, we know a new deployment has
// shipped and surface an "Update available" prompt.

declare const __BUILD_ID__: string;

const POLL_INTERVAL_MS = 60_000; // 1 minute

const currentBuildId: string =
  typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev";

type VersionPayload = { version: string; buildTime?: string };

async function fetchLatestVersion(): Promise<string | null> {
  try {
    // Cache-bust query + no-store to defeat any intermediate proxy/browser caching.
    const res = await fetch(`/version.json?ts=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as VersionPayload;
    return data?.version ?? null;
  } catch {
    return null;
  }
}

async function tryUpdateServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs.map(async (reg) => {
        await reg.update();
        const waiting = reg.waiting;
        if (waiting) waiting.postMessage({ type: "SKIP_WAITING" });
      }),
    );
  } catch {
    /* ignore */
  }
}

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const latestRef = useRef<string | null>(null);

  useEffect(() => {
    // Only meaningful in production builds.
    if (import.meta.env.DEV) return;

    let cancelled = false;

    const check = async () => {
      const latest = await fetchLatestVersion();
      if (cancelled || !latest) return;
      latestRef.current = latest;
      if (latest !== currentBuildId) {
        setUpdateAvailable(true);
        // Kick the service worker so its caches roll over before the user reloads.
        void tryUpdateServiceWorker();
      }
    };

    // Initial check on mount + when tab regains focus.
    void check();
    const interval = window.setInterval(check, POLL_INTERVAL_MS);
    const onFocus = () => void check();
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const applyUpdate = () => {
    // Hard reload — bypasses HTTP cache where supported.
    if ("serviceWorker" in navigator) {
      void tryUpdateServiceWorker().finally(() => window.location.reload());
    } else {
      window.location.reload();
    }
  };

  return { updateAvailable, applyUpdate, currentBuildId };
}