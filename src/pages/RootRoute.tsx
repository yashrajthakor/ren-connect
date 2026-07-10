import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { isPwaStandalone } from "@/components/PwaInstallPrompt";
import Index from "./Index";

export function RootRoute() {
  const { user, loading } = useAuthContext();

  // Installed app: land signed-in members directly in the Business Directory.
  // Regular browser visits keep the public homepage.
  if (isPwaStandalone()) {
    if (loading) return null; // splash overlay covers this moment
    if (user) return <Navigate to="/dashboard/directory" replace />;
  }

  return <Index />;
}

export default RootRoute;
