import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  NEWSLETTER_CATEGORIES,
  categoryLabel,
  fetchPublishedPosts,
  type NewsletterPost,
} from "@/lib/newsletter";
import { formatDistanceToNow } from "date-fns";
import { useT } from "@/i18n/LanguageProvider";

const DashboardNews = () => {
  const t = useT();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [posts, setPosts] = useState<NewsletterPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const rows = await fetchPublishedPosts({ search: query, category });
        setPosts(rows);
      } catch (err) {
        console.error(err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [query, category]);

  const filtered = useMemo(() => {
    return posts;
  }, [posts]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">
          {t("nav.news")}
        </p>
        <h1 className="font-display font-bold text-3xl sm:text-4xl mb-4">
          News & Stories
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Latest updates, member stories, business tips, and community news from RBN.
        </p>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-[1fr,240px] items-end">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories…"
            className="pl-12 h-12 bg-card text-foreground"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-secondary">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-12 w-full">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {NEWSLETTER_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading stories…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No stories found. Check back soon.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to={`/dashboard/news/${p.slug}`}
              className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-[16/10] bg-muted overflow-hidden">
                {p.cover_image ? (
                  <img
                    src={p.cover_image}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-royal" />
                )}
              </div>
              <div className="p-5">
                <Badge variant="secondary" className="mb-2">
                  {categoryLabel(p.category)}
                </Badge>
                <h3 className="font-display font-semibold text-lg text-secondary leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {p.title}
                </h3>
                {p.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {p.summary}
                  </p>
                )}
                <div className="text-xs text-muted-foreground flex items-center gap-3">
                  {p.publish_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(p.publish_date), { addSuffix: true })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {p.views_count}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardNews;
