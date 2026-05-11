import { Quote, Star, TrendingUp, Users } from "lucide-react";
import PublicLayout from "@/components/public/PublicLayout";
import { useT } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";

const stories = [
  {
    name: "Vikram Singh Chauhan",
    role: "Chauhan Realty Group",
    quote:
      "Through RBN referrals, I closed 14 commercial deals last year. The trust factor inside the network is unmatched.",
    metric: "14 deals closed via RBN",
  },
  {
    name: "Karan Singh Shekhawat",
    role: "Shekhawat Tech Labs",
    quote:
      "I found my co-founder, my first investor and three enterprise clients — all from the RBN community.",
    metric: "3 enterprise clients onboarded",
  },
  {
    name: "Aditya Pratap Sisodia",
    role: "Sisodia Capital Advisors",
    quote:
      "RBN events feel like a chamber of commerce, but with the warmth of family. Business gets done here.",
    metric: "₹40Cr AUM through referrals",
  },
  {
    name: "Yashraj Singh Thakor",
    role: "Thakor Business Services",
    quote:
      "The branded member card system gave my consultancy instant credibility with new prospects.",
    metric: "2x client acquisition",
  },
];

const VoiceOfRen = () => {
  const t = useT();
  const statLabels: TranslationKey[] = [
    "voice.s.voices",
    "voice.s.referrals",
    "voice.s.satisfaction",
    "voice.s.stories",
  ];
  return (
    <PublicLayout>
      <section className="bg-gradient-royal text-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">
            {t("voice.eyebrow")}
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl max-w-3xl">
            {t("voice.heading")}
          </h1>
          <p className="mt-5 text-card/75 max-w-2xl text-lg">
            {t("voice.desc")}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, value: "500+", labelKey: statLabels[0] },
          { icon: TrendingUp, value: "1,200+", labelKey: statLabels[1] },
          { icon: Star, value: "98%", labelKey: statLabels[2] },
          { icon: Quote, value: "320+", labelKey: statLabels[3] },
        ].map((s) => (
          <div key={s.labelKey} className="bg-card border border-border rounded-xl p-5 text-center">
            <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="font-display font-bold text-2xl text-secondary">{s.value}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t(s.labelKey)}</div>
          </div>
        ))}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 grid md:grid-cols-2 gap-6">
        {stories.map((s) => (
          <article
            key={s.name}
            className="relative bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-lg transition"
          >
            <Quote className="absolute top-6 right-6 h-10 w-10 text-primary/15" />
            <p className="text-lg text-secondary leading-relaxed">"{s.quote}"</p>
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <TrendingUp className="h-3 w-3" />
              {s.metric}
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <p className="font-semibold text-secondary">{s.name}</p>
              <p className="text-sm text-muted-foreground">{s.role}</p>
            </div>
          </article>
        ))}
      </section>
    </PublicLayout>
  );
};

export default VoiceOfRen;