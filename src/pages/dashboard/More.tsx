import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageCircleQuestion,
  UserCog,
  Bell,
  Settings,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Lock,
  Smartphone,
} from "lucide-react";
import { openPwaInstall, isPwaStandalone } from "@/components/PwaInstallPrompt";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/i18n/LanguageProvider";
import { useMemberStatus } from "@/hooks/useMemberStatus";
import { toast as sonnerToast } from "sonner";
import type { TranslationKey } from "@/i18n/translations";

type MenuItem = {
  translationKey: TranslationKey;
  description: string;
  url: string;
  icon: typeof LayoutDashboard;
  restrictedForPending?: boolean;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const More = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useT();
  const { isPending } = useMemberStatus();

  const [fullName, setFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [appInstalled, setAppInstalled] = useState<boolean>(() => isPwaStandalone());

  useEffect(() => {
    const onInstalled = () => setAppInstalled(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || "");
      try {
        const [{ data: role }, { data: profile }] = await Promise.all([
          supabase.rpc("get_current_user_role"),
          supabase.rpc("get_my_profile"),
        ]);
        setUserRole((role as string | null) ?? null);
        const prof = profile as { full_name?: string | null; profile_picture?: string | null; profile_image?: string | null } | null;
        if (prof) {
          setFullName(prof.full_name || "");
          setAvatarUrl(prof.profile_picture || prof.profile_image || null);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const normalizedRole = (userRole || "").toLowerCase();
  const isAdmin = normalizedRole === "admin" || normalizedRole === "super_admin";

  const sections: MenuSection[] = [
    {
      title: "Community",
      items: [
        {
          translationKey: "dashboard.title",
          description: "Notice board & quick links",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          translationKey: "dashboard.asks",
          description: "Post & browse asks",
          url: "/dashboard/asks",
          icon: MessageCircleQuestion,
          restrictedForPending: true,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          translationKey: "dashboard.profile",
          description: "View & edit your details",
          url: "/dashboard/profile",
          icon: UserCog,
        },
        {
          translationKey: "dashboard.notifications",
          description: "Alerts & activity updates",
          url: "/dashboard/notifications",
          icon: Bell,
        },
        {
          translationKey: "dashboard.settings",
          description: "Password, language & preferences",
          url: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "Admin",
            items: [
              {
                translationKey: "dashboard.applications" as TranslationKey,
                description: "Approve new member requests",
                url: "/dashboard/applications",
                icon: FileText,
              },
            ],
          },
        ]
      : []),
  ];

  const handleItemClick = (item: MenuItem) => {
    if (item.restrictedForPending && isPending) {
      sonnerToast.info("Profile under review", {
        description: "This feature will be enabled once an admin approves your profile.",
      });
    }
    navigate(item.url);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been successfully signed out." });
    navigate("/login");
  };

  const initials = (fullName || userEmail || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard/profile")}
        className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left shadow-sm hover:shadow-md transition-shadow"
      >
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarImage src={avatarUrl || undefined} alt={fullName || userEmail} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground truncate">{fullName || t("dashboard.profile")}</p>
          <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
          {userRole && (
            <span className="mt-1 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
              {userRole.replace("_", " ")}
            </span>
          )}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </button>

      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {section.items.map((item) => (
              <button
                key={item.url}
                type="button"
                onClick={() => handleItemClick(item)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted"
              >
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{t(item.translationKey)}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
                {item.restrictedForPending && isPending ? (
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!appInstalled && (
        <div>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            App
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <button
              type="button"
              onClick={openPwaInstall}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted"
            >
              <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">Install RBN App</p>
                <p className="text-xs text-muted-foreground truncate">
                  Faster access & instant notifications
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isAdmin && (
          <Button variant="default" className="w-full" onClick={() => navigate("/admin")}>
            <Shield className="mr-2 h-4 w-4" />
            Switch to Admin Mode
          </Button>
        )}
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default More;
