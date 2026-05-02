import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, User, Phone, Building2, Check, ArrowLeft, Upload, MapPin } from "lucide-react";
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

// ============= Schemas =============
const step1Schema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().min(7, "Phone is required").max(20),
  city: z.string().trim().min(2, "City is required").max(80),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  referralCode: z.string().trim().max(40).optional().or(z.literal("")),
});

const step2Schema = z.object({
  businessName: z.string().trim().min(2, "Business name is required").max(160),
  businessCategory: z.string().min(1, "Select a category"),
  services: z.string().trim().max(1000).optional().or(z.literal("")),
  businessAddress: z.string().trim().max(500).optional().or(z.literal("")),
  website: z.string().trim().url("Invalid URL").max(255).optional().or(z.literal("")),
});

const step3Schema = z.object({
  linkedin: z.string().trim().url("Invalid URL").max(255).optional().or(z.literal("")),
  instagram: z.string().trim().url("Invalid URL").max(255).optional().or(z.literal("")),
  facebook: z.string().trim().url("Invalid URL").max(255).optional().or(z.literal("")),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

type Category = { id: string; name: string };

const steps = ["Personal", "Business", "Uploads & Socials"];

const Signup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
      const { data, error } = await supabase
        .from("business_categories")
        .select("id,name")
        .order("name");
      if (error) {
        console.error("Failed to fetch categories:", error);
      } else if (data) {
        setCategories(data as Category[]);
      }
    })();
  }, []);

  const f1 = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: s1 || undefined });
  const f2 = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: s2 || undefined });
  const f3 = useForm<Step3>({ resolver: zodResolver(step3Schema) });

  const onStep1 = (data: Step1) => { setS1(data); setStep(2); };
  const onStep2 = (data: Step2) => { setS2(data); setStep(3); };

  const uploadFile = async (file: File | null, folder: string): Promise<string | null> => {
    if (!file) return null;
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("application-uploads")
      .upload(path, file, { upsert: false });
    if (error) {
      console.error(`Upload to ${folder} failed:`, error);
      return null;
    }
    const { data } = supabase.storage.from("application-uploads").getPublicUrl(path);
    return data.publicUrl;
  };

  const onFinalSubmit = async (data: Step3) => {
    if (!s1 || !s2) return;
    setLoading(true);
    try {
      const [profileUrl, logoUrl, cardUrl] = await Promise.all([
        uploadFile(profilePic, "profile-pictures"),
        uploadFile(companyLogo, "company-logos"),
        uploadFile(visitingCard, "visiting-cards"),
      ]);

      const { error } = await supabase.from("membership_applications" as any).insert({
        full_name: s1.fullName,
        email: s1.email,
        phone: s1.phone,
        city: s1.city,
        address: s1.address || null,
        referral_code: s1.referralCode || null,
        business_name: s2.businessName,
        business_category: s2.businessCategory,
        services: s2.services || null,
        business_address: s2.businessAddress || null,
        website: s2.website || null,
        profile_picture_url: profileUrl,
        company_logo_url: logoUrl,
        visiting_card_url: cardUrl,
        linkedin_url: data.linkedin || null,
        instagram_url: data.instagram || null,
        facebook_url: data.facebook || null,
        status: "pending_review",
      });
      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Application submitted 🎉",
        description: "Your REN membership application has been submitted for admin review.",
      });
    } catch (err: any) {
      console.error("Application submit error:", err);
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
          <h1 className="text-3xl font-display font-bold text-card mb-1">Apply for REN Membership</h1>
          <p className="text-card/70 text-sm">Rajput Entrepreneur Network · No account required</p>
        </div>

        <div className="bg-card rounded-2xl shadow-2xl p-6 sm:p-8 border border-border/50">
          {submitted ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Application Submitted</h2>
              <p className="text-muted-foreground mb-6">
                Your REN membership application has been submitted for admin review.
                We will reach out to you on <span className="font-medium text-foreground">{s1?.email}</span> once it is approved.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/")}>Back to Home</Button>
                <Button variant="royal" onClick={() => navigate("/login")}>Member Login</Button>
              </div>
            </div>
          ) : (
            <>
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

              {/* Step 1: Personal */}
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
                    <Label htmlFor="email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" className="pl-11" placeholder="you@company.com" {...f1.register("email")} />
                    </div>
                    {f1.formState.errors.email && <p className="text-destructive text-xs mt-1">{f1.formState.errors.email.message}</p>}
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
                    <Label htmlFor="city">City</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="city" className="pl-11" placeholder="Jaipur" {...f1.register("city")} />
                    </div>
                    {f1.formState.errors.city && <p className="text-destructive text-xs mt-1">{f1.formState.errors.city.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" className="mt-1" rows={2} {...f1.register("address")} />
                  </div>
                  <div>
                    <Label htmlFor="referralCode">Referral Code (optional)</Label>
                    <Input id="referralCode" className="mt-1" {...f1.register("referralCode")} />
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
                    <Label>Business Category</Label>
                    <Select
                      value={f2.watch("businessCategory") || ""}
                      onValueChange={(v) => f2.setValue("businessCategory", v, { shouldValidate: true })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={categories.length === 0 ? "Loading..." : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No categories available</div>
                        ) : (
                          categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)
                        )}
                      </SelectContent>
                    </Select>
                    {f2.formState.errors.businessCategory && <p className="text-destructive text-xs mt-1">{f2.formState.errors.businessCategory.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="services">Services Offered</Label>
                    <Textarea id="services" className="mt-1" rows={3} placeholder="What does your business offer?" {...f2.register("services")} />
                  </div>
                  <div>
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <Textarea id="businessAddress" className="mt-1" rows={2} {...f2.register("businessAddress")} />
                  </div>
                  <div>
                    <Label htmlFor="website">Website (optional)</Label>
                    <Input id="website" className="mt-1" placeholder="https://..." {...f2.register("website")} />
                    {f2.formState.errors.website && <p className="text-destructive text-xs mt-1">{f2.formState.errors.website.message}</p>}
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="submit" variant="royal" className="flex-1">Continue</Button>
                  </div>
                </form>
              )}

              {/* Step 3 */}
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
                    <div className="sm:col-span-2">
                      <Label htmlFor="facebook">Facebook URL</Label>
                      <Input id="facebook" className="mt-1" placeholder="https://facebook.com/..." {...f3.register("facebook")} />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

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
