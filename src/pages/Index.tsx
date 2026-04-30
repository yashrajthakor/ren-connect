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
import { members } from "@/data/members";
import heroHeritage from "@/assets/hero-heritage.jpg";
import heroBusiness from "@/assets/hero-business.jpg";
import heroHandshake from "@/assets/hero-handshake.jpg";

const heroSlides = [
  {
    image: heroHeritage,
    eyebrow: "Heritage. Honor. Hustle.",
    title: "Connecting Rajput Entrepreneurs.",
    accent: "Building Legacy Through Business.",
    desc:
      "REN unites Rajput founders, business owners and professionals across India — built on trust, referrals and shared ambition.",
  },
  {
    image: heroBusiness,
    eyebrow: "Business Beyond Brotherhood",
    title: "Where Warriors Become",
    accent: "Wealth Creators.",
    desc:
      "From boardrooms to chapter meets — collaborate with India's most ambitious Rajput entrepreneurs and grow together.",
  },
  {
    image: heroHandshake,
    eyebrow: "Trust is our Currency",
    title: "One Network. One Word.",
    accent: "Endless Opportunities.",
    desc:
      "Verified members, qualified referrals, and lifelong relationships built on the Rajput code of honour.",
  },
];

const stats = [
  { label: "Members", value: "500+", icon: Users },
  { label: "Businesses", value: "320+", icon: Briefcase },
  { label: "Referrals", value: "1,200+", icon: Handshake },
  { label: "Cities", value: "25+", icon: Globe2 },
];

const pillars = [
  {
    icon: Crown,
    title: "Royal Legacy",
    desc: "Carry forward the Rajput tradition of honour, valour and trust into modern enterprise.",
  },
  {
    icon: Shield,
    title: "Verified Trust",
    desc: "Every member is invited and vetted — do business with people you can rely on.",
  },
  {
    icon: Network,
    title: "Powerful Network",
    desc: "Connect across cities, industries and chapters — referrals that actually convert.",
  },
  {
    icon: Trophy,
    title: "Growth Together",
    desc: "Mentorship, masterminds, and exclusive events to scale your business faster.",
  },
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

const chapters = [
  "Jaipur",
  "Jodhpur",
  "Udaipur",
  "Mumbai",
  "Pune",
  "Bengaluru",
  "Ahmedabad",
  "Surat",
  "Delhi NCR",
  "Hyderabad",
  "Indore",
  "Jaisalmer",
];

const Index = () => {
  const featured = members.filter((m) => m.featured).slice(0, 3);
  const [slide, setSlide] = useState(0);

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
              alt={s.title}
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
              {heroSlides[slide].eyebrow}
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-7xl leading-[1.05] tracking-tight animate-fade-up">
              {heroSlides[slide].title}{" "}
              <span className="text-gradient-royal block mt-2">
                {heroSlides[slide].accent}
              </span>
            </h1>
            <p
              className="mt-6 text-lg sm:text-xl text-card/80 max-w-2xl leading-relaxed animate-fade-up"
              style={{ animationDelay: "150ms", opacity: 0 }}
            >
              {heroSlides[slide].desc}
            </p>
            <div
              className="mt-10 flex flex-wrap gap-3 animate-fade-up"
              style={{ animationDelay: "300ms", opacity: 0 }}
            >
              <Button asChild variant="royal" size="lg" className="animate-pulse-glow">
                <Link to="/signup">
                  Join REN <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-card/10 border-card/30 text-card hover:bg-card hover:text-secondary backdrop-blur-sm"
              >
                <Link to="/directory">Explore Directory</Link>
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

      {/* MARQUEE — chapters */}
      <section className="bg-secondary text-card/70 border-y border-card/10 overflow-hidden py-5">
        <div className="flex gap-12 whitespace-nowrap animate-marquee">
          {[...chapters, ...chapters].map((c, i) => (
            <div key={i} className="flex items-center gap-3 text-sm font-semibold tracking-wider uppercase">
              <Building2 className="h-4 w-4 text-primary" />
              REN {c} Chapter
              <span className="text-primary">◆</span>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-card rounded-2xl shadow-2xl border border-border p-6 animate-fade-up">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="flex items-center gap-4 group animate-scale-in"
              style={{ animationDelay: `${i * 100}ms`, opacity: 0 }}
            >
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <s.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <div>
                <div className="font-display font-bold text-3xl text-secondary">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            The REN Code
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-secondary leading-tight">
            Four pillars that power our network
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, i) => (
            <div
              key={p.title}
              className="group relative bg-card border border-border rounded-2xl p-7 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/40 transition-all duration-500 overflow-hidden"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full group-hover:bg-primary/15 transition-all duration-500" />
              <div className="relative">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--royal-gold))] flex items-center justify-center mb-5 group-hover:rotate-6 transition-transform duration-500 shadow-lg">
                  <p.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-xl text-secondary mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
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
            Every Industry. One Brotherhood.
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl mb-10">
            Diversified strength across sectors
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
              Featured Entrepreneurs
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-secondary leading-tight">
              Meet the leaders driving<br />REN forward
            </h2>
          </div>
          <Link
            to="/directory"
            className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 group"
          >
            View full directory
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((m, i) => (
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
                Upcoming
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-5xl text-secondary mb-4 leading-tight">
                Events &amp; meetings
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Join chapter meets, conclaves and exclusive networking events curated for serious
                Rajput entrepreneurs.
              </p>
              <Button asChild variant="royal" className="mt-6">
                <Link to="/key-moments">View all events <ArrowRight className="h-4 w-4" /></Link>
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
                  <Button variant="outline" size="sm">RSVP</Button>
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
            Voice of REN
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-secondary leading-tight">
            Trusted by entrepreneurs across India
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
                <Crown className="h-3.5 w-3.5" /> Invitation Only
              </div>
              <h3 className="font-display font-bold text-3xl sm:text-5xl mb-4 leading-tight">
                Ready to join the<br />Rajput business elite?
              </h3>
              <p className="text-card/75 max-w-lg text-lg">
                Build trust. Share referrals. Grow legacy. Take your place in India's most
                ambitious Rajput entrepreneurial network.
              </p>
            </div>
            <div className="flex md:justify-end gap-3">
              <Button asChild variant="royal" size="lg" className="animate-pulse-glow">
                <Link to="/signup">Apply for Membership <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-card/10 border-card/30 text-card hover:bg-card hover:text-secondary backdrop-blur-sm"
              >
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
