import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogIn, UserPlus, LayoutDashboard, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import renLogo from "@/assets/ren-logo.png";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageProvider";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuthContext } from "@/context/AuthContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  const { user, loading } = useAuthContext();

  const navItems = [
    { to: "/", label: t("nav.home") },
    { to: "/directory", label: t("nav.directory") },
    { to: "/news", label: t("nav.news") },
    { to: "/events", label: t("nav.events") },
    { to: "/about", label: t("nav.about") },
    // { to: "/voice", label: t("nav.voice") },
  ];

  // Frosted header once the page scrolls, plus a gold reading-progress line.
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 8);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [location.pathname]);

  // Gliding pill: sits on the current page, follows the hovered link.
  const navRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const [layoutTick, setLayoutTick] = useState(0);
  const activeTo = navItems.find((i) =>
    i.to === "/" ? location.pathname === "/" : location.pathname.startsWith(i.to)
  )?.to;
  const pillTarget = hovered ?? activeTo;
  const labelsKey = navItems.map((i) => i.label).join("|");

  useLayoutEffect(() => {
    const el = pillTarget ? navRef.current?.querySelector<HTMLElement>(`[data-nav="${pillTarget}"]`) : null;
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [pillTarget, labelsKey, layoutTick]);

  useEffect(() => {
    const remeasure = () => setLayoutTick((n) => n + 1);
    window.addEventListener("resize", remeasure);
    document.fonts?.ready.then(remeasure);
    return () => window.removeEventListener("resize", remeasure);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/directory?q=${encodeURIComponent(term)}` : "/directory");
    setOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-500",
        scrolled
          ? "bg-card/80 border-border/60 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.35)]"
          : "bg-card/95 border-transparent"
      )}
    >
      <div
        ref={progressRef}
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-primary via-[hsl(var(--royal-gold))] to-primary"
        style={{ transform: "scaleX(0)" }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
            <img
              src={renLogo}
              alt="RBN — Rajput Business Network"
              className="h-10 lg:h-12 w-auto transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-105"
            />
            <div className="hidden sm:block leading-tight">
              <div className="font-wordmark font-bold text-2xl leading-none text-gradient-royal tracking-tight">{t("common.brand")}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("common.brandFull")}
              </div>
            </div>
          </Link>

          <nav
            ref={navRef}
            onMouseLeave={() => setHovered(null)}
            className="relative hidden lg:flex items-center gap-0.5 rounded-full border border-border/70 bg-muted/60 p-1"
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-primary to-[hsl(var(--royal-gold))] shadow-[0_6px_16px_-6px_hsl(var(--primary)/0.7)] transition-[left,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                pill && pillTarget ? "opacity-100" : "opacity-0"
              )}
              style={pill ? { left: pill.left, width: pill.width } : undefined}
            />
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                data-nav={item.to}
                onMouseEnter={() => setHovered(item.to)}
                onFocus={() => setHovered(item.to)}
                onBlur={() => setHovered(null)}
                className={cn(
                  "relative z-10 px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-300",
                  pillTarget === item.to ? "text-primary-foreground" : "text-secondary/80 hover:text-secondary"
                )}
              >
                {item.label}
                {/* Marks the current page while the pill is away on a hovered link */}
                {activeTo === item.to && pillTarget !== item.to && (
                  <span className="absolute left-1/2 bottom-0 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-xs mx-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search members…"
              className="pl-9 h-9 bg-background/70"
              aria-label="Search directory"
            />
          </form>

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
                <Button asChild variant="royal" size="sm" className="btn-shine rounded-full px-4">
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
              <form onSubmit={onSearch} className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search members…"
                  className="pl-9 h-10"
                  aria-label="Search directory"
                />
              </form>
              {navItems.map((item, i) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setOpen(false)}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className={({ isActive }) =>
                    cn(
                      "px-4 py-2.5 text-sm font-medium rounded-md transition-colors animate-soft-reveal motion-reduce:animate-none",
                      isActive
                        ? "text-primary-foreground bg-gradient-to-r from-primary to-[hsl(var(--royal-gold))]"
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