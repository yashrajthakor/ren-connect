import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import renLogo from "@/assets/ren-logo.png";
import { useT } from "@/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/public/LanguageSwitcher";

const schema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  phone: z.string().trim().min(7, "Phone is required").max(20),
  email: z.string().trim().email("Valid email required").max(255),
  password: z.string().min(6, "Min 6 characters").max(128),
});
type FormData = z.infer<typeof schema>;

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const t = useT();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: data.fullName, phone: data.phone },
        },
      });
      if (error) {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "Application submitted",
          description: "Check your email to confirm your account. Our team will review your membership.",
        });
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-royal px-4 py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 bg-card/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
            <img src={renLogo} alt="REN" className="h-14 w-auto" />
          </div>
          <h1 className="text-2xl font-display font-bold text-card mb-1">{t("signup.heading")}</h1>
          <p className="text-card/70 text-sm">
            {t("signup.subtitle")}
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border/50">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="fullName">{t("signup.fullName")}</Label>
              <div className="relative mt-1">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="fullName" className="pl-11" placeholder="Rajveer Singh" {...register("fullName")} />
              </div>
              {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <Label htmlFor="phone">{t("signup.phone")}</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" className="pl-11" placeholder="+91 98xxxxxxxx" {...register("phone")} />
              </div>
              {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <Label htmlFor="email">{t("signup.email")}</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" className="pl-11" placeholder="you@company.com" {...register("email")} />
              </div>
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">{t("signup.password")}</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-11 pr-11"
                  placeholder="••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" variant="royal" size="lg" className="w-full" disabled={loading}>
              {loading ? t("signup.submitting") : t("signup.submit")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("signup.already")}{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t("signup.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;