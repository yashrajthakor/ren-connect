import { Calendar, MapPin, Trophy } from "lucide-react";
import PublicLayout from "@/components/public/PublicLayout";
import { useT } from "@/i18n/LanguageProvider";

const moments = [
  {
    date: "April 2026",
    title: "RBN National Conclave 2026",
    city: "Jaipur",
    summary:
      "300+ entrepreneurs gathered for two days of keynotes, panel discussions and structured B2B referral exchanges.",
    badge: "Milestone",
  },
  {
    date: "March 2026",
    title: "Mumbai Chapter Launch",
    city: "Mumbai",
    summary:
      "Officially inaugurated the Mumbai chapter with 45 founding members across finance, real estate and trade.",
    badge: "Chapter",
  },
  {
    date: "February 2026",
    title: "Women Entrepreneurs Spotlight",
    city: "Udaipur",
    summary:
      "An evening dedicated to celebrating Rajput women business leaders shaping the next decade of RBN.",
    badge: "Event",
  },
  {
    date: "January 2026",
    title: "RBN crosses 500 members",
    city: "Pan-India",
    summary:
      "A defining moment — RBN now spans 12 chapters and 500+ verified entrepreneurs across India.",
    badge: "Milestone",
  },
  {
    date: "December 2025",
    title: "Bengaluru Tech Mixer",
    city: "Bengaluru",
    summary:
      "Tech founders met investors and senior operators in a curated invite-only mixer.",
    badge: "Event",
  },
];

const KeyMoments = () => {
  const t = useT();
  return (
    <PublicLayout>
      <section className="bg-gradient-royal text-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">
            {t("km.eyebrow")}
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl max-w-3xl">
            {t("km.heading")}
          </h1>
          <p className="mt-5 text-card/75 max-w-2xl text-lg">
            {t("km.desc")}
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative pl-8 sm:pl-12">
          <div className="absolute left-2 sm:left-4 top-2 bottom-2 w-px bg-border" />
          <div className="space-y-10">
            {moments.map((m, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[26px] sm:-left-[34px] top-2 h-4 w-4 rounded-full bg-primary ring-4 ring-card shadow" />
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">
                      <Calendar className="h-3.5 w-3.5" /> {m.date}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {m.city}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-accent text-accent-foreground">
                      <Trophy className="h-3 w-3" /> {m.badge}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-secondary">{m.title}</h3>
                  <p className="mt-2 text-sm text-secondary/75 leading-relaxed">{m.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default KeyMoments;