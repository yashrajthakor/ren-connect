import { Crown, Handshake, Target, Eye, ShieldCheck, TrendingUp, HeartHandshake, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/public/PublicLayout";
import { useT } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";

const valueDefs: { icon: any; titleKey: TranslationKey; textKey: TranslationKey }[] = [
  { icon: ShieldCheck, titleKey: "about.v.trust.title", textKey: "about.v.trust.text" },
  { icon: Crown, titleKey: "about.v.legacy.title", textKey: "about.v.legacy.text" },
  { icon: TrendingUp, titleKey: "about.v.growth.title", textKey: "about.v.growth.text" },
  { icon: HeartHandshake, titleKey: "about.v.referrals.title", textKey: "about.v.referrals.text" },
  { icon: Award, titleKey: "about.v.excellence.title", textKey: "about.v.excellence.text" },
  { icon: Handshake, titleKey: "about.v.collective.title", textKey: "about.v.collective.text" },
];

const benefitKeys: TranslationKey[] = [
  "about.b.1",
  "about.b.2",
  "about.b.3",
  "about.b.4",
  "about.b.5",
  "about.b.6",
];

const About = () => {
  const t = useT();
  return (
    <>
      <Helmet>
        <title>About RBN | Rajput Business Network — Mission, Vision & Values</title>
        <meta name="description" content="Learn about the Rajput Business Network. Our mission is to unite Rajput entrepreneurs across India through trust, referrals and shared legacy." />
        <link rel="canonical" href="https://rajputbusinessnetwork.com/about" />
        <meta property="og:title" content="About RBN | Rajput Business Network" />
        <meta property="og:description" content="Mission, vision and values of the Rajput Business Network." />
        <meta property="og:url" content="https://rajputbusinessnetwork.com/about" />
      </Helmet>
    <PublicLayout>
      <section className="bg-gradient-royal text-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">{t("about.eyebrow")}</p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl max-w-3xl">
            {t("about.heading")}
          </h1>
          <p className="mt-5 text-card/75 max-w-2xl text-lg">
            {t("about.intro")}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display font-bold text-2xl text-secondary mb-3">{t("about.mission.title")}</h2>
          <p className="text-secondary/80 leading-relaxed">
            {t("about.mission.text")}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Eye className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display font-bold text-2xl text-secondary mb-3">{t("about.vision.title")}</h2>
          <p className="text-secondary/80 leading-relaxed">
            {t("about.vision.text")}
          </p>
        </div>
      </section>

      <section className="bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">
              {t("about.values.eyebrow")}
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-secondary">
              {t("about.values.heading")}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {valueDefs.map((v) => (
              <div key={v.titleKey} className="bg-card border border-border rounded-xl p-6">
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl text-secondary mb-1">{t(v.titleKey)}</h3>
                <p className="text-sm text-secondary/70">{t(v.textKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">
            {t("about.benefits.eyebrow")}
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-secondary mb-4">
            {t("about.benefits.heading")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("about.benefits.desc")}
          </p>
          <Button asChild variant="royal" size="lg">
            <Link to="/signup">{t("about.benefits.apply")}</Link>
          </Button>
        </div>
        <ul className="grid sm:grid-cols-2 gap-3">
          {benefitKeys.map((b) => (
            <li
              key={b}
              className="flex items-start gap-3 bg-card border border-border rounded-xl px-4 py-3"
            >
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                ✓
              </div>
              <span className="text-sm text-secondary/80">{t(b)}</span>
            </li>
          ))}
        </ul>
      </section>
    </PublicLayout>
    </>
  );
};

export default About;