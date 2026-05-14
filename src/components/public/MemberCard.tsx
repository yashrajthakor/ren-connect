import { useRef, useState } from "react";
import { Mail, Phone, MapPin, Star, Award, Globe, Building2, Linkedin, Instagram, Facebook, Share2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Member } from "@/data/members";
import { useT } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import ShareableProfileCard from "./ShareableProfileCard";
import { toast } from "@/hooks/use-toast";

const SHARE_MESSAGE = `👋 Hello,

I'm part of RBN – Rajput Business Network.

Sharing my business profile card with you 😊

RBN helps entrepreneurs and professionals connect and grow their business network.

Join RBN and create your business profile:
https://www.rajputbusinessnetwork.com/signup

Let's connect and grow together 🤝`;

const MemberCard = ({ member }: { member: Member }) => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"share" | "download" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const generatePng = async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    if (!cardRef.current) return null;
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#ffffff",
    });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return { blob, dataUrl };
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setBusy("download");
      const result = await generatePng();
      if (!result) return;
      const a = document.createElement("a");
      a.href = result.dataUrl;
      a.download = `${member.name.replace(/\s+/g, "_")}_RBN.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      toast({ title: "Download failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setBusy("share");
      const result = await generatePng();
      if (!result) return;
      const file = new File([result.blob], `${member.name.replace(/\s+/g, "_")}_RBN.png`, { type: "image/png" });
      const navAny = navigator as any;
      const sharePayload = { files: [file], text: SHARE_MESSAGE, title: `${member.name} — RBN` };

      // Preferred: native share with image + text together (mobile)
      if (navAny.canShare && navAny.canShare(sharePayload)) {
        try {
          await navAny.share(sharePayload);
          return;
        } catch (err: any) {
          if (err?.name === "AbortError") return;
          // fall through to fallback
        }
      }

      // Try sharing just the file if text+files combo not supported
      if (navAny.canShare && navAny.canShare({ files: [file] })) {
        try {
          // Copy text first so user can paste alongside image
          try { await navigator.clipboard.writeText(SHARE_MESSAGE); } catch {}
          await navAny.share({ files: [file], title: `${member.name} — RBN` });
          toast({ title: "Message copied", description: "Paste the caption with your shared image." });
          return;
        } catch (err: any) {
          if (err?.name === "AbortError") return;
        }
      }

      // Desktop fallback: copy text + download image + open WhatsApp Web
      try { await navigator.clipboard.writeText(SHARE_MESSAGE); } catch {}
      const a = document.createElement("a");
      a.href = result.dataUrl;
      a.download = `${member.name.replace(/\s+/g, "_")}_RBN.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast({
        title: "Card downloaded & message copied",
        description: "Attach the image in WhatsApp and paste the caption.",
      });
      const url = `https://wa.me/?text=${encodeURIComponent(SHARE_MESSAGE)}`;
      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
      toast({ title: "Share failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
    {/* Off-screen render target for image generation */}
    <div style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none", opacity: 0 }} aria-hidden>
      <ShareableProfileCard ref={cardRef} member={member} />
    </div>
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

        <div className="mt-5 flex gap-2">
          <Button
            size="sm"
            variant="default"
            className="flex-1"
            disabled={busy !== null}
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            {busy === "share" ? "Sharing…" : "Share Profile"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={busy !== null}
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            {busy === "download" ? "Saving…" : "Download Card"}
          </Button>
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