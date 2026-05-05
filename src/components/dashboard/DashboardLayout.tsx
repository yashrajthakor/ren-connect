import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "./DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRoleLoading(false);
        return;
      }
      setUserEmail(user.email || "");
      try {
        const { data, error } = await supabase.rpc("get_current_user_role");
        if (error) console.error("get_current_user_role error:", error);
        setUserRole((data as string | null) ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setRoleLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been successfully signed out." });
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar role={userRole} />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b border-border bg-card px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="hidden sm:inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold">
                Member Mode
              </span>
            </div>
            <div className="flex items-center gap-4">
              {(userRole?.toLowerCase() === "admin" || userRole?.toLowerCase() === "super_admin") && (
                <Button variant="default" size="sm" onClick={() => navigate("/admin")}>
                  <Shield className="h-4 w-4 mr-2" />
                  Switch to Admin Mode
                </Button>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{userEmail}</p>
                <p className="text-xs text-primary font-medium capitalize">
                  {roleLoading
                    ? "Loading..."
                    : userRole
                    ? userRole.replace("_", " ")
                    : "No role assigned"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;