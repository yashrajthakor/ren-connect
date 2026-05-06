import { forwardRef } from "react";
import renLogo from "@/assets/ren-logo.png";
import { Member } from "@/data/members";
import { Mail, Phone, MapPin } from "lucide-react";

const ShareableProfileCard = forwardRef<HTMLDivElement, { member: Member }>(({ member }, ref) => {
  return (
    <div
      ref={ref}
      style={{ width: 720, fontFamily: "Inter, sans-serif" }}
      className="bg-white text-secondary"
    >
      {/* Header */}
      <div className="relative bg-gradient-to-br from-secondary via-[hsl(213,25%,22%)] to-secondary px-10 pt-8 pb-20">
        <div
          className="absolute inset-0 bg-primary"
          style={{ clipPath: "polygon(0 0, 65% 0, 30% 100%, 0 100%)" }}
        />
        <div className="relative flex items-center justify-between">
          <img src={renLogo} alt="REN" style={{ height: 56 }} className="w-auto" crossOrigin="anonymous" />
          <span className="text-white/90 text-sm font-bold uppercase tracking-[0.2em]">
            Member of REN
          </span>
        </div>
      </div>

      {/* Avatar overlap */}
      <div className="relative px-10 -mt-14">
        <div className="flex items-end gap-5">
          <div
            className="bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center"
            style={{ height: 120, width: 120, borderRadius: 20 }}
          >
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" crossOrigin="anonymous" />
            ) : (
              <span className="font-bold text-4xl text-primary">{member.initials}</span>
            )}
          </div>
          <div className="pb-2">
            <h2 className="font-bold text-3xl leading-tight text-secondary">{member.name}</h2>
            <p className="text-primary font-semibold text-lg">{member.business}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-10 pt-6 pb-8">
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="px-3 py-1 rounded-full bg-orange-50 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
            {member.category}
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-secondary text-xs font-semibold inline-flex items-center gap-1">
            <MapPin style={{ height: 12, width: 12 }} /> {member.city}
          </span>
        </div>

        {member.services.length > 0 && (
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Services</p>
            <div className="flex flex-wrap gap-1.5">
              {member.services.slice(0, 6).map((s) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-secondary">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 text-sm text-secondary border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2"><Phone style={{ height: 16, width: 16 }} className="text-primary" /><span>{member.phone}</span></div>
          <div className="flex items-center gap-2"><Mail style={{ height: 16, width: 16 }} className="text-primary" /><span>{member.email}</span></div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-secondary text-white px-10 py-4 text-center">
        <p className="text-sm font-bold tracking-[0.25em] uppercase">Connect • Collaborate • Grow</p>
      </div>
    </div>
  );
});

ShareableProfileCard.displayName = "ShareableProfileCard";
export default ShareableProfileCard;