import { useEffect, useState } from "react";
import { Loader2, Save, Upload, User as UserIcon, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Profile = {
  member_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  profile_picture: string | null;
  profile_image: string | null;
  status: string | null;
  chapter_id: string | null;
  city_id: string | null;
  chapter_name: string | null;
  city_name: string | null;
  committee_badge: string | null;
  business_profile_id: string | null;
  business_name: string | null;
  category_id: string | null;
  business_city: string | null;
  business_state: string | null;
  pincode: string | null;
  business_address: string | null;
  website: string | null;
  services: string | null;
  gst_number: string | null;
  logo: string | null;
  visiting_card: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  category_name: string | null;
};

type Category = { id: string; name: string };
type Lookup = { id: string; name: string };

const MyProfile = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [chapters, setChapters] = useState<Lookup[]>([]);
  const [cities, setCities] = useState<Lookup[]>([]);

  // Member fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [chapterId, setChapterId] = useState<string>("");
  const [cityId, setCityId] = useState<string>("");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

  // Business fields
  const [businessName, setBusinessName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessState, setBusinessState] = useState("");
  const [pincode, setPincode] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [services, setServices] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const [{ data: p, error: pErr }, cats, chs, cts] = await Promise.all([
          supabase.rpc("get_my_profile"),
          supabase.from("business_categories").select("id,name").order("name"),
          (supabase as any).from("chapters").select("id,name").order("name"),
          (supabase as any).from("cities").select("id,name").order("name"),
        ]);
        if (pErr) console.error(pErr);
        const prof = (p as Profile) || null;
        setProfile(prof);
        setCategories((cats.data as Category[]) || []);
        setChapters((chs.data as Lookup[]) || []);
        setCities((cts.data as Lookup[]) || []);

        if (prof) {
          setFullName(prof.full_name || "");
          setPhone(prof.phone || "");
          setChapterId(prof.chapter_id || "");
          setCityId(prof.city_id || "");
          setProfilePicUrl(prof.profile_picture || prof.profile_image || null);
          setBusinessName(prof.business_name || "");
          setCategoryId(prof.category_id || "");
          setBusinessCity(prof.business_city || "");
          setBusinessState(prof.business_state || "");
          setPincode(prof.pincode || "");
          setBusinessAddress(prof.business_address || "");
          setWebsite(prof.website || "");
          setServices(prof.services || "");
          setLogoUrl(prof.logo || null);
          setCardUrl(prof.visiting_card || null);
          setLinkedin(prof.linkedin_url || "");
          setInstagram(prof.instagram_url || "");
          setFacebook(prof.facebook_url || "");
        }
      } catch (e) {
        console.error(e);
        toast({ title: "Failed to load profile", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const uploadFile = async (bucket: string, file: File): Promise<string | null> => {
    if (!userId) return null;
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) {
      toast({ title: `Upload failed`, description: error.message, variant: "destructive" });
      return null;
    }
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const onPick = (bucket: string, setter: (url: string | null) => void) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await uploadFile(bucket, file);
      if (url) setter(url);
    };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      // Update member
      const { error: mErr } = await (supabase as any)
        .from("members")
        .update({
          full_name: fullName,
          phone,
          chapter_id: chapterId || null,
          city_id: cityId || null,
          profile_picture: profilePicUrl,
        })
        .eq("id", profile.member_id);
      if (mErr) throw mErr;

      const bpPayload = {
        business_name: businessName,
        category_id: categoryId || null,
        city: businessCity || null,
        state: businessState || null,
        pincode: pincode || null,
        address: businessAddress || null,
        website: website || null,
        services: services || null,
        logo: logoUrl,
        visiting_card: cardUrl,
        linkedin_url: linkedin || null,
        instagram_url: instagram || null,
        facebook_url: facebook || null,
      };

      if (profile.business_profile_id) {
        const { error: bErr } = await (supabase as any)
          .from("business_profiles")
          .update(bpPayload)
          .eq("id", profile.business_profile_id);
        if (bErr) throw bErr;
      } else {
        const { error: bErr } = await (supabase as any)
          .from("business_profiles")
          .insert({ ...bpPayload, member_id: profile.member_id });
        if (bErr) throw bErr;
      }

      toast({ title: "Profile updated", description: "Changes are now visible in the directory." });
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-muted-foreground">No member record found for your account.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update your personal and business information. Changes appear in the directory immediately.
        </p>
        {profile.committee_badge && (
          <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            <Award className="h-3.5 w-3.5" />
            {profile.committee_badge}
          </span>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-muted overflow-hidden flex items-center justify-center border">
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <Label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent">
              <Upload className="h-4 w-4" /> Change picture
              <input type="file" accept="image/*" className="hidden" onChange={onPick("profile-pictures", setProfilePicUrl)} />
            </Label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile.email || ""} disabled />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Chapter</Label>
              <Select value={chapterId} onValueChange={setChapterId}>
                <SelectTrigger><SelectValue placeholder="Select chapter" /></SelectTrigger>
                <SelectContent>
                  {chapters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>City</Label>
              <Select value={cityId} onValueChange={setCityId}>
                <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Business Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Business Name</Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Business City</Label>
              <Input value={businessCity} onChange={(e) => setBusinessCity(e.target.value)} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={businessState} onChange={(e) => setBusinessState(e.target.value)} />
            </div>
            <div>
              <Label>Pincode</Label>
              <Input value={pincode} onChange={(e) => setPincode(e.target.value)} />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div>
            <Label>Business Address</Label>
            <Textarea rows={2} value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
          </div>
          <div>
            <Label>Services / Offerings</Label>
            <Textarea rows={3} value={services} onChange={(e) => setServices(e.target.value)} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Company Logo</Label>
              <div className="flex items-center gap-3 mt-1">
                {logoUrl && <img src={logoUrl} alt="Logo" className="h-14 w-14 object-contain border rounded" />}
                <Label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent">
                  <Upload className="h-4 w-4" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={onPick("company-logos", setLogoUrl)} />
                </Label>
              </div>
            </div>
            <div>
              <Label>Visiting Card</Label>
              <div className="flex items-center gap-3 mt-1">
                {cardUrl && <img src={cardUrl} alt="Card" className="h-14 w-14 object-cover border rounded" />}
                <Label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent">
                  <Upload className="h-4 w-4" /> Upload
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onPick("visiting-cards", setCardUrl)} />
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label>LinkedIn</Label>
            <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div>
            <Label>Facebook</Label>
            <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} variant="royal" size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default MyProfile;
