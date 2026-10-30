import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Quote,
  ChevronRight,
  Crown,
  Search,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PublicLayout from "@/components/public/PublicLayout";
import MemberCard from "@/components/public/MemberCard";
import CoreTeamCarousel from "@/components/public/CoreTeamCarousel";
import LatestStoriesSection from "@/components/public/LatestStoriesSection";
import NoticeTicker from "@/components/notices/NoticeTicker";
import NoticeBoardSection from "@/components/notices/NoticeBoardSection";
import SponsorsSection from "@/components/public/SponsorsSection";
import InstagramShowcase from "@/components/public/InstagramShowcase";
import HeroSection, { type HeroStat } from "@/components/public/landing/HeroSection";
import RbnCodeSection from "@/components/public/landing/RbnCodeSection";
import IndustriesMarquee from "@/components/public/landing/IndustriesMarquee";
import { useT } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import { supabase } from "@/integrations/supabase/client";
import type { Member } from "@/data/members";

type CommitteeMemberRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  profile_picture?: string | null;
  committee_badge?: string | null;
  cities?: { name?: string | null } | null;
  business_profiles?: {
    business_name?: string | null;
    category_id?: string | null;
    city?: string | null;
    website?: string | null;
    services?: string | null;
    logo?: string | null;
    linkedin_url?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    business_categories?: { name?: string | null } | null;
  } | null;
};

/** ₹ amounts in the Indian short form used across RBN: 2.5Cr, 40L, 75,000. */
const formatVolume = (amount: number): string => {
  if (amount >= 1e7) return `₹${+(amount / 1e7).toFixed(1)}Cr+`;
  if (amount >= 1e5) return `₹${+(amount / 1e5).toFixed(1)}L+`;
  return `₹${amount.toLocaleString("en-IN")}+`;
};

const events = [
  { date: "May 18, 2026", title: "RBN Mumbai Chapter — Monthly Meet", city: "Mumbai" },
  { date: "Jun 02, 2026", title: "RBN Entrepreneurs Conclave 2026", city: "Jaipur" },
  { date: "Jun 21, 2026", title: "RBN B2B Referral Mixer", city: "Bengaluru" },
];

const testimonials = [
  {
    quote:
      "RBN opened doors to clients I would have never reached on my own. Pure trust, pure business.",
    name: "Vikram Singh Chauhan",
    role: "Founder, Chauhan Realty Group",
  },
  {
    quote:
      "From referrals to friendships — RBN is the strongest entrepreneurial circle I'm part of.",
    name: "Karan Singh Shekhawat",
    role: "CEO, Shekhawat Tech Labs",
  },
  {
    quote:
      "The Rajput code of honour translated into business — every connection here means something.",
    name: "Aditya Pratap Sisodia",
    role: "MD, Sisodia Capital Advisors",
  },
];


const Index = () => {
  const t = useT();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<string>("");
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<HeroStat[]>([
    { labelKey: "stats.members", value: "0+" },
    { labelKey: "stats.businesses", value: "0+" },
    { labelKey: "stats.referrals", value: "0+" },
    { labelKey: "stats.volume", value: "₹0+" },
  ]);

  useEffect(() => {
    const fetchCommitteeMembers = async () => {
      try {
        const { data, error } = await (supabase
          .from("members") as any)
          .select(`
            id,
            full_name,
            email,
            phone,
            profile_picture,
            committee_badge,
            cities(name),
            business_profiles(
              business_name,
              category_id,
              city,
              website,
              services,
              logo,
              linkedin_url,
              instagram_url,
              facebook_url,
              business_categories!business_profiles_category_id_fkey(name)
            )
          `)
          .eq("status", "active")
          .not("committee_badge", "is", null)
          .neq("committee_badge", "")
          .limit(10);

        if (error) {
          console.error("Error fetching committee members:", error);
          return;
        }

        if (data) {
          const mapped: Member[] = data.map((m) => {
            const fullName = m.full_name || "";
            const initials = fullName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "RM";
            const rawServices = m.business_profiles?.services;
            const servicesArr: string[] = rawServices
              ? String(rawServices)
                  .split(/[\n,]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .slice(0, 6)
              : [];

            return {
              id: m.id,
              name: fullName,
              business: m.business_profiles?.business_name || "RBN Member",
              category: m.business_profiles?.business_categories?.name || "Member",
              city: m.business_profiles?.city || m.cities?.name || "—",
              services: servicesArr,
              email: m.email || "—",
              phone: m.phone || "—",
              address: m.business_profiles?.city || "",
              initials,
              avatarUrl: m.profile_picture || m.business_profiles?.logo || null,
              committeeBadge: m.committee_badge || null,
            };
          });
          setCommitteeMembers(mapped);
        }
      } catch (error) {
        console.error("Unexpected error fetching committee members:", error);
      }
    };

    fetchCommitteeMembers();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: membersCount } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active');
        const { count: businessesCount } = await supabase.from('business_profiles').select('*', { count: 'exact', head: true });
        const { count: leadsCount } = await supabase.from('business_closures').select('*', { count: 'exact', head: true });
        const { data: volumeData } = await supabase.from('business_closures').select('amount');
        const volume = volumeData?.reduce((sum, bc) => sum + (bc.amount || 0), 0) || 0;
        setStats([
          { labelKey: "stats.members", value: `${membersCount || 0}+` },
          { labelKey: "stats.businesses", value: `${businessesCount || 0}+` },
          { labelKey: "stats.referrals", value: `${leadsCount || 0}+` },
          { labelKey: "stats.volume", value: formatVolume(volume) },
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("business_categories").select("name").order("name").limit(60);
      if (data) setAllCategories(data.map((c: any) => c.name).filter(Boolean));
    })();
  }, []);

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (searchCategory) params.set("category", searchCategory);
    const qs = params.toString();
    navigate(qs ? `/directory?${qs}` : "/directory");
  };

  const quickChips = ["Real Estate", "Finance", "Technology", "Manufacturing", "Retail", "Hospitality"];

  return (
    <>
      <Helmet>
        <title>RBN | Rajput Business Network — Heritage, Honor & Enterprise</title>
        <meta name="description" content="Join India's exclusive Rajput Business Network. Connect with verified entrepreneurs, share referrals, and build legacy across industries and cities." />
        <link rel="canonical" href="https://rajputbusinessnetwork.com/" />
        <meta property="og:title" content="RBN | Rajput Business Network" />
        <meta property="og:description" content="India's exclusive network for Rajput business professionals and entrepreneurs." />
        <meta property="og:url" content="https://rajputbusinessnetwork.com/" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "RBN | Rajput Business Network",
          url: "https://rajputbusinessnetwork.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://rajputbusinessnetwork.com/directory?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        })}</script>
      </Helmet>
    <PublicLayout>
      {/* Ticker + hero fill exactly one screen below the navbar (h-16 mobile, h-20 desktop) */}
      <div className="flex flex-col min-h-[calc(100svh-4rem)] lg:h-[calc(100svh-5rem)] lg:min-h-[34rem]">
        <NoticeTicker />
        <HeroSection stats={stats} className="flex-1" />
      </div>

      {/* NOTICE BOARD */}
      <NoticeBoardSection
        title="Community Notice Board"
        subtitle="Upcoming meetings, events, and important updates"
        limit={6}
      />

      {/* OUR PROUD SPONSORS */}
      <SponsorsSection />
      {/* THE RBN CODE */}
      <RbnCodeSection />

      {/* SEARCH DIRECTORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="relative bg-card rounded-2xl shadow-xl border border-border p-6 sm:p-8 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-2">
                  Find a Member
                </p>
                <h2 className="font-wordmark font-semibold text-3xl sm:text-4xl text-secondary leading-tight">
                  Search the RBN Directory
                </h2>
              </div>
              <Link
                to="/directory"
                className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 group"
              >
                Browse all
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <form onSubmit={submitSearch} className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, business, category, city, or service"
                  className="pl-12 h-12"
                  aria-label="Search directory members"
                />
              </div>
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="h-12 px-4 rounded-md border border-input bg-background text-sm text-foreground md:w-56"
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Button type="submit" variant="royal" size="lg" className="h-12">
                <Search className="h-4 w-4" /> Search
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">Quick:</span>
              {quickChips.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => navigate(`/directory?category=${encodeURIComponent(c)}`)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-primary hover:text-primary-foreground border border-border transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-2">
              {t("featured.eyebrow")}
            </p>
            <h2 className="font-wordmark font-semibold text-4xl sm:text-6xl text-secondary leading-[1.02]">
              {t("featured.heading")}
            </h2>
          </div>
          <Link
            to="/directory"
            className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 group"
          >
            {t("featured.viewAll")}
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <CoreTeamCarousel members={committeeMembers} />
      {/* FEATURED MEMBERS */}
      </section>

    
     
      {/* INDUSTRIES */}
      <IndustriesMarquee />

      {/* INSTAGRAM SHOWCASE */}
      <InstagramShowcase />

      {/* EVENTS */}
      {/* <section className="bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 animate-slide-in-left" style={{ opacity: 0 }}>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
                {t("events.eyebrow")}
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-5xl text-secondary mb-4 leading-tight">
                {t("events.heading")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("events.desc")}
              </p>
              <Button asChild variant="royal" className="mt-6">
                <Link to="/key-moments">{t("events.viewAll")} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="lg:col-span-8 space-y-3">
              {events.map((e, i) => (
                <div
                  key={e.title}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-xl px-5 py-5 hover:border-primary/50 hover:translate-x-2 transition-all duration-300 animate-slide-in-right"
                  style={{ animationDelay: `${i * 120}ms`, opacity: 0 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-primary to-[hsl(var(--royal-gold))] flex items-center justify-center shrink-0 shadow-md">
                      <Calendar className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {e.date} · {e.city}
                      </p>
                      <p className="font-semibold text-secondary text-lg">{e.title}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">{t("events.rsvp")}</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section> */}

      {/* TESTIMONIALS */}
      {/* <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            {t("testi.eyebrow")}
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-secondary leading-tight">
            {t("testi.heading")}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="relative bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-fade-up"
              style={{ animationDelay: `${i * 150}ms`, opacity: 0 }}
            >
              <Quote className="absolute top-6 right-6 h-10 w-10 text-primary/15" />
              <p className="text-secondary leading-relaxed">"{t.quote}"</p>
              <div className="mt-6 pt-6 border-t border-border flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--royal-gold))] flex items-center justify-center font-display font-bold text-primary-foreground">
                  {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="font-semibold text-secondary">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section> */}

      {/* CTA */}
      <LatestStoriesSection />

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-royal text-card p-10 sm:p-16">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/30 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-5 border border-primary/30">
                <Crown className="h-3.5 w-3.5" /> {t("cta.badge")}
              </div>
              <h3 className="font-wordmark font-semibold text-4xl sm:text-6xl mb-4 leading-[1.02]">
                {t("cta.heading")}
              </h3>
              <p className="text-card/75 max-w-lg text-lg">
                {t("cta.desc")}
              </p>
            </div>
            <div className="flex md:justify-end gap-3">
              <Button asChild variant="royal" size="lg" className="animate-pulse-glow">
                <Link to="/signup">{t("cta.apply")} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-card/10 border-card/30 text-card hover:bg-card hover:text-secondary backdrop-blur-sm"
              >
                <Link to="/about">{t("cta.learn")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
    </>
  );
};

export default Index;
