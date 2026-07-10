import { useEffect, useMemo, useState } from "react";
import {
  Smartphone,
  Download,
  Bell,
  Share2,
  MoreVertical,
  Plus,
  X,
  Check,
  Zap,
  Handshake,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import { isPushSupported, requestPushPermission } from "@/hooks/usePushNotifications";
import renLogo from "@/assets/ren-logo.png";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type Browser = "ios-safari" | "ios-chrome" | "android-chrome" | "samsung" | "desktop-chrome" | "desktop-safari" | "other";

const STORAGE = {
  dismissedAt: "rbn_install_dismissed_at",
  firstLoginShownAt: "rbn_install_first_login_shown_at",
};
const REPROMPT_DAYS = 7;

/** Event other parts of the app (e.g. Profile & More) dispatch to open the install flow. */
export const PWA_INSTALL_EVENT = "rbn:open-install-prompt";
export const openPwaInstall = () => window.dispatchEvent(new Event(PWA_INSTALL_EVENT));

const detectBrowser = (): Browser => {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  if (isIOS && /crios/.test(ua)) return "ios-chrome";
  if (isIOS) return "ios-safari";
  if (isAndroid && /samsungbrowser/.test(ua)) return "samsung";
  if (isAndroid) return "android-chrome";
  if (/chrome|edg/.test(ua)) return "desktop-chrome";
  if (/safari/.test(ua)) return "desktop-safari";
  return "other";
};

export const isPwaStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as any).standalone));

/** Should we follow up an install with the notification step? */
const needsNotifSetup = () => isPushSupported() && Notification.permission === "default";

const PwaInstallPrompt = () => {
  const { user } = useAuthContext();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<"install" | "notify">("install");

  const browser = useMemo(detectBrowser, []);

  useEffect(() => {
    setInstalled(isPwaStandalone());
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      // Follow up the install with a friendly one-tap notification opt-in.
      if (needsNotifSetup()) {
        setStep("notify");
        setModalOpen(true);
      } else {
        setModalOpen(false);
      }
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // First-login auto-popup (periodic re-prompt)
  useEffect(() => {
    if (!user || installed) return;
    const last = Number(localStorage.getItem(STORAGE.firstLoginShownAt) || 0);
    const dismissed = Number(localStorage.getItem(STORAGE.dismissedAt) || 0);
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const shouldShow =
      (!last || now - last > REPROMPT_DAYS * dayMs) &&
      (!dismissed || now - dismissed > REPROMPT_DAYS * dayMs);
    if (shouldShow) {
      const t = setTimeout(() => {
        setModalOpen(true);
        localStorage.setItem(STORAGE.firstLoginShownAt, String(now));
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [user, installed]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setInstalled(true);
          if (needsNotifSetup()) {
            setStep("notify");
            setModalOpen(true);
          } else {
            setModalOpen(false);
          }
        }
      } catch (e) {
        console.error(e);
      }
      setDeferredPrompt(null);
      return;
    }
    setStep("install");
    setModalOpen(true);
  };

  // Let other screens (Profile & More) reuse the exact same install flow.
  useEffect(() => {
    const onOpen = () => {
      handleInstall();
    };
    window.addEventListener(PWA_INSTALL_EVENT, onOpen);
    return () => window.removeEventListener(PWA_INSTALL_EVENT, onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredPrompt]);

  const dismissModal = () => {
    setModalOpen(false);
    if (step === "install") {
      localStorage.setItem(STORAGE.dismissedAt, String(Date.now()));
    }
  };

  // Keep rendering while the post-install notification step is open.
  if (installed && !modalOpen) return null;

  return (
    <>
      {/* Persistent floating CTA */}
      {!installed && (
        <button
          onClick={handleInstall}
          aria-label="Add RBN App to Home Screen"
          className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/90 px-4 py-3 text-sm font-semibold text-primary-foreground shadow-2xl shadow-primary/30 ring-1 ring-primary/40 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-primary/50"
        >
          <Smartphone className="h-5 w-5" />
          <span className="hidden sm:inline">Add RBN App</span>
          <span className="inline sm:hidden">Install</span>
        </button>
      )}

      {modalOpen &&
        (step === "notify" ? (
          <NotifyModal userId={user?.id} onClose={dismissModal} />
        ) : (
          <InstallModal
            browser={browser}
            canNativeInstall={!!deferredPrompt}
            onNativeInstall={handleInstall}
            onClose={dismissModal}
          />
        ))}
    </>
  );
};

const NotifyModal = ({ userId, onClose }: { userId?: string; onClose: () => void }) => {
  const [state, setState] = useState<"idle" | "working" | "granted" | "denied">("idle");

  const handleEnable = async () => {
    setState("working");
    const result = await requestPushPermission(userId);
    if (result === "granted") {
      setState("granted");
      setTimeout(onClose, 1800);
    } else if (result === "denied") {
      setState("denied");
    } else {
      setState("idle");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:items-center sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-notify-title"
        className="w-full max-w-sm rounded-t-3xl bg-card shadow-2xl border border-border sm:rounded-3xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
      >
        <div className="relative px-6 pt-7 pb-6 text-center">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/30">
            {state === "granted" ? <Check className="h-7 w-7" /> : <Bell className="h-7 w-7" />}
          </div>

          {state === "granted" ? (
            <>
              <h2 id="pwa-notify-title" className="mt-4 font-display text-xl font-bold text-foreground">
                You're all set! 🎉
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                You'll now get instant alerts for leads, meetings and community updates.
              </p>
            </>
          ) : (
            <>
              <h2 id="pwa-notify-title" className="mt-4 font-display text-xl font-bold text-foreground">
                App Installed! 🎉
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                One last step — turn on notifications so you never miss a lead, meeting or announcement.
              </p>

              {state === "denied" ? (
                <p className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                  Notifications are blocked for this site. You can enable them anytime from your
                  browser's site settings.
                </p>
              ) : (
                <Button onClick={handleEnable} disabled={state === "working"} className="mt-5 w-full" size="lg">
                  <Bell className="mr-2 h-4 w-4" />
                  {state === "working" ? "Waiting for permission…" : "Enable Notifications"}
                </Button>
              )}

              <button
                onClick={onClose}
                className="mt-1.5 w-full py-2.5 text-center text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                {state === "denied" ? "Done" : "Not Now"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const BENEFITS = [
  { icon: Handshake, label: "Instant Lead & Networking Alerts" },
  { icon: Bell, label: "Push Notifications" },
  { icon: Zap, label: "Faster Access to RBN" },
  { icon: Smartphone, label: "Better Mobile Experience" },
];

const InstallModal = ({
  browser,
  canNativeInstall,
  onNativeInstall,
  onClose,
}: {
  browser: Browser;
  canNativeInstall: boolean;
  onNativeInstall: () => void;
  onClose: () => void;
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const steps = getSteps(browser);

  const handlePrimary = () => {
    if (canNativeInstall) {
      onNativeInstall();
    } else {
      // No native prompt available (e.g. iOS) — guide the user instead.
      setShowHelp(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:items-center sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-t-3xl bg-card shadow-2xl border border-border sm:rounded-3xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
      >
        {/* Header */}
        <div className="relative px-6 pt-7 pb-5 text-center">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg shadow-primary/25 ring-1 ring-border">
            <img src={renLogo} alt="RBN" className="h-12 w-12 rounded-full object-contain" />
          </div>
          <h2 id="pwa-install-title" className="mt-4 font-display text-xl font-bold text-foreground">
            Install RBN App
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Get faster access, instant notifications, and stay connected with the RBN community.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-2 px-6">
          {BENEFITS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-2.5"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-xs font-medium leading-snug text-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 pt-5">
          <Button onClick={handlePrimary} className="w-full" size="lg">
            <Download className="mr-2 h-4 w-4" />
            Install RBN App
          </Button>
          <button
            onClick={onClose}
            className="mt-1.5 w-full py-2.5 text-center text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Maybe Later
          </button>
        </div>

        {/* Collapsible platform-specific help */}
        <div className="border-t border-border px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setShowHelp((v) => !v)}
            aria-expanded={showHelp}
            className="flex w-full items-center justify-center gap-1.5 py-1 text-xs font-semibold text-primary transition hover:opacity-80"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Need help installing?
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${showHelp ? "rotate-180" : ""}`}
            />
          </button>

          {showHelp && (
            <div className="pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {steps.title}
              </p>
              <ol className="space-y-1.5">
                {steps.steps.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-3 py-2"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-foreground">
                      {s.icon}
                      {s.text}
                    </span>
                  </li>
                ))}
              </ol>
              {steps.gu && (
                <p className="mt-2 text-[11px] italic text-muted-foreground">ગુજરાતી: {steps.gu}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getSteps = (
  browser: Browser
): { title: string; gu?: string; steps: { icon: JSX.Element; text: string }[] } => {
  const share = <Share2 className="h-4 w-4 text-primary" />;
  const more = <MoreVertical className="h-4 w-4 text-primary" />;
  const plus = <Plus className="h-4 w-4 text-primary" />;
  switch (browser) {
    case "ios-safari":
      return {
        title: "iPhone / iPad — Safari",
        gu: "Share બટન દબાવો અને 'Add to Home Screen' પસંદ કરો.",
        steps: [
          { icon: share, text: "Tap the Share button at the bottom" },
          { icon: plus, text: "Scroll and choose 'Add to Home Screen'" },
          { icon: <Check className="h-4 w-4 text-primary" />, text: "Tap 'Add' to confirm" },
        ],
      };
    case "ios-chrome":
      return {
        title: "iPhone — Chrome",
        gu: "Share આયકન દબાવી 'Add to Home Screen' પસંદ કરો.",
        steps: [
          { icon: share, text: "Tap the Share icon" },
          { icon: plus, text: "Choose 'Add to Home Screen'" },
          { icon: <Check className="h-4 w-4 text-primary" />, text: "Confirm with 'Add'" },
        ],
      };
    case "android-chrome":
      return {
        title: "Android — Chrome",
        gu: "મેનુ ખોલો અને 'Add to Home screen' પસંદ કરો.",
        steps: [
          { icon: more, text: "Tap the menu (⋮) at the top right" },
          { icon: plus, text: "Choose 'Add to Home screen' or 'Install app'" },
          { icon: <Check className="h-4 w-4 text-primary" />, text: "Tap 'Install' to confirm" },
        ],
      };
    case "samsung":
      return {
        title: "Samsung Internet",
        steps: [
          { icon: more, text: "Tap the menu at the bottom" },
          { icon: plus, text: "Choose 'Add page to' → 'Home screen'" },
          { icon: <Check className="h-4 w-4 text-primary" />, text: "Confirm to install" },
        ],
      };
    case "desktop-chrome":
      return {
        title: "Desktop — Chrome / Edge",
        steps: [
          { icon: <Download className="h-4 w-4 text-primary" />, text: "Click the install icon in the address bar" },
          { icon: plus, text: "Or open menu → 'Install RBN…'" },
          { icon: <Check className="h-4 w-4 text-primary" />, text: "Confirm to install as an app" },
        ],
      };
    case "desktop-safari":
      return {
        title: "Mac — Safari",
        steps: [
          { icon: share, text: "Click File → Share, or the Share button" },
          { icon: plus, text: "Choose 'Add to Dock'" },
          { icon: <Check className="h-4 w-4 text-primary" />, text: "Confirm to add RBN" },
        ],
      };
    default:
      return {
        title: "Install RBN",
        steps: [
          { icon: more, text: "Open your browser menu" },
          { icon: plus, text: "Choose 'Add to Home screen' or 'Install app'" },
          { icon: <Check className="h-4 w-4 text-primary" />, text: "Confirm to install" },
        ],
      };
  }
};

export default PwaInstallPrompt;
