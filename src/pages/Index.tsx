import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Users,
  Briefcase,
  Handshake,
  Calendar,
  Quote,
  Sparkles,
  ChevronRight,
  Shield,
  Crown,
  Network,
  Trophy,
  Globe2,
  Building2,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/public/PublicLayout";
import MemberCard from "@/components/public/MemberCard";
import heroHeritage from "@/assets/hero-heritage.jpg";
import heroBusiness from "@/assets/hero-business.jpg";
import heroHandshake from "@/assets/hero-handshake.jpg";
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

type SlideDef = {
  image: string;
  eyebrowKey: TranslationKey;
  titleKey: TranslationKey;
  accentKey: TranslationKey;
  descKey: TranslationKey;
};

const heroSlides: SlideDef[] = [
  {
    image: heroHeritage,
    eyebrowKey: "hero.s1.eyebrow",
    titleKey: "hero.s1.title",
    accentKey: "hero.s1.accent",
    descKey: "hero.s1.desc",
  },
  {
    image: heroBusiness,
    eyebrowKey: "hero.s2.eyebrow",
    titleKey: "hero.s2.title",
    accentKey: "hero.s2.accent",
    descKey: "hero.s2.desc",
  },
  {
    image: heroHandshake,
    eyebrowKey: "hero.s3.eyebrow",
    titleKey: "hero.s3.title",
    accentKey: "hero.s3.accent",
    descKey: "hero.s3.desc",
  },
];

const statDefs: { labelKey: TranslationKey; value: string; icon: any }[] = [
  { labelKey: "stats.members", value: "500+", icon: Users },
  { labelKey: "stats.businesses", value: "320+", icon: Briefcase },
  { labelKey: "stats.referrals", value: "1,200+", icon: Handshake },
  { labelKey: "stats.cities", value: "25+", icon: Globe2 },
];

const pillarDefs: { icon: any; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Crown, titleKey: "pillars.p1.title", descKey: "pillars.p1.desc" },
  { icon: Shield, titleKey: "pillars.p2.title", descKey: "pillars.p2.desc" },
  { icon: Network, titleKey: "pillars.p3.title", descKey: "pillars.p3.desc" },
  { icon: Trophy, titleKey: "pillars.p4.title", descKey: "pillars.p4.desc" },
];

const events = [
  { date: "May 18, 2026", title: "REN Mumbai Chapter — Monthly Meet", city: "Mumbai" },
  { date: "Jun 02, 2026", title: "Entrepreneurs Conclave 2026", city: "Jaipur" },
  { date: "Jun 21, 2026", title: "B2B Referral Mixer", city: "Bengaluru" },
];

const testimonials = [
  {
    quote:
      "REN opened doors to clients I would have never reached on my own. Pure trust, pure business.",
    name: "Vikram Singh Chauhan",
    role: "Founder, Chauhan Realty Group",
  },
  {
    quote:
      "From referrals to friendships — REN is the strongest entrepreneurial circle I'm part of.",
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

const industries = [
  "Manufacturing",
  "Real Estate",
  "Finance",
  "Technology",
  "Retail",
  "Trading",
  "Services",
  "Startups",
  "Travel",
  "Export / Import",
  "Hospitality",
  "Agriculture",
];


const sponsors: { category: string; name: string; logo: string }[] = [
  {
    category: "",
    name: "global compunet, Chalthan",
    logo: "https://fplogoimages.withfloats.com/actual/69c8cbb00a0740db5e86f3b3.jpeg",
  },
  {
    category: "",
    name: "Thinknlink AI Solution, Surat",
    logo: "https://www.thinknlink.in/lovable-uploads/ThinkNLink%20logo%20White.png",
  },
  {
    category: "",
    name: "Homeify Decor&Furnishing",
    logo: "https://scontent.famd21-1.fna.fbcdn.net/v/t39.30808-6/393154366_122095830638143504_3446062251949276181_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=K6X2S_ZxdW4Q7kNvwFx7fOA&_nc_oc=Adqq-wtUOyhNXKrMmYi_7uokVawLrC5HwYPJ92w8NT8021-6uoqNGc78vQxEzO6q9GENJUIdpEb0VeA3sn6goviL&_nc_zt=23&_nc_ht=scontent.famd21-1.fna&_nc_gid=FlYllgMglSbp3y0r6mXaBQ&_nc_ss=7b289&oh=00_Af4Ms2zLEqd4JFYI5CzO9DabxNxBZjl-ct4p-SPmZutSDQ&oe=69FA0D8F",
  },
  {
    category: "",
    name: "Get set fly",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQurHrPdL-zEBwcXzkqW-v74ILR9iFDisVbIw&s",
  },
];

const Index = () => {
  const t = useT();
  const [committeeMembers, setCommitteeMembers] = useState<Member[]>([]);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const fetchCommitteeMembers = async () => {
      try {
        const { data, error } = await supabase
          .from<CommitteeMemberRow>("members")
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
              business_categories(name)
            )
          `)
          .eq("status", "active")
          .not("committee_badge", "is", null)
          .neq("committee_badge", "")
          .limit(7);

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
              business: m.business_profiles?.business_name || "REN Member",
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
    const t = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <PublicLayout>
      {/* HERO CAROUSEL */}
      <section className="relative h-[92vh] min-h-[640px] w-full overflow-hidden bg-secondary text-card">
        {heroSlides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === slide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img
              src={s.image}
              alt={t(s.titleKey)}
              className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/70 to-secondary/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-transparent to-transparent" />
          </div>
        ))}

        {/* Decorative orbs */}
        <div className="absolute -top-40 -right-32 w-[28rem] h-[28rem] bg-primary/25 rounded-full blur-3xl pointer-events-none animate-float z-10" />
        <div className="absolute -bottom-40 -left-32 w-[28rem] h-[28rem] bg-primary/15 rounded-full blur-3xl pointer-events-none z-10" />

        {/* Content */}
        <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="max-w-3xl" key={slide}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-6 animate-fade-down border border-primary/30 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {t(heroSlides[slide].eyebrowKey)}
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-7xl leading-[1.05] tracking-tight animate-fade-up">
              {t(heroSlides[slide].titleKey)}{" "}
              <span className="text-gradient-royal block mt-2">
                {t(heroSlides[slide].accentKey)}
              </span>
            </h1>
            <p
              className="mt-6 text-lg sm:text-xl text-card/80 max-w-2xl leading-relaxed animate-fade-up"
              style={{ animationDelay: "150ms", opacity: 0 }}
            >
              {t(heroSlides[slide].descKey)}
            </p>
            <div
              className="mt-10 flex flex-wrap gap-3 animate-fade-up"
              style={{ animationDelay: "300ms", opacity: 0 }}
            >
              <Button asChild variant="royal" size="lg" className="animate-pulse-glow">
                <Link to="/signup">
                  {t("hero.cta.join")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-card/10 border-card/30 text-card hover:bg-card hover:text-secondary backdrop-blur-sm"
              >
                <Link to="/directory">{t("hero.cta.explore")}</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Slide controls */}
        <div className="absolute bottom-8 left-0 right-0 z-20 flex items-center justify-center gap-3">
          <button
            onClick={() => setSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length)}
            className="h-10 w-10 rounded-full bg-card/10 border border-card/30 backdrop-blur-sm flex items-center justify-center text-card hover:bg-primary hover:border-primary transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-2 rounded-full transition-all ${
                i === slide ? "w-10 bg-primary" : "w-2 bg-card/40 hover:bg-card/70"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
          <button
            onClick={() => setSlide((s) => (s + 1) % heroSlides.length)}
            className="h-10 w-10 rounded-full bg-card/10 border border-card/30 backdrop-blur-sm flex items-center justify-center text-card hover:bg-primary hover:border-primary transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* MARQUEE — sponsors */}
      <section className="bg-secondary text-card/70 border-y border-card/10 overflow-hidden py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <h2 className="text-lg font-semibold uppercase tracking-[0.25em] text-primary">
            Our key sponsors
          </h2>
        </div>
        <div className="flex gap-16 whitespace-nowrap animate-marquee px-4 sm:px-6 lg:px-8">
          {[...sponsors, ...sponsors].map((sponsor, i) => (
            <div
              key={i}
              className="flex items-center gap-4 text-sm font-semibold tracking-wider uppercase"
            >
              <span className="text-primary">{sponsor.category}</span>
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="h-8 w-auto object-contain rounded-sm"
              />
              <span>{sponsor.name}</span>
              <span className="text-primary text-lg">◆</span>
            </div>
          ))}
        </div>
      </section>

      {/* MARQUEE — chapters */}
      <section className="bg-secondary text-card/70 border-y border-card/10 overflow-hidden py-5">
        <div className="flex gap-12 whitespace-nowrap animate-marquee">
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-card rounded-2xl shadow-2xl border border-border p-6 animate-fade-up">
          {statDefs.map((s, i) => (
            <div
              key={s.labelKey}
              className="flex items-center gap-4 group animate-scale-in"
              style={{ animationDelay: `${i * 100}ms`, opacity: 0 }}
            >
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <s.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <div>
                <div className="font-display font-bold text-3xl text-secondary">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{t(s.labelKey)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            {t("pillars.eyebrow")}
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-secondary leading-tight">
            {t("pillars.heading")}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillarDefs.map((p, i) => (
            <div
              key={p.titleKey}
              className="group relative bg-card border border-border rounded-2xl p-7 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/40 transition-all duration-500 overflow-hidden"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full group-hover:bg-primary/15 transition-all duration-500" />
              <div className="relative">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--royal-gold))] flex items-center justify-center mb-5 group-hover:rotate-6 transition-transform duration-500 shadow-lg">
                  <p.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-xl text-secondary mb-2">{t(p.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(p.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INDUSTRIES STRIP */}
      <section className="bg-gradient-royal text-card py-20 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary rounded-full animate-spin-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-primary rounded-full animate-spin-slow" style={{ animationDirection: "reverse" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            {t("industries.eyebrow")}
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl mb-10">
            {t("industries.heading")}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {industries.map((ind, i) => (
              <span
                key={ind}
                className="px-5 py-2.5 rounded-full bg-card/10 border border-card/20 text-sm font-semibold backdrop-blur-sm hover:bg-primary hover:border-primary hover:scale-105 transition-all duration-300 cursor-default animate-fade-up"
                style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
              >
                {ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED MEMBERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-2">
              {t("featured.eyebrow")}
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-secondary leading-tight">
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {committeeMembers.map((m, i) => (
            <div
              key={m.id}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 150}ms`, opacity: 0 }}
            >
              <MemberCard member={m} />
            </div>
          ))}
        </div>
      </section>

      {/* EVENTS */}
      <section className="bg-muted/40 border-y border-border">
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
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
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
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
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
              <h3 className="font-display font-bold text-3xl sm:text-5xl mb-4 leading-tight">
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
  );
};

export default Index;
