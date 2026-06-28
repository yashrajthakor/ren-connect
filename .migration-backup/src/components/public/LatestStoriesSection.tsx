import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  categoryLabel,
  fetchPublishedPosts,
  type NewsletterPost,
} from "@/lib/newsletter";
import { formatDistanceToNow } from "date-fns";

const LatestStoriesSection = () => {
  const [posts, setPosts] = useState<NewsletterPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchPublishedPosts({ limit: 3 })
      .then((rows) => alive && setPosts(rows))
      .catch(() => alive && setPosts([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-2">
            Community Updates
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-secondary leading-tight">
            Latest news & stories
          </h2>
        </div>
        <Link
          to="/news"
          className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 group"
        >
          View all
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => (
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
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {p.summary}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {p.publish_date ? (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(p.publish_date), { addSuffix: true })}
                    </span>
                  ) : <span />}
                  <span className="inline-flex items-center gap-1 text-primary font-semibold">
                    Read <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Button asChild variant="royal" size="lg">
          <Link to="/news">Read more stories <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </section>
  );
};

export default LatestStoriesSection;