import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Users, ShieldCheck, Handshake, Megaphone, MessageCircleQuestion } from "lucide-react";
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

type Item = { title: string; url: string; icon: typeof LayoutDashboard; end?: boolean };

const baseItems: Item[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Review Applications", url: "/admin/applications", icon: FileText },
  { title: "Members", url: "/admin/members", icon: Users },
  { title: "Leads & Business", url: "/admin/leads", icon: Handshake },
  { title: "Asks", url: "/admin/asks", icon: MessageCircleQuestion },
  { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
];

const superAdminItems: Item[] = [
  { title: "Manage Roles", url: "/admin/manage-roles", icon: ShieldCheck },
];

interface AdminSidebarProps {
  role?: string | null;
}

export function AdminSidebar({ role }: AdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const isSuperAdmin = (role || "").toLowerCase() === "super_admin";
  const items = isSuperAdmin ? [...baseItems, ...superAdminItems] : baseItems;

  const isActive = (path: string, end?: boolean) =>
    end ? pathname === path : pathname === path || pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-3 py-4 border-b border-sidebar-border">
          <img src={renLogo} alt="REN" className="h-8 w-auto shrink-0" />
          {!collapsed && (
            <span className="font-display font-bold text-base text-sidebar-foreground">
              Admin Panel
            </span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
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

export default AdminSidebar;