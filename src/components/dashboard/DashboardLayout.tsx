import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
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
        // Join user_roles -> roles to get the actual role name from the DB
        const { data: ur, error: urErr } = await supabase
          .from("user_roles")
          .select("role_id, roles(name)")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        if (urErr) console.error("user_roles fetch error:", urErr);
        const roleName =
          (ur as any)?.roles?.name ??
          (Array.isArray((ur as any)?.roles) ? (ur as any).roles[0]?.name : null);
        setUserRole(roleName ?? null);
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
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-4">
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