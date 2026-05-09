import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import renLogo from "@/assets/ren-logo.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase parses recovery tokens from URL automatically (detectSessionInUrl)
    // Wait for either an existing session or PASSWORD_RECOVERY event.
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Reset failed", description: err?.message || "Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <h1 className="text-2xl font-display font-bold text-card mb-2">Set a new password</h1>
            <p className="text-card/70 text-sm">Choose a strong password you haven't used before.</p>
          </div>
          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border/50">
            {!ready ? (
              <p className="text-center text-sm text-muted-foreground">
                Validating reset link… If this doesn't load, request a new link from
                {" "}<Link to="/forgot-password" className="text-primary font-medium">Forgot Password</Link>.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="pw">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="pw"
                      type={show ? "text" : "password"}
                      className="pl-12 pr-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpw">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="cpw"
                      type={show ? "text" : "password"}
                      className="pl-12"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" variant="royal" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;