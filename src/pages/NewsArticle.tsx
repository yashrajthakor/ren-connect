import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Calendar,
  Eye,
  ArrowLeft,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import PublicLayout from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  categoryLabel,
  fetchPostBySlug,
  fetchPublishedPosts,
  type NewsletterPost,
} from "@/lib/newsletter";
import { format } from "date-fns";

const FB_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.3.2 2.3.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>
);
const WA_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.6 1.4 5.6 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.3-6.1-3.4-8.3zM12 21.3c-1.8 0-3.5-.5-5-1.4l-.3-.2-3.8 1 1-3.7-.2-.3a9.7 9.7 0 1 1 18-5c0 5.4-4.3 9.6-9.7 9.6zm5.3-7.2c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.2-.2.2-.3.4-.5.1-.2 0-.4 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4 0 1.4 1 2.7 1.2 2.9.2.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg>
);

const NewsArticle = () => {
  const { slug = "" } = useParams();
  const [post, setPost] = useState<NewsletterPost | null>(null);
  const [related, setRelated] = useState<NewsletterPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchPostBySlug(slug)
      .then(async (p) => {
        if (!alive) return;
        setPost(p);
        if (p) {
          supabase.rpc("increment_newsletter_view" as any, { _slug: slug }).then(() => {});
          const rel = await fetchPublishedPosts({ category: p.category, limit: 4 });
          if (alive) setRelated(rel.filter((r) => r.id !== p.id).slice(0, 3));
        }
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="py-24 text-center text-muted-foreground">Loading…</div>
      </PublicLayout>
    );
  }

  if (!post) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-display font-bold mb-2">Story not found</h1>
          <p className="text-muted-foreground mb-6">
            This article may have been removed or is not yet published.
          </p>
          <Button asChild variant="royal">
            <Link to="/news">Back to all stories</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const seoTitle = post.seo_title || `${post.title} — RBN News`;
  const seoDesc = post.seo_description || post.summary || post.title;

  return (
    <PublicLayout>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={`https://rajputbusinessnetwork.lovable.app/news/${post.slug}`} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://rajputbusinessnetwork.lovable.app/news/${post.slug}`} />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: seoDesc,
          image: post.cover_image || undefined,
          datePublished: post.publish_date || post.created_at,
          dateModified: post.updated_at,
          author: { "@type": "Person", name: post.author_name || "RBN" },
        })}</script>
      </Helmet>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link
          to="/news"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> All stories
        </Link>

        <Badge variant="secondary" className="mb-3">
          {categoryLabel(post.category)}
        </Badge>
        <h1 className="font-display font-bold text-3xl sm:text-5xl text-secondary leading-tight mb-4">
          {post.title}
        </h1>
        {post.summary && (
          <p className="text-lg text-muted-foreground mb-6">{post.summary}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-8">
          {post.author_name && <span>By {post.author_name}</span>}
          {post.publish_date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(post.publish_date), "MMM d, yyyy")}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" /> {post.views_count} views
          </span>
        </div>

        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full rounded-xl mb-8 border border-border"
          />
        )}

        <div
          className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-secondary prose-a:text-primary whitespace-pre-wrap"
        >
          {post.content}
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-secondary inline-flex items-center gap-1">
            <Share2 className="h-4 w-4" /> Share:
          </span>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(post.title + " " + url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#25D366] text-white text-sm font-medium hover:opacity-90"
          >
            {WA_ICON} WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1877F2] text-white text-sm font-medium hover:opacity-90"
          >
            {FB_ICON} Facebook
          </a>
          <Button size="sm" variant="outline" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      </article>

      {related.length > 0 && (
        <section className="bg-muted/40 border-t border-border py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display font-bold text-2xl text-secondary mb-6">
              Related stories
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link key={r.id} to={`/news/${r.slug}`} className="group">
                  <Card className="overflow-hidden h-full">
                    <div className="aspect-[16/10] bg-muted overflow-hidden">
                      {r.cover_image ? (
                        <img
                          src={r.cover_image}
                          alt={r.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-royal" />
                      )}
                    </div>
                    <div className="p-4">
                      <Badge variant="secondary" className="mb-2">
                        {categoryLabel(r.category)}
                      </Badge>
                      <h3 className="font-display font-semibold text-base text-secondary line-clamp-2 group-hover:text-primary transition-colors">
                        {r.title}
                      </h3>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
};

export default NewsArticle;