import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import MemberCard from "@/components/public/MemberCard";
import { Member } from "@/data/members";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageProvider";

const DashboardDirectory = () => {
  const t = useT();
  const [query, setQuery] = useState("");
  const [activeCats, setActiveCats] = useState<string[]>([]);
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
            ? String(m.services)
                .split(/[\n,]/)
                .map((s: string) => s.trim())
                .filter(Boolean)
                .slice(0, 6)
            : [];
          const cats: string[] = Array.isArray(m.categories) && m.categories.length
            ? m.categories
            : (m.category_name ? [m.category_name] : []);

          return {
            id: m.member_id,
            name,
            business: m.business_name || m.chapter_name || "RBN Member",
            category: m.category_name || "Member",
            categories: cats,
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
            membershipType: (m.membership_type as "visitor" | "paid_member") || "visitor",
          };
        });
        setMembers(mapped);
        const allCats = Array.from(
          new Set(mapped.flatMap((m) => m.categories || [m.category]).filter(Boolean))
        ).sort();
        setCategories(allCats);
      }
      setLoading(false);
    };

    load();
  }, []);

  const toggleCat = (c: string) =>
    setActiveCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => {
        const mCats = m.categories && m.categories.length ? m.categories : [m.category];
        const matchCat = activeCats.length === 0 || activeCats.some((c) => mCats.includes(c));
        const matchQuery =
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.business.toLowerCase().includes(q) ||
          m.city.toLowerCase().includes(q) ||
          mCats.some((c) => c.toLowerCase().includes(q)) ||
          m.services.some((s) => s.toLowerCase().includes(q));
        return matchCat && matchQuery;
      })
      .sort((a, b) => {
        const aPaid = a.membershipType === "paid_member" ? 1 : 0;
        const bPaid = b.membershipType === "paid_member" ? 1 : 0;
        return bPaid - aPaid;
      });
  }, [query, activeCats, members]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">
          {t("dir.eyebrow")}
        </p>
        <h1 className="font-display font-bold text-3xl sm:text-4xl mb-4">
          {t("dir.heading")}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          {t("dir.desc")}
        </p>
      </div>

      <div className="mb-6">
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
      <div className="mb-8 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCats([])}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium border transition-all",
              activeCats.length === 0
                ? "bg-primary text-primary-foreground border-primary shadow"
                : "bg-card text-secondary border-border hover:border-primary/50",
            )}
          >
            All
          </button>
          {categories.map((c) => {
            const on = activeCats.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                  on
                    ? "bg-primary text-primary-foreground border-primary shadow"
                    : "bg-card text-secondary border-border hover:border-primary/50",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
        {activeCats.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>Filtering by:</span>
            {activeCats.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {c}
                <button onClick={() => toggleCat(c)} aria-label={`Remove ${c}`} className="hover:text-primary/70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button onClick={() => setActiveCats([])} className="underline hover:text-primary ml-1">
              Clear all
            </button>
          </div>
        )}
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
    </div>
  );
};

export default DashboardDirectory;
