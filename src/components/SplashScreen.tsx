import { useEffect, useState } from "react";
import renLogo from "@/assets/ren-logo.png";
import { isPwaStandalone } from "@/components/PwaInstallPrompt";

const SPLASH_KEY = "rbn_splash_shown";
const SPLASH_MS = 1500;
const FADE_MS = 400;

/**
 * Branded splash shown when the installed RBN app is launched.
 * Renders as an overlay so the app keeps initializing underneath,
 * then fades itself away — it never blocks startup.
 */
const SplashScreen = () => {
  // Only on a fresh launch of the installed app (once per session).
  const [phase, setPhase] = useState<"show" | "leave" | "gone">(() =>
    isPwaStandalone() && !sessionStorage.getItem(SPLASH_KEY) ? "show" : "gone"
  );

  useEffect(() => {
    if (phase === "gone") return;
    sessionStorage.setItem(SPLASH_KEY, "1");
    const leave = setTimeout(() => setPhase("leave"), SPLASH_MS);
    const gone = setTimeout(() => setPhase("gone"), SPLASH_MS + FADE_MS);
    return () => {
      clearTimeout(leave);
      clearTimeout(gone);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white bg-gradient-to-b from-white via-white to-primary/10 transition-opacity ease-out ${
        phase === "leave" ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <style>{`
        @keyframes rbn-splash-logo {
          0% { opacity: 0; transform: scale(0.9) rotateY(180deg); }
          55% { opacity: 1; }
          100% { opacity: 1; transform: scale(1) rotateY(0deg); }
        }
        @keyframes rbn-splash-glow {
          0%, 100% { box-shadow: 0 0 28px hsl(var(--primary) / 0.22); }
          50% { box-shadow: 0 0 52px hsl(var(--primary) / 0.4); }
        }
        @keyframes rbn-splash-text {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ perspective: "700px" }}>
        <div
          className="flex h-28 w-28 items-center justify-center rounded-full bg-white ring-1 ring-border"
          style={{
            animation:
              "rbn-splash-logo 900ms cubic-bezier(0.22, 1, 0.36, 1) both, rbn-splash-glow 1800ms ease-in-out 700ms infinite",
          }}
        >
          <img src={renLogo} alt="" className="h-20 w-20 rounded-full object-contain" />
        </div>
      </div>

      <p
        className="mt-6 font-display text-xl font-bold tracking-wide text-foreground"
        style={{ animation: "rbn-splash-text 600ms ease-out 350ms both" }}
      >
        Rajput Business Network
      </p>

      <p
        className="absolute bottom-[max(2.5rem,env(safe-area-inset-bottom))] px-6 text-center text-xs font-medium tracking-wide text-muted-foreground"
        style={{ animation: "rbn-splash-text 600ms ease-out 550ms both" }}
      >
        Connecting Businesses. Building Relationships.
      </p>
    </div>
  );
};

export default SplashScreen;
