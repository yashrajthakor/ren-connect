import { useEffect, useRef, useState } from "react";
import {
  Mail,
  Phone,
  Award,
  Globe,
  Building2,
  Linkedin,
  Instagram,
  Facebook,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Member } from "@/data/members";

/**
 * CoreTeamCarousel — used ONLY on the homepage
 * "Meet the leaders driving RBN forward" section.
 * A row of circular avatars auto-advances; whoever is centered enlarges
 * and their name/description surface below. On mobile only the active
 * member and their immediate neighbors show (screen width); on sm+ every
 * member renders, sized by how far they are from the active one. Do not
 * reuse elsewhere.
 */

const AUTO_ADVANCE_MS = 4000;

function slotSizeClass(distance: number) {
  if (distance === 0) return "h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-primary/70 shadow-2xl z-10";
  if (distance === 1) return "h-16 w-16 sm:h-20 sm:w-20 ring-2 ring-border opacity-85";
  if (distance === 2) return "h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-border opacity-65";
  return "h-12 w-12 sm:h-14 sm:w-14 ring-1 ring-border opacity-45";
}

function Avatar({ member }: { member: Member }) {
  return member.avatarUrl ? (
    <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-muted font-display text-xl font-bold text-primary sm:text-2xl">
      {member.initials}
    </div>
  );
}

export default function CoreTeamCarousel({ members }: { members: Member[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const paused = useRef(false);

  useEffect(() => {
    if (members.length <= 1) return;
    const t = setInterval(() => {
      if (paused.current) return;
      setActiveIndex((i) => (i + 1) % members.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(t);
  }, [members.length]);

  if (members.length === 0) return null;

  const active = members[activeIndex];
  const services = active.services || [];
  const total = members.length;
  const goTo = (i: number) => setActiveIndex(((i % total) + total) % total);

  // Render order rotates with activeIndex so the highlighted member always
  // sits in the middle slot — offsets run symmetrically around 0 (the
  // active member), not the members array's original order.
  const half = Math.floor(total / 2);
  const offsets = Array.from({ length: total }, (_, k) => k - half);

  return (
    <div
      className="flex flex-col items-center"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      <div className="flex w-full items-center justify-center gap-2 sm:gap-4">
        {total > 1 && (
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Previous member"
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-secondary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-start justify-center gap-x-3 gap-y-4 sm:gap-x-4">
          {offsets.map((offset) => {
            const index = ((activeIndex + offset) % total + total) % total;
            const member = members[index];
            const distance = Math.abs(offset);
            const isCenter = offset === 0;
            // Mobile only shows the active member and its immediate neighbors —
            // desktop (sm+) shows everyone, tapering size by distance.
            const mobileVisible = distance <= 1;
            return (
              <div
                key={member.id}
                className={`flex flex-col items-center gap-1.5 ${mobileVisible ? "" : "hidden sm:flex"}`}
              >
                <button
                  type="button"
                  onClick={() => (isCenter ? setOpen(true) : goTo(index))}
                  className={`shrink-0 overflow-hidden rounded-full border-4 border-card bg-muted transition-all duration-500 ease-out hover:opacity-100 ${slotSizeClass(distance)}`}
                  aria-label={isCenter ? `View ${member.name}'s profile` : `Highlight ${member.name}`}
                >
                  <Avatar member={member} />
                </button>
                <span
                  className={`max-w-[72px] truncate text-center sm:max-w-[96px] ${
                    isCenter ? "text-sm font-bold text-secondary" : "text-[11px] font-medium text-muted-foreground"
                  }`}
                >
                  {member.name}
                </span>
              </div>
            );
          })}
        </div>
        {total > 1 && (
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Next member"
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-secondary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {total > 1 && (
        <div className="mt-3 flex items-center gap-3 sm:hidden">
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Previous member"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-secondary hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Next member"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-secondary hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div key={activeIndex} className="mt-8 max-w-xl text-center animate-fade-up" style={{ animationDuration: "400ms" }}>
        <h3 className="font-display text-2xl font-bold text-secondary">{active.name}</h3>
        <p className="mt-1 text-sm font-semibold text-primary">
          {active.committeeBadge ? `${active.committeeBadge} · ` : ""}
          {active.business}
        </p>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          {services.length > 0
            ? `${active.category} specialist offering ${services.slice(0, 3).join(", ")}.`
            : `Trusted RBN leader contributing to the network's growth and member success.`}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 text-sm font-semibold text-primary hover:underline"
        >
          View Profile
        </button>
      </div>

      {members.length > 1 && (
        <div className="mt-6 flex items-center gap-1.5">
          {members.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show ${m.name}`}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-primary/50"
              }`}
            />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">{active.name}</DialogTitle>
          </DialogHeader>

          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted">
              <Avatar member={active} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-bold text-secondary">{active.name}</h2>
              <p className="font-semibold text-primary">{active.business}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                  {active.category}
                </span>
                {active.committeeBadge && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    <Award className="h-3 w-3" />
                    {active.committeeBadge}
                  </span>
                )}
              </div>
            </div>
          </div>

          {services.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Services Offered
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {services.map((s) => (
                  <span key={s} className="rounded-md bg-muted px-2 py-1 text-xs text-secondary">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 text-sm text-secondary/90 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="truncate">{active.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span>{active.phone}</span>
            </div>
            {active.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="truncate">{active.city}</span>
              </div>
            )}
            {active.chapter && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="truncate">{active.chapter}</span>
              </div>
            )}
            {active.website && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <Globe className="h-4 w-4 text-primary" />
                <a
                  href={active.website}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {active.website}
                </a>
              </div>
            )}
          </div>

          {(active.linkedin || active.instagram || active.facebook) && (
            <div className="flex items-center gap-3 border-t pt-3">
              {active.linkedin && (
                <a href={active.linkedin} target="_blank" rel="noreferrer" className="rounded-full bg-muted p-2 text-primary hover:bg-primary/10">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {active.instagram && (
                <a href={active.instagram} target="_blank" rel="noreferrer" className="rounded-full bg-muted p-2 text-primary hover:bg-primary/10">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {active.facebook && (
                <a href={active.facebook} target="_blank" rel="noreferrer" className="rounded-full bg-muted p-2 text-primary hover:bg-primary/10">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
