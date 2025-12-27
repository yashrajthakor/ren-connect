import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Shield, MapPin, Users, Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import renLogo from "@/assets/ren-logo.png";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        
        const { data: roles } = await supabase
          .from("user_roles")
          .select("roles(name)")
          .eq("user_id", user.id);
        
        const roleName = (roles?.[0] as any)?.roles?.name || "admin";
        setUserRole(roleName);
      }
    };
    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/login");
  };

  const actionCards = [
    {
      title: "Add City",
      description: "Create a new city location",
      icon: MapPin,
      href: "/admin/cities",
    },
    {
      title: "Add Chapter",
      description: "Create a new chapter",
      icon: Building2,
      href: "/admin/chapters",
    },
    {
      title: "Add Member",
      description: "Register a new member",
      icon: Users,
      href: "/admin/members",
    },
  ];

  const stats = [
    { label: "Total Cities", value: "--", icon: MapPin },
    { label: "Total Chapters", value: "--", icon: Building2 },
    { label: "Total Members", value: "--", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src={renLogo} alt="REN" className="h-10 w-auto" />
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-display font-bold text-lg text-foreground">
                  Admin Panel
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{userEmail}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole.replace("_", " ")}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage cities, chapters, and members
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {actionCards.map((card) => (
            <button
              key={card.title}
              onClick={() => navigate(card.href)}
              className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <card.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{card.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Admin;
