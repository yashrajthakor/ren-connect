import { useEffect, useState } from "react";
import { ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as any).standalone);

    if (isStandalone) {
      setVisible(false);
      setDeferredPrompt(null);
    } else if (isIos() && !deferredPrompt) {
      setVisible(true);
    }
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowInstructions(true);
      return;
    }

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      <button
        className="fixed bottom-6 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-2xl shadow-primary/20 transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-primary/95"
        onClick={handleInstall}
      >
        <ArrowDownCircle className="h-5 w-5" />
        Add to Home Screen
      </button>

      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl border border-border">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  Install REN
                </p>
                <h2 className="mt-3 text-xl font-bold text-secondary">Add to Home Screen</h2>
              </div>
              <button
                className="text-secondary/80 hover:text-secondary"
                onClick={() => setShowInstructions(false)}
                aria-label="Close install instructions"
              >
                ×
              </button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Tap the browser share menu and choose <strong>Add to Home Screen</strong> to install REN.
            </p>
            <div className="mt-5 rounded-2xl border border-border bg-muted p-4 text-sm text-secondary">
              <p className="mb-2 font-semibold">Mobile install quick steps</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Tap the browser menu</li>
                <li>Select <strong>Add to Home Screen</strong></li>
                <li>Confirm and open the app from your home screen</li>
              </ol>
            </div>
            <Button className="mt-5 w-full" onClick={() => setShowInstructions(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default PwaInstallPrompt;
