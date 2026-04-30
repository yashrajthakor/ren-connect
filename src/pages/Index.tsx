import { Link } from "react-router-dom";
import { ArrowRight, Users, Briefcase, Handshake, Calendar, Quote, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/public/PublicLayout";
import MemberCard from "@/components/public/MemberCard";
import { members } from "@/data/members";

const stats = [
  { label: "Members", value: "500+", icon: Users },
  { label: "Businesses", value: "320+", icon: Briefcase },
  { label: "Referrals", value: "1,200+", icon: Handshake },
  { label: "Events", value: "85+", icon: Calendar },
];

const events = [
  { date: "May 18, 2026", title: "REN Mumbai Chapter — Monthly Meet", city: "Mumbai" },
  { date: "Jun 02, 2026", title: "Entrepreneurs Conclave 2026", city: "Jaipur" },
  { date: "Jun 21, 2026", title: "B2B Referral Mixer", city: "Bengaluru" },
];

const testimonials = [
  {
    quote: "REN opened doors to clients I would have never reached on my own. Pure trust, pure business.",
    name: "Vikram Singh Chauhan",
    role: "Founder, Chauhan Realty Group",
  },
  {
    quote: "From referrals to friendships — REN is the strongest entrepreneurial circle I'm part of.",
    name: "Karan Singh Shekhawat",
    role: "CEO, Shekhawat Tech Labs",
  },
];

const Index = () => {
  const featured = members.filter((m) => m.featured).slice(0, 3);

  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-royal text-card">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Business Beyond Brotherhood
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
              Connecting Rajput Entrepreneurs.{" "}
              <span className="text-gradient-royal">Building Legacy</span> Through Business.
            </h1>
            <p className="mt-6 text-lg text-card/75 max-w-2xl leading-relaxed">
              REN is an elite community of Rajput founders, business owners and professionals — built
              on trust, referrals and shared ambition. Discover members, share opportunities and grow
              together.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="royal" size="lg">
                <Link to="/signup">
                  Join REN <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-card/10 border-card/30 text-card hover:bg-card hover:text-secondary">
                <Link to="/directory">Explore Directory</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-card hover:bg-card/10 hover:text-card">
                <Link to="/login">Member Login</Link>
              </Button>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl" />
              <div className="relative bg-card text-foreground rounded-3xl p-6 shadow-2xl border border-card/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Member Spotlight
                  </span>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <MemberCard member={featured[0] ?? members[0]} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-card rounded-2xl shadow-xl border border-border p-6">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-display font-bold text-2xl text-secondary">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED MEMBERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">
              Featured Entrepreneurs
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-secondary">
              Meet the leaders driving REN forward
            </h2>
          </div>
          <Link
            to="/directory"
            className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            View full directory <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      </section>

      {/* EVENTS */}
      <section className="bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">
                Upcoming
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-secondary mb-3">
                Events & meetings
              </h2>
              <p className="text-muted-foreground">
                Join chapter meets, conclaves and exclusive networking events curated for serious
                entrepreneurs.
              </p>
            </div>
            <div className="lg:col-span-8 space-y-3">
              {events.map((e) => (
                <div
                  key={e.title}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {e.date} · {e.city}
                      </p>
                      <p className="font-semibold text-secondary">{e.title}</p>
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">
            Voice of REN
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-secondary">
            Trusted by entrepreneurs across India
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="relative bg-card border border-border rounded-2xl p-8 shadow-sm"
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/20" />
              <p className="text-lg text-secondary leading-relaxed">"{t.quote}"</p>
              <div className="mt-6 pt-6 border-t border-border">
                <p className="font-semibold text-secondary">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-royal text-card p-10 sm:p-14">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-display font-bold text-3xl sm:text-4xl mb-3">
                Ready to join the network?
              </h3>
              <p className="text-card/75 max-w-lg">
                Become part of an elite Rajput entrepreneurial community. Build trust, share
                referrals, and grow together.
              </p>
            </div>
            <div className="flex md:justify-end gap-3">
              <Button asChild variant="royal" size="lg">
                <Link to="/signup">Join REN <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-card/10 border-card/30 text-card hover:bg-card hover:text-secondary">
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
