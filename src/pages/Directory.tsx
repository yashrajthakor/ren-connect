import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Input } from "@/components/ui/input";
import PublicLayout from "@/components/public/PublicLayout";
import MemberCard from "@/components/public/MemberCard";
import { CategoryFilterBar } from "@/components/public/CategoryFilterBar";
import { Member } from "@/data/members";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/LanguageProvider";

const Directory = () => {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const initialCats = (searchParams.get("category") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const [activeCats, setActiveCats] = useState<string[]>(initialCats);
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
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

  useEffect(() => {
    const params: Record<string, string> = {};
    if (query.trim()) params.q = query.trim();
    if (activeCats.length) params.category = activeCats.join(",");
    setSearchParams(params, { replace: true });
  }, [query, activeCats, setSearchParams]);

  const toggleCat = (c: string) =>
    setActiveCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => {
        const mCats = m.categories && m.categories.length ? m.categories : [m.category];
        const matchCat =
          activeCats.length === 0 || activeCats.some((c) => mCats.includes(c));
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
    <>
      <Helmet>
        <title>Business Directory | RBN — Discover Rajput Entrepreneurs</title>
        <meta name="description" content="Search the RBN member directory. Find verified Rajput business owners across industries, cities and services in India." />
        <link rel="canonical" href="https://rajputbusinessnetwork.com/directory" />
        <meta property="og:title" content="Business Directory | RBN" />
        <meta property="og:description" content="Discover verified Rajput entrepreneurs across India. Search by industry, city or service." />
        <meta property="og:url" content="https://rajputbusinessnetwork.com/directory" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "RBN Business Directory",
          description: "Verified Rajput business professionals and entrepreneurs across India.",
          url: "https://rajputbusinessnetwork.com/directory",
        })}</script>
      </Helmet>
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
        <div className="mb-8">
          <CategoryFilterBar
            categories={categories}
            activeCats={activeCats}
            onToggleCat={toggleCat}
            onClearAll={() => setActiveCats([])}
          />
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
    </>
  );
};

export default Directory;