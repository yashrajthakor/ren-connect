import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Linkedin, Instagram, Facebook } from "lucide-react";
import renLogo from "@/assets/ren-logo.png";

const Footer = () => {
  return (
    <footer className="bg-gradient-royal text-card mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-card rounded-lg p-2">
                <img src={renLogo} alt="REN" className="h-10 w-auto" />
              </div>
              <div>
                <div className="font-display font-bold text-xl">REN</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-card/60">
                  Rajput Entrepreneur Network
                </div>
              </div>
            </div>
            <p className="text-sm text-card/70 leading-relaxed">
              Connecting Rajput entrepreneurs across industries — building legacy through trusted business
              networking and referrals.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4 text-primary">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-card/70 hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/directory" className="text-card/70 hover:text-primary transition-colors">Directory</Link></li>
              <li><Link to="/key-moments" className="text-card/70 hover:text-primary transition-colors">Key Moments</Link></li>
              <li><Link to="/about" className="text-card/70 hover:text-primary transition-colors">About REN</Link></li>
              <li><Link to="/voice" className="text-card/70 hover:text-primary transition-colors">Voice of REN</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4 text-primary">Membership</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/signup" className="text-card/70 hover:text-primary transition-colors">Join REN</Link></li>
              <li><Link to="/login" className="text-card/70 hover:text-primary transition-colors">Member Login</Link></li>
              <li><Link to="/directory" className="text-card/70 hover:text-primary transition-colors">Find Members</Link></li>
              <li><Link to="/voice" className="text-card/70 hover:text-primary transition-colors">Success Stories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4 text-primary">Get in Touch</h4>
            <ul className="space-y-3 text-sm text-card/70">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <a href="mailto:contact@rajputbusinessnetwork.com" className="hover:text-primary">
                  contact@rajputbusinessnetwork.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>+91 00000 00000</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>India · Pan-India Chapters</span>
              </li>
            </ul>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" aria-label="LinkedIn" className="p-2 rounded-md bg-card/10 hover:bg-primary hover:text-primary-foreground transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Instagram" className="p-2 rounded-md bg-card/10 hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Facebook" className="p-2 rounded-md bg-card/10 hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-card/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-card/50">
          <p>© {new Date().getFullYear()} Rajput Entrepreneur Network. All rights reserved.</p>
          <p className="font-medium tracking-wide">Business Beyond Brotherhood.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;