import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Calendar, ArrowLeft, Images } from "lucide-react";
import PublicLayout from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import EventGalleryGrid from "@/components/events/EventGalleryGrid";
import EventCoverImage from "@/components/events/EventCoverImage";
import { fetchEventBySlug, fetchEventGallery, type EventRow, type EventGalleryImage } from "@/lib/events";

const formatEventDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const EventDetail = () => {
  const { slug = "" } = useParams();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [images, setImages] = useState<EventGalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchEventBySlug(slug)
      .then(async (e) => {
        if (!alive) return;
        setEvent(e);
        if (e) {
          const gallery = await fetchEventGallery(e.id);
          if (alive) setImages(gallery);
        }
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="py-24 text-center text-muted-foreground">Loading…</div>
      </PublicLayout>
    );
  }

  if (!event) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-display font-bold mb-2">Event not found</h1>
          <p className="text-muted-foreground mb-6">
            This event may have been removed or is not yet published.
          </p>
          <Button asChild variant="royal">
            <Link to="/events">Back to all events</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const seoDesc = event.summary || event.title;

  return (
    <PublicLayout>
      <Helmet>
        <title>{event.title} — RBN Events</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={`https://rajputbusinessnetwork.lovable.app/events/${event.slug}`} />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={seoDesc} />
        {event.cover_image && <meta property="og:image" content={event.cover_image} />}
      </Helmet>

      {/* {event.cover_image && (
        <div className="relative w-full aspect-[21/9] bg-muted overflow-hidden">
          <EventCoverImage coverImage={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )} */}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link
          to="/events"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> All events
        </Link>

        <h1 className="font-display font-bold text-3xl sm:text-5xl text-secondary leading-tight mb-4">
          {event.title}
        </h1>
        {event.summary && <p className="text-lg text-muted-foreground mb-4">{event.summary}</p>}
        {event.event_date && (
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
            <Calendar className="h-4 w-4" /> {formatEventDate(event.event_date)}
          </p>
        )}

        {event.description && (
          <p className="text-secondary/90 leading-relaxed whitespace-pre-wrap mb-10">{event.description}</p>
        )}

        {images.length > 0 ? (
          <div>
            <h2 className="font-display font-bold text-2xl text-secondary mb-5 inline-flex items-center gap-2">
              <Images className="h-5 w-5 text-primary" /> Photos
            </h2>
            <EventGalleryGrid images={images} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Photos for this event are coming soon.</p>
        )}
      </div>
    </PublicLayout>
  );
};

export default EventDetail;
