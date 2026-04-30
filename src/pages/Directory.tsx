import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import PublicLayout from "@/components/public/PublicLayout";
import MemberCard from "@/components/public/MemberCard";
import { categories, members } from "@/data/members";
import { cn } from "@/lib/utils";

const Directory = () => {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");

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
  }, [query, active]);

  return (
    <PublicLayout>
      <section className="bg-gradient-royal text-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">
            Business Directory
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-4">
            Discover REN Entrepreneurs
          </h1>
          <p className="text-card/75 max-w-2xl">
            Search across industries, cities and services. Connect directly with verified Rajput
            business owners.
          </p>

          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, business, service or city..."
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

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No members match your search.
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