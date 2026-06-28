import { useState } from "react";
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
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Member } from "@/data/members";

/**
 * LeadershipMemberCard — used ONLY on the homepage
 * "Meet the leaders driving RBN forward" section.
 * Compact, premium executive-style card. Do not reuse elsewhere.
 */
const LeadershipMemberCard = ({ member }: { member: Member }) => {
  const [open, setOpen] = useState(false);

  const services = member.services || [];
  const visibleServices = services.slice(0, 4);
  const extraServices = Math.max(0, services.length - visibleServices.length);

  return (
    <>
      <article
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-primary/40"
      >
        {/* Top accent strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-[hsl(28,85%,42%)] to-primary" />

        <div className="flex items-start gap-4 px-5 pt-5">
          {/* Profile image with overlapping badge */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-card bg-muted shadow-md ring-1 ring-border transition-transform duration-300 group-hover:scale-105">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-primary">
                  {member.initials}
                </div>
              )}
            </div>
            {member.committeeBadge && (
              <span className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-[hsl(28,85%,42%)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground shadow ring-2 ring-card">
                <Award className="h-2.5 w-2.5" />
                Core
              </span>
            )}
          </div>

          {/* Name / firm / category */}
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="truncate font-display text-base font-bold leading-tight text-secondary">
              {member.name}
            </h3>
            <p className="mt-0.5 truncate text-sm font-semibold text-primary">
              {member.business}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className="inline-block rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                {member.category}
              </span>
              {member.committeeBadge && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {member.committeeBadge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Services chips — max 2 rows */}
        {visibleServices.length > 0 && (
          <div className="mt-3 px-5">
            <div
              className="flex flex-wrap gap-1 overflow-hidden"
              style={{ maxHeight: "3.25rem" }}
            >
              {visibleServices.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {s}
                </span>
              ))}
              {extraServices > 0 && (
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  +{extraServices} More
                </span>
              )}
            </div>
          </div>
        )}

        {/* Phone */}
        <div className="mt-3 flex items-center gap-2 px-5 text-sm text-secondary/80">
          <Phone className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{member.phone}</span>
        </div>

        {/* Hover overlay — extra details, doesn't grow card */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[3.75rem] z-10 mx-3 translate-y-2 rounded-xl border border-primary/20 bg-card/95 p-3 opacity-0 shadow-xl backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex items-center gap-2 text-xs text-secondary/90">
            <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{member.email}</span>
          </div>
          {services.length > visibleServices.length && (
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
              <span className="font-semibold text-secondary">Also:</span>{" "}
              {services.slice(visibleServices.length).join(", ")}
            </p>
          )}
          {!services.length || services.length <= visibleServices.length ? (
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
              Trusted RBN leader contributing to the network's growth and member success.
            </p>
          ) : null}
        </div>

        {/* View More button — pinned at bottom for equal heights */}
        <div className="mt-auto px-5 pb-5 pt-4">
          <Button
            size="sm"
            variant="outline"
            className="w-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => setOpen(true)}
          >
            <Eye className="h-4 w-4" />
            View More
          </Button>
        </div>
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">{member.name}</DialogTitle>
          </DialogHeader>

          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted">
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-2xl font-bold text-primary">{member.initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-bold text-secondary">{member.name}</h2>
              <p className="font-semibold text-primary">{member.business}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                  {member.category}
                </span>
                {member.committeeBadge && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    <Award className="h-3 w-3" />
                    {member.committeeBadge}
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
                  <span key={s} className="rounded-md bg-muted px-2 py-1 text-xs text-secondary">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 text-sm text-secondary/90 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="truncate">{member.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span>{member.phone}</span>
            </div>
            {member.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="truncate">{member.city}</span>
              </div>
            )}
            {member.chapter && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="truncate">{member.chapter}</span>
              </div>
            )}
            {member.website && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <Globe className="h-4 w-4 text-primary" />
                <a
                  href={member.website}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {member.website}
                </a>
              </div>
            )}
          </div>

          {(member.linkedin || member.instagram || member.facebook) && (
            <div className="flex items-center gap-3 border-t pt-3">
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-muted p-2 text-primary hover:bg-primary/10"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {member.instagram && (
                <a
                  href={member.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-muted p-2 text-primary hover:bg-primary/10"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {member.facebook && (
                <a
                  href={member.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-muted p-2 text-primary hover:bg-primary/10"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeadershipMemberCard;