import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Index from "./Index";
import { supabase } from "@/integrations/supabase/client";

export function RootRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    // Check if app is installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsPwaInstalled(true);
    }
    // Fallback: check for installation event
    window.addEventListener("beforeinstallprompt", () => {
      setIsPwaInstalled(true);
    });
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    })();
  }, []);

  if (isAuthenticated === null) {
    return <div />;
  }

  // If app is installed or authenticated, redirect to leads dashboard
  if (isPwaInstalled || isAuthenticated) {
    return <Navigate to="/dashboard/leads" replace />;
  }

  // Otherwise show the public index page
  return <Index />;
}

export default RootRoute;
