import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import renLogo from "@/assets/ren-logo.png";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageProvider";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuthContext } from "@/context/AuthContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const t = useT();
  const { user, loading } = useAuthContext();

  const navItems = [
    { to: "/", label: t("nav.home") },
    { to: "/directory", label: t("nav.directory") },
    { to: "/key-moments", label: t("nav.keyMoments") },
    { to: "/about", label: t("nav.about") },
    { to: "/voice", label: t("nav.voice") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/85 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
            <img src={renLogo} alt="REN — Rajput Entrepreneur Network" className="h-10 lg:h-12 w-auto" />
            <div className="hidden sm:block leading-tight">
              <div className="font-display font-bold text-lg text-secondary tracking-tight">{t("common.brand")}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("common.brandFull")}
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-secondary/80 hover:text-primary hover:bg-accent",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <LanguageSwitcher className="mr-1" />
            {loading ? (
              <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : user ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  {t("nav.dashboard")}
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">
                    <LogIn className="h-4 w-4" />
                    {t("nav.login")}
                  </Link>
                </Button>
                <Button asChild variant="royal" size="sm">
                  <Link to="/signup">
                    <UserPlus className="h-4 w-4" />
                    {t("nav.join")}
                  </Link>
                </Button>
              </>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              className="p-2 rounded-md text-secondary hover:bg-accent"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden pb-4 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-secondary/80 hover:text-primary hover:bg-accent",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="flex gap-2 pt-3 border-t border-border mt-2">
                {loading ? (
                  <div className="flex-1 flex justify-center">
                    <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : user ? (
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to="/dashboard" onClick={() => setOpen(false)}>
                      <LayoutDashboard className="h-4 w-4" />
                      {t("nav.dashboard")}
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to="/login" onClick={() => setOpen(false)}>
                        <LogIn className="h-4 w-4" />
                        {t("nav.loginShort")}
                      </Link>
                    </Button>
                    <Button asChild variant="royal" size="sm" className="flex-1">
                      <Link to="/signup" onClick={() => setOpen(false)}>
                        <UserPlus className="h-4 w-4" />
                        {t("nav.join")}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;