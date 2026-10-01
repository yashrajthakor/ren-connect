import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, Calendar, ArrowRight, Images, ArrowUpRight } from "lucide-react";
import PublicLayout from "@/components/public/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EventCoverImage from "@/components/events/EventCoverImage";
import { fetchPublishedEvents, type EventRow } from "@/lib/events";

const formatEventDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const Events = () => {
  const [params, setParams] = useSearchParams();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get("q") || "");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchPublishedEvents({ search })
      .then((rows) => alive && setEvents(rows))
      .catch(() => alive && setEvents([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [search]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (search) next.set("q", search);
    else next.delete("q");
    setParams(next);
  };

  return (
    <PublicLayout>
      <Helmet>
        <title>Events — Rajput Business Network</title>
        <meta name="description" content="Photos and highlights from RBN events, tournaments and gatherings." />
        <link rel="canonical" href="https://rajputbusinessnetwork.lovable.app/events" />
      </Helmet>

      <section className="bg-gradient-royal text-card py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Moments Together
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-5xl mb-4">Gallary</h1>
          <p className="text-card/80 max-w-2xl mb-8">
            Photos and highlights from RBN tournaments, meets and celebrations.
          </p>
          {/* <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events…"
                className="pl-9 h-11 bg-card text-foreground"
              />
            </div>
            <Button type="submit" variant="royal" size="lg" className="h-11">
              Search
            </Button>
          </form> */}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading events…</div>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No events found. Check back soon.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e) => (
              <Link
                key={e.id}
                to={`/events/${e.slug}`}
                className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                  <EventCoverImage
                    coverImage={e.cover_image}
                    alt={e.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-card backdrop-blur-sm">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                  {!!e.image_count && (
                    <div className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-medium text-card backdrop-blur-sm">
                      <Images className="h-3 w-3" />
                      {e.image_count}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display font-semibold text-lg text-secondary leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {e.title}
                  </h3>
                  {e.summary && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{e.summary}</p>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {e.event_date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatEventDate(e.event_date)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-primary font-semibold">
                      View photos <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

export default Events;
