import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import renLogo from "@/assets/ren-logo.png";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast({
        title: "Reset link sent",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (err: any) {
      toast({
        title: "Could not send reset email",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password | RBN — Rajput Business Network</title>
        <meta name="description" content="Reset your RBN member portal password. Enter your email to receive a secure reset link." />
        <link rel="canonical" href="https://rajputbusinessnetwork.lovable.app/forgot-password" />
        <meta property="og:title" content="Forgot Password | RBN" />
        <meta property="og:description" content="Reset your RBN member portal password." />
        <meta property="og:url" content="https://rajputbusinessnetwork.lovable.app/forgot-password" />
      </Helmet>
    <div className="min-h-screen flex flex-col bg-gradient-royal">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md animate-fade-in">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-card/70 hover:text-card transition-colors text-sm font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6 bg-card/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <img src={renLogo} alt="REN" className="h-16 w-auto" />
            </div>
            <h1 className="text-2xl font-display font-bold text-card mb-2">
              Forgot your password?
            </h1>
            <p className="text-card/70 text-sm">
              Enter your email and we'll send you a reset link.
            </p>
          </div>
          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border/50">
            {sent ? (
              <div className="text-center space-y-4">
                <p className="text-foreground">
                  If an account exists for <span className="font-semibold">{email}</span>,
                  a password reset link has been sent.
                </p>
                <p className="text-sm text-muted-foreground">
                  Didn't get it? Check your spam folder or try again in a few minutes.
                </p>
                <Button asChild variant="royal" className="w-full">
                  <Link to="/login">Back to Sign In</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      className="pl-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" variant="royal" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;