import { NavLink, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Users, ShieldCheck, Handshake, Megaphone, MessageCircleQuestion, Newspaper, Tags, Pin, Award, Rss } from "lucide-react";
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
  { title: "Categories", url: "/admin/categories", icon: Tags },
  { title: "Leads & Business", url: "/admin/leads", icon: Handshake },
  { title: "Asks", url: "/admin/asks", icon: MessageCircleQuestion },
  { title: "1:1 Feed", url: "/admin/meetings", icon: Rss },
  { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
  { title: "Notice Board", url: "/admin/notice-board", icon: Pin },
  { title: "Sponsors", url: "/admin/sponsors", icon: Award },
  { title: "News & Stories", url: "/admin/newsletter", icon: Newspaper },
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
        <div className="px-3 py-4 border-b border-sidebar-border">
          <Link
            to="/"
            className={`group flex items-center ${collapsed ? "justify-center" : "gap-3"} rounded-xl px-2.5 py-2 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-sm shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.35)] hover:border-primary/40 hover:from-primary/10 hover:to-white/[0.03] transition-all duration-300`}
          >
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src={renLogo} alt="REN" className="relative h-8 w-auto drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]" />
            </div>
            {!collapsed && (
              <span className="font-display font-bold text-base tracking-wide text-sidebar-foreground">
                Admin Panel
              </span>
            )}
          </Link>
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