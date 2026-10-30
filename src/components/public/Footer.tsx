import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram } from "lucide-react";
import renLogo from "@/assets/ren-logo.png";
import { useT } from "@/i18n/LanguageProvider";
import GiantWordmark from "@/components/public/landing/GiantWordmark";

const linkClass = "text-card/70 hover:text-primary transition-colors";
const headingClass = "text-xs font-bold uppercase tracking-[0.2em] text-card mb-5";

const Footer = () => {
  const t = useT();
  return (
    <footer className="relative mt-24 overflow-hidden bg-royal-night text-card">
      <div className="absolute inset-0 bg-dot-grid pointer-events-none" />

      {/* Line-art jharokha arches */}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 320"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        className="pointer-events-none absolute bottom-0 right-[3%] hidden h-[72%] text-primary/20 md:block"
      >
        <path d="M10 320V140a90 90 0 0 1 180 0v180" />
        <path d="M35 320V145a65 65 0 0 1 130 0v175" />
        <path d="M60 320V152a40 40 0 0 1 80 0v168" />
        <path d="M100 50V22M90 32h20M100 22a6 6 0 1 0 0-12a6 6 0 1 0 0 12" />
        <path d="M0 320h200" />
      </svg>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GiantWordmark
          text="RBN"
          className="flex justify-center pt-12 -mb-[11vw] sm:-mb-[9vw] lg:-mb-[7.5rem] text-[42vw] sm:text-[34vw] lg:text-[24rem]"
        />

        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-12 pb-14">
          <div className="col-span-2 lg:col-span-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 rounded-full bg-white p-1.5 ring-1 ring-primary/40">
                <img src={renLogo} alt="RBN" className="h-full w-full object-contain" />
              </div>
              <span className="font-wordmark text-3xl font-semibold leading-none text-gradient-royal">
                {t("common.brandFull")}
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-card/70">{t("footer.about")}</p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.instagram.com/rbn.business.network/"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center border border-card/25 text-card/80 transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="mailto:info@rajputbusinessnetwork.com"
                aria-label="Email"
                className="flex h-11 w-11 items-center justify-center border border-card/25 text-card/80 transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className={headingClass}>{t("footer.explore")}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className={linkClass}>{t("nav.home")}</Link></li>
              <li><Link to="/directory" className={linkClass}>{t("nav.directory")}</Link></li>
              <li><Link to="/key-moments" className={linkClass}>{t("nav.keyMoments")}</Link></li>
              <li><Link to="/about" className={linkClass}>{t("nav.about")}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className={headingClass}>{t("footer.membership")}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/signup" className={linkClass}>{t("footer.joinRen")}</Link></li>
              <li><Link to="/login" className={linkClass}>{t("nav.login")}</Link></li>
              <li><Link to="/directory" className={linkClass}>{t("footer.findMembers")}</Link></li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-4">
            <h4 className={headingClass}>{t("footer.getInTouch")}</h4>
            <ul className="space-y-4 text-sm text-card/75">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href="tel:+919106786377" className="hover:text-primary">+91 91067 86377</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:info@rajputbusinessnetwork.com" className="break-all hover:text-primary">
                  info@rajputbusinessnetwork.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>{t("footer.location")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-between gap-2 border-t border-card/10 py-6 text-xs text-card/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {t("common.brandFull")}. {t("footer.rights")}</p>
          <p className="font-wordmark text-base italic text-primary/80">{t("common.tagline")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
