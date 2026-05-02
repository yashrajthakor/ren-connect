import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, User, Phone, Building2, Check, ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import renLogo from "@/assets/ren-logo.png";
import LanguageSwitcher from "@/components/public/LanguageSwitcher";

// ============= Schemas per step =============
const step1Schema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  phone: z.string().trim().min(7, "Phone is required").max(20),
  email: z.string().trim().email("Valid email required").max(255),
  password: z.string().min(6, "Min 6 characters").max(128),
});

const step2Schema = z.object({
  businessName: z.string().trim().min(2, "Business name is required").max(160),
  categoryId: z.string().min(1, "Select a category"),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().min(2, "State is required").max(80),
  pincode: z.string().trim().max(15).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  website: z.string().trim().url("Invalid URL").max(255).optional().or(z.literal("")),
  services: z.string().trim().max(1000).optional().or(z.literal("")),
  gstNumber: z.string().trim().max(20).optional().or(z.literal("")),
});

const step3Schema = z.object({
  linkedin: z.string().trim().url("Invalid URL").max(255).optional().or(z.literal("")),
  instagram: z.string().trim().url("Invalid URL").max(255).optional().or(z.literal("")),
  facebook: z.string().trim().url("Invalid URL").max(255).optional().or(z.literal("")),
  referralCode: z.string().trim().max(40).optional().or(z.literal("")),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

type Category = { id: string; name: string };

const steps = ["Account", "Business", "Uploads & Socials"];

const Signup = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [s1, setS1] = useState<Step1 | null>(null);
  const [s2, setS2] = useState<Step2 | null>(null);

  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [visitingCard, setVisitingCard] = useState<File | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("business_categories").select("id,name").order("name");
        if (error) {
          console.error("Failed to fetch categories:", error);
          toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
        } else if (data) {
          setCategories(data as Category[]);
        }
      } catch (err) {
        console.error("Category fetch error:", err);
      }
    })();
  }, [toast]);

  const f1 = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: s1 || undefined });
  const f2 = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: s2 || undefined });
  const f3 = useForm<Step3>({ resolver: zodResolver(step3Schema) });

  const onStep1 = (data: Step1) => { setS1(data); setStep(2); };
  const onStep2 = (data: Step2) => { setS2(data); setStep(3); };

  const uploadFile = async (
    bucket: string,
    file: File | null,
    userId: string,
  ): Promise<string | null> => {
    if (!file) return null;
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) {
      console.error(`Upload to ${bucket} failed:`, error);
      return null;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const onFinalSubmit = async (data: Step3) => {
    if (!s1 || !s2) return;
    setLoading(true);
    try {
      // 1. Sign up auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: s1.email,
        password: s1.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: { full_name: s1.fullName, phone: s1.phone },
        },
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("No user created");

      // If email confirmation is enabled, no session yet — uploads / inserts may fail under RLS.
      // Try to sign in to obtain session for uploads.
      if (!authData.session) {
        await supabase.auth.signInWithPassword({ email: s1.email, password: s1.password });
      }

      // 2. Upload files
      const [profileUrl, logoUrl, cardUrl] = await Promise.all([
        uploadFile("profile-pictures", profilePic, userId),
        uploadFile("company-logos", companyLogo, userId),
        uploadFile("visiting-cards", visitingCard, userId),
      ]);

      // 3. Insert member
      const { data: memberRow, error: memberError } = await supabase
        .from("members")
        .insert({
          user_id: userId,
          full_name: s1.fullName,
          email: s1.email,
          phone: s1.phone,
          profile_picture: profileUrl,
          status: "under_review",
        })
        .select("id")
        .single();
      if (memberError) throw memberError;

      // 4. Insert business profile
      const { error: bpError } = await supabase.from("business_profiles").insert({
        member_id: memberRow.id,
        business_name: s2.businessName,
        category_id: s2.categoryId,
        city: s2.city,
        state: s2.state,
        pincode: s2.pincode || null,
        address: s2.address || null,
        website: s2.website || null,
        services: s2.services || null,
        gst_number: s2.gstNumber || null,
        logo: logoUrl,
        visiting_card: cardUrl,
        linkedin_url: data.linkedin || null,
        instagram_url: data.instagram || null,
        facebook_url: data.facebook || null,
        referral_code: data.referralCode || null,
      });
      if (bpError) throw bpError;

      toast({
        title: "Application submitted 🎉",
        description: "Your REN membership is under review. We'll notify you once approved.",
      });
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err: any) {
      console.error("Join REN error:", err);
      toast({
        title: "Submission failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-royal px-4 py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl animate-fade-in">
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-4 bg-card/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
            <img src={renLogo} alt="REN" className="h-14 w-auto" />
          </div>
          <h1 className="text-3xl font-display font-bold text-card mb-1">Join REN</h1>
          <p className="text-card/70 text-sm">Apply for membership · Rajput Entrepreneur Network</p>
        </div>

        <div className="bg-card rounded-2xl shadow-2xl p-6 sm:p-8 border border-border/50">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              {steps.map((label, i) => {
                const idx = i + 1;
                const active = step === idx;
                const done = step > idx;
                return (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                        done
                          ? "bg-primary text-primary-foreground border-primary"
                          : active
                          ? "border-primary text-primary"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : idx}
                    </div>
                    <span className={`text-xs sm:text-sm hidden sm:inline ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          {/* Step 1: Account */}
          {step === 1 && (
            <form onSubmit={f1.handleSubmit(onStep1)} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="fullName" className="pl-11" placeholder="Rajveer Singh" {...f1.register("fullName")} />
                </div>
                {f1.formState.errors.fullName && <p className="text-destructive text-xs mt-1">{f1.formState.errors.fullName.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" className="pl-11" placeholder="+91 98xxxxxxxx" {...f1.register("phone")} />
                </div>
                {f1.formState.errors.phone && <p className="text-destructive text-xs mt-1">{f1.formState.errors.phone.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-11" placeholder="you@company.com" {...f1.register("email")} />
                </div>
                {f1.formState.errors.email && <p className="text-destructive text-xs mt-1">{f1.formState.errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-11 pr-11"
                    placeholder="••••••••"
                    {...f1.register("password")}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {f1.formState.errors.password && <p className="text-destructive text-xs mt-1">{f1.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" variant="royal" size="lg" className="w-full">Continue</Button>
            </form>
          )}

          {/* Step 2: Business */}
          {step === 2 && (
            <form onSubmit={f2.handleSubmit(onStep2)} className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <div className="relative mt-1">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="businessName" className="pl-11" {...f2.register("businessName")} />
                </div>
                {f2.formState.errors.businessName && <p className="text-destructive text-xs mt-1">{f2.formState.errors.businessName.message}</p>}
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={f2.watch("categoryId") || ""}
                  onValueChange={(v) => f2.setValue("categoryId", v, { shouldValidate: true })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={categories.length === 0 ? "Loading..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No categories available</div>
                    ) : (
                      categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
                {f2.formState.errors.categoryId && <p className="text-destructive text-xs mt-1">{f2.formState.errors.categoryId.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" className="mt-1" {...f2.register("city")} />
                  {f2.formState.errors.city && <p className="text-destructive text-xs mt-1">{f2.formState.errors.city.message}</p>}
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" className="mt-1" {...f2.register("state")} />
                  {f2.formState.errors.state && <p className="text-destructive text-xs mt-1">{f2.formState.errors.state.message}</p>}
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" className="mt-1" {...f2.register("pincode")} />
                </div>
                <div>
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input id="gstNumber" className="mt-1" {...f2.register("gstNumber")} />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" className="mt-1" rows={2} {...f2.register("address")} />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" className="mt-1" placeholder="https://..." {...f2.register("website")} />
                {f2.formState.errors.website && <p className="text-destructive text-xs mt-1">{f2.formState.errors.website.message}</p>}
              </div>
              <div>
                <Label htmlFor="services">Services / Offerings</Label>
                <Textarea id="services" className="mt-1" rows={3} placeholder="What does your business do?" {...f2.register("services")} />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button type="submit" variant="royal" className="flex-1">Continue</Button>
              </div>
            </form>
          )}

          {/* Step 3: Uploads & Socials */}
          {step === 3 && (
            <form onSubmit={f3.handleSubmit(onFinalSubmit)} className="space-y-4">
              <FileUpload label="Profile Picture" file={profilePic} onChange={setProfilePic} accept="image/*" />
              <FileUpload label="Company Logo" file={companyLogo} onChange={setCompanyLogo} accept="image/*" />
              <FileUpload label="Visiting Card" file={visitingCard} onChange={setVisitingCard} accept="image/*,application/pdf" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input id="linkedin" className="mt-1" placeholder="https://linkedin.com/in/..." {...f3.register("linkedin")} />
                  {f3.formState.errors.linkedin && <p className="text-destructive text-xs mt-1">{f3.formState.errors.linkedin.message}</p>}
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram URL</Label>
                  <Input id="instagram" className="mt-1" placeholder="https://instagram.com/..." {...f3.register("instagram")} />
                </div>
                <div>
                  <Label htmlFor="facebook">Facebook URL</Label>
                  <Input id="facebook" className="mt-1" placeholder="https://facebook.com/..." {...f3.register("facebook")} />
                </div>
                <div>
                  <Label htmlFor="referralCode">Referral Code</Label>
                  <Input id="referralCode" className="mt-1" placeholder="Optional" {...f3.register("referralCode")} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={loading}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button type="submit" variant="royal" className="flex-1" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already a member?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// ============= File Upload Subcomponent =============
const FileUpload = ({
  label,
  file,
  onChange,
  accept,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  accept: string;
}) => {
  const id = `upload-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1 flex items-center gap-3">
        <label
          htmlFor={id}
          className="flex-1 flex items-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
        >
          <Upload className="h-4 w-4" />
          <span className="truncate">{file ? file.name : "Choose file"}</span>
        </label>
        <input
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        {file && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
};

export default Signup;