import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import PublicLayout from "@/components/public/PublicLayout";
import MemberCard from "@/components/public/MemberCard";
import { Member } from "@/data/members";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageProvider";

const Directory = () => {
  const t = useT();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("list_active_directory");
      if (error || !data) {
        setMembers([]);
      } else {
        const mapped: Member[] = (data as any[]).map((m) => {
          const name: string = m.full_name || "Member";
          const initials = name
            .split(" ")
            .map((p: string) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();
          const servicesArr: string[] = m.services
            ? String(m.services).split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 6)
            : [];
          return {
            id: m.member_id,
            name,
            business: m.business_name || m.chapter_name || "RBN Member",
            category: m.category_name || "Member",
            city: m.business_city || m.city_name || "—",
            services: servicesArr,
            email: m.email || "—",
            phone: m.phone || "—",
            address: m.business_city || m.city_name || "",
            initials: initials || "RM",
            avatarUrl: m.profile_picture || m.logo || null,
            committeeBadge: m.committee_badge || null,
            logoUrl: m.logo || null,
            website: m.website || null,
            chapter: m.chapter_name || null,
            linkedin: m.linkedin_url || null,
            instagram: m.instagram_url || null,
            facebook: m.facebook_url || null,
          };
        });
        setMembers(mapped);
        const cats = Array.from(new Set(mapped.map((m) => m.category).filter(Boolean)));
        setCategories(["All", ...cats.sort()]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      const matchCat = active === "All" || m.category === active;
      const matchQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.business.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.services.some((s) => s.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [query, active, members]);

  return (
    <PublicLayout>
      <section className="bg-gradient-royal text-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">
            {t("dir.eyebrow")}
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-4">
            {t("dir.heading")}
          </h1>
          <p className="text-card/75 max-w-2xl">
            {t("dir.desc")}
          </p>

          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("dir.searchPlaceholder")}
                className="pl-12 h-12 bg-card text-foreground"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                active === c
                  ? "bg-primary text-primary-foreground border-primary shadow"
                  : "bg-card text-secondary border-border hover:border-primary/50",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading members…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {t("dir.empty")}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

export default Directory;