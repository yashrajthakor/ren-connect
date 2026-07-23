import { forwardRef } from "react";
import renLogo from "@/assets/ren-logo.png";
import { Member } from "@/data/members";
import { Phone, MapPin, Globe, Award } from "lucide-react";

const ShareableProfileCard = forwardRef<HTMLDivElement, { member: Member }>(({ member }, ref) => {
  const categories = member.categories && member.categories.length > 0 ? member.categories : [member.category];
  const services = member.services;

  return (
    <div
      ref={ref}
      style={{ width: 1920, minHeight: 1080, fontFamily: "Inter, sans-serif" }}
      className="relative bg-white text-secondary flex flex-col"
    >
      {/* Header */}
      <div className="relative shrink-0" style={{ height: 108 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-[hsl(213,25%,22%)] to-secondary" />
        <div
          className="absolute inset-0 bg-primary"
          style={{ clipPath: "polygon(0 0, 38% 0, 24% 100%, 0 100%)" }}
        />
        {/* <div className="relative h-full flex items-center justify-end px-16">
          <span className="text-white/90 text-lg font-bold uppercase tracking-[0.3em]">
            Member of RBN
          </span>
        </div> */}
      </div>

      {/* RBN logo, top-right just below the header strip */}
      <div
        className="absolute bg-white rounded-2xl shadow-lg flex items-center justify-center px-3"
        style={{ top: 124, right: 64, height: 100 }}
      >
        <img src={renLogo} alt="RBN" style={{ height: 76 }} className="w-auto" crossOrigin="anonymous" />
      </div>

      {/* Body: two columns, vertically centered so short content doesn't leave a dead gap at the bottom */}
      <div className="flex-1 flex items-center px-16 gap-20" style={{ paddingTop: 40, paddingBottom: 48 }}>
        {/* Left column: photo with overlapping firm logo + contact details */}
        <div className="flex flex-col items-center shrink-0" style={{ width: 494 }}>
          <div className="relative" style={{ width: 364 }}>
            <div
              className="bg-white border-[6px] border-white shadow-2xl overflow-hidden flex items-center justify-center ring-1 ring-slate-200"
              style={{ height: 494, width: 364, borderRadius: 28 }}
            >
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" crossOrigin="anonymous" />
              ) : (
                <span className="font-bold text-secondary" style={{ fontSize: 115 }}>{member.initials}</span>
              )}
            </div>
            {member.logoUrl && (
              <div
                className="absolute bg-white border border-slate-200 rounded-2xl shadow-lg flex items-center justify-center overflow-hidden"
                style={{ height: 143, width: 260, bottom: -47, left: "50%", transform: "translateX(-50%)" }}
              >
                <img src={member.logoUrl} alt="logo" className="h-full w-full object-contain p-2" crossOrigin="anonymous" />
              </div>
            )}
          </div>

          {/* <div className="flex flex-col items-start" style={{ width: 280, marginTop: 64, gap: 22 }}>
            {member.website && (
              <div className="flex items-start gap-3 w-full">
                <div className="flex items-center justify-center rounded-full bg-orange-50 shrink-0" style={{ height: 40, width: 40, marginTop: 1 }}>
                  <Globe style={{ height: 20, width: 20 }} className="text-primary" />
                </div>
                <span className="text-secondary font-medium break-words" style={{ fontSize: 23, lineHeight: 1.3 }}>{member.website}</span>
              </div>
            )}
          </div> */}
        </div>

        {/* Right column: name, business, badges, services */}
        <div className="flex flex-col flex-1 min-w-0" style={{ gap: 24 }}>
          <div>
            <h2
              className="font-bold text-secondary"
              style={{ fontSize: 66, lineHeight: 1.1, letterSpacing: "-0.01em" }}
            >
              {member.name}
            </h2>
            <p className="text-primary font-semibold" style={{ fontSize: 38, marginTop: 10 }}>
              {member.business}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((c) => (
              <span key={c} className="px-4 py-2 rounded-full bg-orange-50 text-primary font-bold uppercase tracking-wider border border-primary/20" style={{ fontSize: 20 }}>
                {c}
              </span>
            ))}
            {/* <span className="px-4 py-2 rounded-full bg-slate-100 text-secondary font-semibold inline-flex items-center gap-2" style={{ fontSize: 20 }}>
              <MapPin style={{ height: 18, width: 18 }} /> {member.city}
            </span> */}
            {/* {member.chapter && (
              <span className="px-4 py-2 rounded-full bg-slate-100 text-secondary font-semibold" style={{ fontSize: 20 }}>
                {member.chapter}
              </span>
            )} */}
          </div>

          {services.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p className="font-bold uppercase tracking-wider text-slate-500 mb-3" style={{ fontSize: 20 }}>Services</p>
              <div className="flex flex-wrap gap-3">
                {services.map((s) => (
                  <span key={s} className="px-5 py-2.5 rounded-full bg-slate-100 text-secondary font-medium" style={{ fontSize: 22 }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-secondary text-white px-16 shrink-0 flex items-center justify-center" style={{ height: 90 }}>
        <p className="font-bold tracking-[0.3em] uppercase" style={{ fontSize: 24 }}>Connect • Collaborate • Grow</p>
      </div>
    </div>
  );
});

ShareableProfileCard.displayName = "ShareableProfileCard";
export default ShareableProfileCard;
