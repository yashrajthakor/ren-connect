import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, Calendar, Eye, Star, ArrowRight } from "lucide-react";
import PublicLayout from "@/components/public/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NEWSLETTER_CATEGORIES,
  categoryLabel,
  fetchPublishedPosts,
  type NewsletterPost,
} from "@/lib/newsletter";
import { formatDistanceToNow } from "date-fns";

const News = () => {
  const [params, setParams] = useSearchParams();
  const [posts, setPosts] = useState<NewsletterPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "all");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchPublishedPosts({ search, category })
      .then((rows) => alive && setPosts(rows))
      .catch(() => alive && setPosts([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [search, category]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (search) next.set("q", search);
    else next.delete("q");
    if (category && category !== "all") next.set("category", category);
    else next.delete("category");
    setParams(next);
  };

  const featured = useMemo(() => posts.find((p) => p.featured) || posts[0], [posts]);
  const rest = useMemo(
    () => (featured ? posts.filter((p) => p.id !== featured.id) : posts),
    [posts, featured],
  );

  return (
    <PublicLayout>
      <Helmet>
        <title>News & Stories — Rajput Business Network</title>
        <meta
          name="description"
          content="Latest news, member stories, business tips, events and community updates from the Rajput Business Network."
        />
        <link rel="canonical" href="https://rajputbusinessnetwork.lovable.app/news" />
      </Helmet>

      <section className="bg-gradient-royal text-card py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Community Updates
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-5xl mb-4">
            News & Stories
          </h1>
          <p className="text-card/80 max-w-2xl mb-8">
            Member success stories, business tips, events and the latest announcements from
            across the Rajput Business Network.
          </p>
          <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-3 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stories, tips, announcements…"
                className="pl-9 h-11 bg-card text-foreground"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 sm:w-56 bg-card text-foreground">
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
            <Button type="submit" variant="royal" size="lg" className="h-11">
              Search
            </Button>
          </form>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading stories…</div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No stories found. Check back soon.</p>
          </Card>
        ) : (
          <>
            {featured && (
              <Link
                to={`/news/${featured.slug}`}
                className="group block mb-12 overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="grid md:grid-cols-2">
                  <div className="aspect-[16/10] md:aspect-auto bg-muted overflow-hidden">
                    {featured.cover_image ? (
                      <img
                        src={featured.cover_image}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-royal" />
                    )}
                  </div>
                  <div className="p-6 sm:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" /> Featured
                      </Badge>
                      <Badge variant="secondary">{categoryLabel(featured.category)}</Badge>
                    </div>
                    <h2 className="font-display font-bold text-2xl sm:text-3xl text-secondary mb-3 group-hover:text-primary transition-colors">
                      {featured.title}
                    </h2>
                    {featured.summary && (
                      <p className="text-muted-foreground mb-4 line-clamp-3">{featured.summary}</p>
                    )}
                    <div className="text-xs text-muted-foreground flex items-center gap-4">
                      {featured.publish_date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(featured.publish_date), { addSuffix: true })}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {featured.views_count}
                      </span>
                    </div>
                    <div className="mt-5 inline-flex items-center gap-1 text-primary font-semibold text-sm">
                      Read story <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((p) => (
                <Link
                  key={p.id}
                  to={`/news/${p.slug}`}
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
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.summary}</p>
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
          </>
        )}
      </section>
    </PublicLayout>
  );
};

export default News;