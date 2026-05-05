import { Mail, Phone, MapPin, MessageCircle, QrCode, Star, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Member } from "@/data/members";
import { useT } from "@/i18n/LanguageProvider";

const MemberCard = ({ member }: { member: Member }) => {
  const t = useT();
  return (
    <article className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-lg text-secondary truncate">{member.name}</h3>
            <p className="text-sm text-primary font-semibold truncate">{member.business}</p>
            {member.committeeBadge && (
              <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wide border border-primary/20">
                <Award className="h-3 w-3" />
                {member.committeeBadge}
              </span>
            )}
          </div>
          <div className="shrink-0 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold uppercase tracking-wider">
            {member.category}
          </div>
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

        <div className="mt-5 flex items-center gap-2">
          <Button size="sm" variant="royal" className="flex-1">
            <MessageCircle className="h-4 w-4" />
            {t("card.connect")}
          </Button>
          <Button size="sm" variant="outline" aria-label="QR Code">
            <QrCode className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
};

export default MemberCard;