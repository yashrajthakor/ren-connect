import { useState } from "react";
import { Mail, Phone, MapPin, Star, Award, Globe, Building2, Linkedin, Instagram, Facebook } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Member } from "@/data/members";
import { useT } from "@/i18n/LanguageProvider";

const MemberCard = ({ member }: { member: Member }) => {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
    <article
      onClick={() => setOpen(true)}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {/* Slanted brand banner */}
      <div className="relative h-28 bg-gradient-to-br from-secondary via-[hsl(213,25%,22%)] to-secondary">
        <div
          className="absolute inset-0 bg-primary"
          style={{ clipPath: "polygon(0 0, 70% 0, 35% 100%, 0 100%)" }}
        />
        {member.featured && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-card/95 text-primary px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow">
            <Star className="h-3 w-3 fill-primary" />
            {t("card.featured")}
          </div>
        )}
        {member.logoUrl && (
          <div className="absolute bottom-3 right-4 h-12 w-12 rounded-lg bg-card border border-border shadow flex items-center justify-center overflow-hidden">
            <img src={member.logoUrl} alt={`${member.business} logo`} className="h-full w-full object-contain p-1" />
          </div>
        )}
        <div className="absolute -bottom-10 left-6">
          <div className="h-20 w-20 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center overflow-hidden">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              <span className="font-display font-bold text-2xl text-primary">{member.initials}</span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-12 px-6 pb-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-lg text-secondary truncate">{member.name}</h3>
              <p className="text-sm text-primary font-semibold truncate">{member.business}</p>
            </div>
            <div className="shrink-0 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold uppercase tracking-wider">
              {member.category}
            </div>
          </div>
          {member.committeeBadge && (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wide border border-primary/20">
                <Award className="h-3 w-3" />
                {member.committeeBadge}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {member.services.slice(0, 3).map((s) => (
            <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-5 space-y-2 text-sm text-secondary/80">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary shrink-0" />
            <span>{member.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{member.city}</span>
          </div>
        </div>
      </div>
    </article>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{member.name}</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 rounded-2xl bg-muted border flex items-center justify-center overflow-hidden shrink-0">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              <span className="font-display font-bold text-2xl text-primary">{member.initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-bold text-2xl text-secondary">{member.name}</h2>
            <p className="text-primary font-semibold">{member.business}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold uppercase tracking-wider">
                {member.category}
              </span>
              {member.committeeBadge && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wide border border-primary/20">
                  <Award className="h-3 w-3" />
                  {member.committeeBadge}
                </span>
              )}
            </div>
          </div>
          {member.logoUrl && (
            <div className="h-16 w-16 rounded-lg border bg-card flex items-center justify-center overflow-hidden shrink-0">
              <img src={member.logoUrl} alt="logo" className="h-full w-full object-contain p-1" />
            </div>
          )}
        </div>

        {member.services.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Services</h4>
            <div className="flex flex-wrap gap-1.5">
              {member.services.map((s) => (
                <span key={s} className="text-xs px-2 py-1 rounded-md bg-muted text-secondary">{s}</span>
              ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3 text-sm text-secondary/90">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span className="truncate">{member.email}</span></div>
          <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><span>{member.phone}</span></div>
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span className="truncate">{member.city}</span></div>
          {member.chapter && (
            <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><span className="truncate">{member.chapter}</span></div>
          )}
          {member.website && (
            <div className="flex items-center gap-2 sm:col-span-2">
              <Globe className="h-4 w-4 text-primary" />
              <a href={member.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{member.website}</a>
            </div>
          )}
        </div>

        {(member.linkedin || member.instagram || member.facebook) && (
          <div className="flex items-center gap-3 pt-2 border-t">
            {member.linkedin && (
              <a href={member.linkedin} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary/10 text-primary"><Linkedin className="h-4 w-4" /></a>
            )}
            {member.instagram && (
              <a href={member.instagram} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary/10 text-primary"><Instagram className="h-4 w-4" /></a>
            )}
            {member.facebook && (
              <a href={member.facebook} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary/10 text-primary"><Facebook className="h-4 w-4" /></a>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};

export default MemberCard;