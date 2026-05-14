import { useEffect, useMemo, useState } from "react";
import { Smartphone, Download, Bell, Share2, MoreVertical, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";

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

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as any).standalone));

const PwaInstallPrompt = () => {
  const { user } = useAuthContext();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  const browser = useMemo(detectBrowser, []);

  useEffect(() => {
    setInstalled(isStandalone());
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setModalOpen(false);
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
          setModalOpen(false);
        }
      } catch (e) {
        console.error(e);
      }
      setDeferredPrompt(null);
      return;
    }
    setModalOpen(true);
  };

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
    } catch (e) {
      console.error(e);
    }
  };

  const dismissModal = () => {
    setModalOpen(false);
    localStorage.setItem(STORAGE.dismissedAt, String(Date.now()));
  };

  if (installed) return null;

  return (
    <>
      {/* Persistent floating CTA */}
      <button
        onClick={handleInstall}
        aria-label="Add RBN App to Home Screen"
        className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/90 px-4 py-3 text-sm font-semibold text-primary-foreground shadow-2xl shadow-primary/30 ring-1 ring-primary/40 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-primary/50"
      >
        <Smartphone className="h-5 w-5" />
        <span className="hidden xs:inline sm:inline">Add RBN App</span>
        <span className="inline xs:hidden sm:hidden">Install</span>
      </button>

      {modalOpen && (
        <InstallModal
          browser={browser}
          notifPermission={notifPermission}
          canNativeInstall={!!deferredPrompt}
          onNativeInstall={handleInstall}
          onEnableNotifications={enableNotifications}
          onClose={dismissModal}
        />
      )}
    </>
  );
};

const InstallModal = ({
  browser,
  notifPermission,
  canNativeInstall,
  onNativeInstall,
  onEnableNotifications,
  onClose,
}: {
  browser: Browser;
  notifPermission: NotificationPermission;
  canNativeInstall: boolean;
  onNativeInstall: () => void;
  onEnableNotifications: () => void;
  onClose: () => void;
}) => {
  const steps = getSteps(browser);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm p-0 sm:items-center sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card shadow-2xl border border-border animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 px-6 pt-6 pb-8 text-primary-foreground rounded-t-3xl">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 rounded-full bg-white/15 p-1.5 text-primary-foreground hover:bg-white/25 transition"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center ring-1 ring-white/20">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] opacity-80">
                Install RBN
              </p>
              <h2 className="text-xl font-bold leading-tight">
                Install Rajput Business Network App
              </h2>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed opacity-95">
            Add RBN to your home screen for faster access, instant lead alerts,
            and seamless networking with the Rajput entrepreneur community.
          </p>
        </div>

        {/* Benefits */}
        <div className="px-6 pt-5">
          <ul className="grid gap-2 text-sm">
            {[
              "Connect instantly with Rajput entrepreneurs",
              "Receive lead updates & member notifications",
              "Quick access to Directory, Asks & Leads",
              "Stay in the community anytime, anywhere",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2 text-foreground">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Native install CTA */}
        {canNativeInstall && (
          <div className="px-6 pt-5">
            <Button onClick={onNativeInstall} className="w-full" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Install RBN App Now
            </Button>
          </div>
        )}

        {/* Browser-specific guide */}
        <div className="px-6 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            {steps.title}
          </p>
          <ol className="space-y-2.5">
            {steps.steps.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 text-sm text-foreground flex items-center gap-2">
                  {s.icon}
                  <span>{s.text}</span>
                </div>
              </li>
            ))}
          </ol>
          {steps.gu && (
            <p className="mt-3 text-xs text-muted-foreground italic">
              ગુજરાતી: {steps.gu}
            </p>
          )}
        </div>

        {/* Notifications */}
        <div className="px-6 pt-5 pb-6">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Enable Notifications
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get alerts for new leads, member requests, community asks &
                  admin announcements.
                </p>
                {notifPermission === "granted" ? (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <Check className="h-3 w-3" /> Notifications enabled
                  </p>
                ) : notifPermission === "denied" ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Blocked — enable from your browser settings.
                  </p>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={onEnableNotifications}
                  >
                    Allow Notifications
                  </Button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition"
          >
            Maybe later
          </button>
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
