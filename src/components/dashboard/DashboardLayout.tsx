import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Shield, Handshake, Briefcase, Newspaper, Rss, LayoutDashboard, MoreVertical } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "./DashboardSidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import PendingApprovalBanner from "./PendingApprovalBanner";
import ApprovalToastListener from "./ApprovalToastListener";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { useT } from "@/i18n/LanguageProvider";
import { MemberStatusProvider } from "@/context/MemberStatusContext";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useT();
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  // Enable push notifications for dashboard
  usePushNotifications();

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

  const location = useLocation();
  const isMobile = useIsMobile();

  const tabIcon = "h-5 w-5 md:h-6 md:w-6";
  const mobileTabs: { label: string; url: string; icon: JSX.Element; matchUrls?: string[]; iconOnly?: boolean }[] = [
    { label: t("mobileNav.dashboard"), url: "/dashboard", icon: <LayoutDashboard className={tabIcon} /> },
    { label: t("mobileNav.feed"), url: "/dashboard/meetings", icon: <Rss className={tabIcon} /> },
    { label: t("mobileNav.leads"), url: "/dashboard/leads", icon: <Handshake className={tabIcon} /> },
    { label: t("mobileNav.directory"), url: "/dashboard/directory", icon: <Briefcase className={tabIcon} /> },
    { label: t("mobileNav.news"), url: "/dashboard/news", icon: <Newspaper className={tabIcon} /> },
    {
      label: t("mobileNav.more"),
      url: "/dashboard/more",
      icon: <MoreVertical className={tabIcon} />,
      iconOnly: true,
      // Secondary routes reachable from the Profile & More screen
      matchUrls: [
        "/dashboard/profile",
        "/dashboard/settings",
        "/dashboard/notifications",
        "/dashboard/asks",
        "/dashboard/applications",
      ],
    },
  ];

  const isActive = (url: string, end?: boolean) =>
    end ? location.pathname === url : location.pathname === url || location.pathname.startsWith(url + "/");

  const isTabActive = (tab: (typeof mobileTabs)[number]) =>
    isActive(tab.url, tab.url === "/dashboard") ||
    (tab.matchUrls?.some((url) => isActive(url)) ?? false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been successfully signed out." });
    navigate("/login");
  };

  return (
    <MemberStatusProvider>
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <DashboardSidebar role={userRole} />
        <div className="flex-1 flex flex-col min-w-0">
          <ApprovalToastListener />
          <header className="h-16 flex items-center justify-between border-b border-border bg-card px-3 sm:px-4 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Sidebar exists only on desktop; below lg the bottom nav + More cover navigation. */}
              <SidebarTrigger className="hidden lg:flex" />
              <span className="hidden sm:inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold">
                Member Mode
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <NotificationBell />
              {(userRole?.toLowerCase() === "admin" || userRole?.toLowerCase() === "super_admin") && (
                <Button variant="default" size="sm" onClick={() => navigate("/admin")} className="px-2 sm:px-3">
                  <Shield className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Switch to Admin Mode</span>
                </Button>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{userEmail}</p>
                {!roleLoading && !!userRole?.trim() && (
                  <p className="text-xs text-primary font-medium capitalize">
                    {userRole.replace("_", " ")}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="px-2 sm:px-3">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </header>
          <PendingApprovalBanner />
          <main className="flex-1 pb-24 lg:pb-8 overflow-x-hidden">
            <Outlet />
          </main>
          {isMobile && (
            <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm px-1.5 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:px-4 md:py-2 lg:hidden">
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-1 md:gap-2">
                {mobileTabs.map((item) => (
                  <Link
                    key={item.url}
                    to={item.url}
                    aria-label={item.label}
                    className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] font-semibold leading-tight tracking-tight transition-all md:py-2 md:text-xs ${
                      item.iconOnly ? "w-10 shrink-0 self-stretch md:w-12" : "min-w-0 flex-1 px-0.5"
                    } ${
                      isTabActive(item)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {item.icon}
                    {!item.iconOnly && (
                      <span className="mt-0.5 max-w-full truncate text-center">{item.label}</span>
                    )}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </div>
    </SidebarProvider>
    </MemberStatusProvider>
  );
};

export default DashboardLayout;