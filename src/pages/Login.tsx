import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { testSupabaseConnection, testAuth } from "@/utils/test-supabase";
import renLogo from "@/assets/ren-logo.png";
import { useT } from "@/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/public/LanguageSwitcher";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be less than 128 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const t = useT();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Test Supabase configuration on mount (development only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      const testConfig = async () => {
        // console.log("🔍 Testing Supabase configuration...");
        const report = await testSupabaseConnection();
        // console.log("📊 Configuration Report:", report);
        
        if (report.error) {
          // console.error("❌ Configuration Error:", report.error);
        } else {
          // console.log("✅ Supabase is properly configured");
        }
      };
      
      testConfig();
      
      // Make test functions available globally for console debugging
      (window as any).testSupabase = async () => {
        await testConfig();
        await testAuth();
      };
    }
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });

      if (error) {
        console.error("Sign in error:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        
        let message = "An error occurred during sign in.";
        
        // Handle specific error cases
        if (error.message.includes("Invalid login credentials") || 
            error.message.includes("invalid_credentials") ||
            error.status === 400) {
          message = "Invalid email or password. Please try again.";
        } else if (error.message.includes("Email not confirmed") || 
                   error.message.includes("email_not_confirmed")) {
          message = "Please verify your email before signing in.";
        } else if (error.message.includes("Too many requests") || 
                   error.message.includes("too_many_requests")) {
          message = "Too many attempts. Please wait and try again.";
        } else if (error.message.includes("User not found")) {
          message = "No account found with this email address.";
        } else if (error.message.includes("Failed to fetch") || 
                   error.message.includes("ERR_NAME_NOT_RESOLVED") ||
                   error.message.includes("NetworkError") ||
                   error.name === "AuthRetryableFetchError") {
          message = "Cannot connect to authentication server. Please check your internet connection and verify the Supabase configuration.";
          console.error("⚠️ Network/DNS Error - The Supabase URL may be incorrect or unreachable.");
          console.error("Current URL:", import.meta.env.VITE_SUPABASE_URL || "https://xybjydgqwthvzpgwhgah.supabase.co");
        } else if (error.message.includes("Network") || 
                   error.message.includes("fetch")) {
          message = "Network error. Please check your connection and try again.";
        } else {
          // Show the actual error message for debugging
          message = error.message || "An error occurred during sign in.";
        }
        
        toast({
          title: "Sign In Failed",
          description: message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if we got a session
      if (authData?.session && authData?.user) {
        // Fetch user role via SECURITY DEFINER RPC
        let role = "member";
        try {
          const { data, error } = await supabase.rpc("get_current_user_role");
          if (error) console.error("get_current_user_role error:", error);
          else if (typeof data === "string" && data) role = data.toLowerCase();
        } catch (err) {
          console.error("Unexpected error fetching role:", err);
        }

        // console.log("User role:", role); // Debug log

        // Admins and super admins bypass application status gating
        if (role === "super_admin" || role === "admin") {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
            navigate("/dashboard/leads");
        } else {
          // Members: gate access by membership application status
          let appStatus: string | null = null;
          try {
            const { data: statusData, error: statusErr } = await supabase.rpc(
              "get_application_status_by_email",
              { _email: data.email.trim() }
            );
            if (statusErr) {
              console.error("Error fetching application status:", statusErr);
            } else if (typeof statusData === "string") {
              appStatus = statusData;
            }
          } catch (err) {
            console.error("Unexpected error fetching application status:", err);
          }

          // If no application is found, treat as active (legacy/manual member)
          const status = appStatus ?? "active";

          if (status === "active") {
            toast({
              title: "Welcome back!",
              description: "You have successfully signed in.",
            });
            navigate("/dashboard/leads");
          } else {
            // Block access — sign out and show informative message
            await supabase.auth.signOut();
            const messages: Record<string, { title: string; description: string }> = {
              under_review: {
                title: "Profile under review",
                description: "Your profile is under review. You'll be able to log in once an admin approves your application.",
              },
              pending: {
                title: "Application pending",
                description: "Your application is pending. Please wait for admin review.",
              },
              rejected: {
                title: "Application rejected",
                description: "Your membership application has been rejected. Please contact support.",
              },
              suspended: {
                title: "Account suspended",
                description: "Your membership has been suspended. Please contact an administrator.",
              },
            };
            const msg = messages[status] ?? {
              title: "Access not allowed",
              description: `Your account status is "${status}". Please contact an administrator.`,
            };
            toast({ title: msg.title, description: msg.description, variant: "destructive" });
          }
        }
      } else {
        toast({
          title: "Sign In Failed",
          description: "No session was created. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Unexpected sign in error:", error);
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch") || 
            error.message.includes("ERR_NAME_NOT_RESOLVED") ||
            error.message.includes("NetworkError")) {
          errorMessage = "Cannot connect to authentication server. The Supabase URL may be incorrect or the project may not exist. Please check your Supabase configuration.";
          console.error("⚠️ CRITICAL: Supabase URL cannot be resolved. Please verify:");
          console.error("1. The Supabase project exists in your dashboard");
          console.error("2. The URL is correct (Settings > API > Project URL)");
          console.error("3. The project is not paused or deleted");
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Member Login | RBN — Rajput Business Network</title>
        <meta name="description" content="Sign in to the RBN member portal to access leads, networking tools, and your business profile." />
        <link rel="canonical" href="https://rajputbusinessnetwork.lovable.app/login" />
        <meta property="og:title" content="Member Login | RBN" />
        <meta property="og:description" content="Sign in to the RBN member portal." />
        <meta property="og:url" content="https://rajputbusinessnetwork.lovable.app/login" />
      </Helmet>
    <div className="min-h-screen flex flex-col bg-gradient-royal">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-card/70 hover:text-card transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <LanguageSwitcher />
          </div>
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6 bg-card/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <img 
                src={renLogo} 
                alt="Rajput Business Network" 
                className="h-16 w-auto"
              />
            </div>
            <h1 className="text-2xl font-display font-bold text-card mb-2">
              {t("login.welcome")}
            </h1>
            <p className="text-card/70 text-sm">
              {t("login.subtitle")}
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border/50">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  {t("login.email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className="pl-12"
                    {...register("email")}
                    aria-invalid={errors.email ? "true" : "false"}
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-sm animate-slide-in" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  {t("login.password")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-12 pr-12"
                    {...register("password")}
                    aria-invalid={errors.password ? "true" : "false"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm animate-slide-in" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {t("login.forgot")}
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="royal"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {t("login.signingIn")}
                  </span>
                ) : (
                  t("login.signIn")
                )}
              </Button>
            </form>

            {/* Invite-only notice */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                {t("login.notice1")}
                <br />
                <span className="text-foreground/80">
                  {t("login.notice2")}
                </span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-card/70 mt-8">
            &copy; {new Date().getFullYear()} {t("common.brandFull")}. {t("footer.rights")}
          </p>
        </div>
      </main>
    </div>
    </>
  );
};

export default Login;
