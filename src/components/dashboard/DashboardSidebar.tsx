import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, UserCog, Briefcase } from "lucide-react";
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
import renLogo from "@/assets/ren-logo.png";

type SidebarItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

const baseItems: SidebarItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "My Profile", url: "/dashboard/profile", icon: UserCog },
  { title: "Business Directory", url: "/dashboard/directory", icon: Briefcase },
];

const adminItems: SidebarItem[] = [
  { title: "Review Applications", url: "/dashboard/applications", icon: FileText },
];

interface DashboardSidebarProps {
  role?: string | null;
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const normalizedRole = (role || "").toLowerCase();
  const isAdmin = normalizedRole === "admin" || normalizedRole === "super_admin";
  const items = isAdmin ? [...baseItems, ...adminItems] : baseItems;

  const isActive = (path: string, end?: boolean) =>
    end ? pathname === path : pathname === path || pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-3 py-4 border-b border-sidebar-border">
          <img src={renLogo} alt="REN" className="h-8 w-auto shrink-0" />
          {!collapsed && (
            <span className="font-display font-bold text-base text-sidebar-foreground">
              REN Portal
            </span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.end)}>
                    <NavLink to={item.url} end={item.end} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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