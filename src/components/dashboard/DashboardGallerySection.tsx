import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Images, ArrowRight, Calendar } from "lucide-react";
import EventCoverImage from "@/components/events/EventCoverImage";
import { fetchPublishedEvents, type EventRow } from "@/lib/events";

const PREVIEW_COUNT = 6;

const formatEventDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/**
 * Preview of the public Event Gallery, shown on the member dashboard below
 * the quick-actions grid — a handful of event "collections" (cover photo +
 * title) with a Show More link to the full /events page. Horizontal scroll
 * on narrow screens, a real grid once there's room (sm+).
 */
export default function DashboardGallerySection() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchPublishedEvents({ limit: PREVIEW_COUNT })
      .then((rows) => alive && setEvents(rows))
      .catch(() => alive && setEvents([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (!loading && events.length === 0) return null;

  return (
    <div className="mb-6 sm:mb-8">
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-xl font-display font-bold text-foreground">
          <Images className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> Event Gallery
        </h2>
        <Link
          to="/events"
          className="inline-flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-primary hover:underline"
        >
          Show more <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto snap-x pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible md:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-32 shrink-0 sm:w-auto">
                <div className="aspect-square sm:aspect-[4/3] animate-pulse rounded-lg bg-muted" />
              </div>
            ))
          : events.map((e) => (
              <Link
                key={e.id}
                to={`/events/${e.slug}`}
                className="group w-32 shrink-0 snap-start sm:w-auto"
              >
                <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
                  <EventCoverImage
                    coverImage={e.cover_image}
                    alt={e.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mt-1.5 line-clamp-1 text-xs sm:text-sm font-medium text-foreground">{e.title}</p>
                {e.event_date && (
                  <p className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" /> {formatEventDate(e.event_date)}
                  </p>
                )}
              </Link>
            ))}
      </div>
    </div>
  );
}
