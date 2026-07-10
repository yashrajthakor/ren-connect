import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";
import renLogo from "@/assets/ren-logo.png";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuthContext();
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) return;

      // Fetch role via SECURITY DEFINER RPC (bypasses RLS recursion)
      let roleName = "member";
      try {
        const { data, error } = await supabase.rpc("get_current_user_role");
        if (error) console.error("get_current_user_role error:", error);
        else if (typeof data === "string" && data) roleName = data.toLowerCase();
      } catch (err) {
        console.error("Unexpected error fetching role:", err);
      }

      // console.log("ProtectedRoute - User role:", roleName); // Debug log
      setUserRole(roleName);
    };

    if (user) {
      fetchRole();
    } else {
      setUserRole(null);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-royal">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-white/20">
            <img src={renLogo} alt="RBN" className="h-12 w-12 rounded-full object-contain" />
          </div>
          <div className="h-6 w-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-card/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Redirect based on actual role
    if (userRole === "admin" || userRole === "super_admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
