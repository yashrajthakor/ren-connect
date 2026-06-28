import { Globe } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-card/70 backdrop-blur-sm p-0.5",
        className,
      )}
      role="group"
      aria-label="Language switcher"
    >
      <Globe className="h-3.5 w-3.5 text-muted-foreground ml-2" />
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={cn(
          "px-2.5 py-1 text-xs font-semibold rounded-full transition-colors",
          lang === "en"
            ? "bg-primary text-primary-foreground"
            : "text-secondary/70 hover:text-primary",
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("gu")}
        aria-pressed={lang === "gu"}
        className={cn(
          "px-2.5 py-1 text-xs font-semibold rounded-full transition-colors",
          lang === "gu"
            ? "bg-primary text-primary-foreground"
            : "text-secondary/70 hover:text-primary",
        )}
      >
        ગુજ
      </button>
    </div>
  );
};

export default LanguageSwitcher;