import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, UserCog, Briefcase, Handshake, Bell, Settings, MessageCircleQuestion, Newspaper } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useT } from "@/i18n/LanguageProvider";
import renLogo from "@/assets/ren-logo.png";

import type { TranslationKey } from "@/i18n/translations";

type SidebarItem = {
  translationKey: TranslationKey;
  url: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

const baseItems: SidebarItem[] = [
  { translationKey: "dashboard.title", url: "/dashboard", icon: LayoutDashboard, end: true },
  { translationKey: "dashboard.leads", url: "/dashboard/leads", icon: Handshake },
  { translationKey: "dashboard.asks", url: "/dashboard/asks", icon: MessageCircleQuestion },
  { translationKey: "dashboard.news", url: "/dashboard/news", icon: Newspaper },
  { translationKey: "dashboard.notifications", url: "/dashboard/notifications", icon: Bell },
  { translationKey: "dashboard.profile", url: "/dashboard/profile", icon: UserCog },
  { translationKey: "dashboard.settings", url: "/dashboard/settings", icon: Settings },
  { translationKey: "dashboard.directory", url: "/dashboard/directory", icon: Briefcase },
];

const adminItems: SidebarItem[] = [
  { translationKey: "dashboard.applications" as TranslationKey, url: "/dashboard/applications", icon: FileText },
];

interface DashboardSidebarProps {
  role?: string | null;
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const t = useT();

  const normalizedRole = (role || "").toLowerCase();
  const isAdmin = normalizedRole === "admin" || normalizedRole === "super_admin";
  const items = isAdmin ? [...baseItems, ...adminItems] : baseItems;

  const isActive = (path: string, end?: boolean) =>
    end ? pathname === path : pathname === path || pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-3 py-4 border-b border-sidebar-border">
          <NavLink
            to="/"
            className={`group flex items-center ${collapsed ? "justify-center" : "gap-3"} rounded-xl px-2.5 py-2 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-sm shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.35)] hover:border-primary/40 hover:from-primary/10 hover:to-white/[0.03] transition-all duration-300`}
          >
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src={renLogo} alt="RBN" className="relative h-8 w-auto drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]" />
            </div>
            {!collapsed && (
              <span className="font-display font-bold text-base tracking-wide text-sidebar-foreground">
                RBN Portal
              </span>
            )}
          </NavLink>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.translationKey}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.end)}>
                    <NavLink to={item.url} end={item.end} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{t(item.translationKey)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default DashboardSidebar;