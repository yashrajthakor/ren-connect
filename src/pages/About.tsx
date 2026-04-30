import { Crown, Handshake, Target, Eye, ShieldCheck, TrendingUp, HeartHandshake, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/public/PublicLayout";

const values = [
  { icon: ShieldCheck, title: "Trust", text: "A vetted, accountable network where word and handshake matter." },
  { icon: Crown, title: "Legacy", text: "Honoring heritage while building modern, scalable enterprises." },
  { icon: TrendingUp, title: "Growth", text: "Sharing knowledge, capital and opportunities to grow together." },
  { icon: HeartHandshake, title: "Referrals", text: "Trusted business leads exchanged within the brotherhood." },
  { icon: Award, title: "Excellence", text: "Setting the bar for professionalism in every category." },
  { icon: Handshake, title: "Collective Success", text: "When one rises, REN rises. We win as one." },
];

const benefits = [
  "Verified member directory access",
  "Monthly chapter networking meets",
  "Business referrals & lead exchange",
  "Member spotlight & branded profile cards",
  "Exclusive entrepreneurial conclaves",
  "Mentorship from senior business leaders",
];

const About = () => {
  return (
    <PublicLayout>
      <section className="bg-gradient-royal text-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">About REN</p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl max-w-3xl">
            A community where heritage meets enterprise.
          </h1>
          <p className="mt-5 text-card/75 max-w-2xl text-lg">
            REN — Rajput Entrepreneur Network — is a national platform uniting Rajput business owners,
            founders and professionals to collaborate, refer and build legacy together.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display font-bold text-2xl text-secondary mb-3">Our Mission</h2>
          <p className="text-secondary/80 leading-relaxed">
            To create the most trusted business referral and growth network for Rajput entrepreneurs —
            empowering members through visibility, connection and collective opportunity.
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Eye className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display font-bold text-2xl text-secondary mb-3">Our Vision</h2>
          <p className="text-secondary/80 leading-relaxed">
            A globally recognized Rajput business ecosystem where every member finds mentorship,
            partners and customers — and every chapter contributes to a stronger collective legacy.
          </p>
        </div>
      </section>

      <section className="bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">
              What we stand for
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-secondary">
              Our Core Values
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-card border border-border rounded-xl p-6">
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl text-secondary mb-1">{v.title}</h3>
                <p className="text-sm text-secondary/70">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">
            Membership
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-secondary mb-4">
            Benefits of joining REN
          </h2>
          <p className="text-muted-foreground mb-6">
            REN membership opens access to a curated network of entrepreneurs, opportunities and
            recognition.
          </p>
          <Button asChild variant="royal" size="lg">
            <Link to="/signup">Apply for Membership</Link>
          </Button>
        </div>
        <ul className="grid sm:grid-cols-2 gap-3">
          {benefits.map((b) => (
            <li
              key={b}
              className="flex items-start gap-3 bg-card border border-border rounded-xl px-4 py-3"
            >
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                ✓
              </div>
              <span className="text-sm text-secondary/80">{b}</span>
            </li>
          ))}
        </ul>
      </section>
    </PublicLayout>
  );
};

export default About;