import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        setUser(user);

        // Fetch user role safely (role_id -> roles.name)
        let roleName = "member";
        try {
          const { data: ur, error: urError } = await supabase
            .from("user_roles")
            .select("role_id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

          if (urError) {
            console.error("Error fetching user_roles:", urError);
            setLoading(false);
            return;
          }

          if (ur?.role_id) {
            const { data: roleData, error: roleFetchError } = await supabase
              .from("roles")
              .select("name")
              .eq("id", ur.role_id)
              .limit(1)
              .maybeSingle();

            if (roleFetchError) {
              console.error("Error fetching role name:", roleFetchError);
            } else if (roleData?.name) {
              roleName = (roleData.name as string).toLowerCase();
            }
          }
        } catch (err) {
          console.error("Unexpected error fetching role:", err);
        }

        console.log("ProtectedRoute - User role:", roleName); // Debug log
        setUserRole(roleName);
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-royal">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
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
    return <Navigate to="/member" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
