import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle2, XCircle, Clock, Eye, Ban, RefreshCw, Share2, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import renLogo from "@/assets/ren-logo.png";

type AppStatus = "pending" | "under_review" | "active" | "rejected" | "suspended";

type ProfileType = "business" | "job";

interface Application {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  city_id: string | null;
  chapter_id: string | null;
  profile_image: string | null;
  profile_picture: string | null;
  status: AppStatus;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  committee_badge?: string | null;
  city_name?: string | null;
  chapter_name?: string | null;
  profile_type?: ProfileType | null;
  business_name?: string | null;
  category_name?: string | null;
  business_city?: string | null;
  business_state?: string | null;
  pincode?: string | null;
  business_address?: string | null;
  website?: string | null;
  services?: string | null;
  gst_number?: string | null;
  logo?: string | null;
  visiting_card?: string | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  business_profile_id?: string | null;
  referral_person?: string | null;
}

type MemberOption = { id: string; full_name: string };

const PROFILE_TYPE_LABEL: Record<ProfileType, string> = {
  business: "Business",
  job: "Job / Working Professional",
};

const mapMemberRow = (m: any): Application => {
  const bp = Array.isArray(m.business_profiles) ? m.business_profiles[0] : m.business_profiles;
  return {
    ...m,
    city_name: m.cities?.name ?? null,
    chapter_name: m.chapters?.name ?? null,
    profile_type: bp?.profile_type ?? null,
    business_name: bp?.business_name ?? null,
    category_name: bp?.business_categories?.name ?? null,
    business_city: bp?.city ?? null,
    business_state: bp?.state ?? null,
    pincode: bp?.pincode ?? null,
    business_address: bp?.address ?? null,
    website: bp?.website ?? null,
    services: bp?.services ?? null,
    gst_number: bp?.gst_number ?? null,
    logo: bp?.logo ?? null,
    visiting_card: bp?.visiting_card ?? null,
    linkedin_url: bp?.linkedin_url ?? null,
    instagram_url: bp?.instagram_url ?? null,
    facebook_url: bp?.facebook_url ?? null,
    business_profile_id: bp?.id ?? null,
    referral_person: bp?.referral_person ?? null,
  };
};

const STATUS_STYLES: Record<AppStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  under_review: "bg-blue-100 text-blue-800 border-blue-300",
  active: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
  suspended: "bg-gray-200 text-gray-800 border-gray-300",
};

const STATUS_LABEL: Record<AppStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  active: "Active",
  rejected: "Rejected",
  suspended: "Suspended",
};

const buildApprovalMessage = (name: string, email: string | null) =>
  `Jay Mataji ${name},\n\nYour profile has been approved successfully.\n\nYou are now officially listed in the REN Business Directory.\n\n**Login Details:**\nRegistered Email ID: ${email ?? "—"}\n\n**Login Here:**\nhttps://www.rajputbusinessnetwork.com/login\n\n**Important:**\nFor the best experience, please open the website in Google Chrome (recommended) or any modern browser that supports PWA apps.\n\nAfter login:\n* Click "Add to Home Screen"\n* Allow Notifications for future business updates, leads, and community announcements\n\nThank you for joining Rajput Business Network (RBN).\nWe look forward to growing together.`;

const buildWhatsAppUrl = (phone: string | null, message: string) => {
  if (!phone) return null;
  const normalized = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
};

const Applications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | AppStatus>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [savingReferralId, setSavingReferralId] = useState<string | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("members")
      .select(
        `*,
        cities(name),
        chapters(name),
        business_profiles(
          id,
          profile_type,
          business_name,
          city,
          state,
          pincode,
          address,
          website,
          services,
          gst_number,
          logo,
          visiting_card,
          linkedin_url,
          instagram_url,
          facebook_url,
          referral_person,
          business_categories(name)
        )`
      )
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setApps((data || []).map(mapMemberRow));
    }
    setLoading(false);
  };

  const fetchMemberOptions = async () => {
    const { data } = await (supabase as any)
      .from("members")
      .select("id, full_name")
      .order("full_name");
    if (data) setMemberOptions(data as MemberOption[]);
  };

  useEffect(() => {
    fetchApps();
    fetchMemberOptions();
  }, []);

  const saveReferralPerson = async (app: Application, referralPerson: string | null) => {
    if (!app.business_profile_id) {
      toast({
        title: "Cannot update",
        description: "This applicant has no business profile record.",
        variant: "destructive",
      });
      return;
    }
    setSavingReferralId(app.id);
    const value = referralPerson?.trim() || null;
    const { error } = await (supabase as any)
      .from("business_profiles")
      .update({ referral_person: value })
      .eq("id", app.business_profile_id);
    setSavingReferralId(null);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Referral person updated" });
    setApps((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, referral_person: value } : a))
    );
    if (selected?.id === app.id) setSelected({ ...selected, referral_person: value });
  };

  const updateStatus = async (id: string, status: AppStatus) => {
    setUpdatingId(id);
    const { data: { user } } = await supabase.auth.getUser();
    const patch: Record<string, any> = { status };
    if (status === "active") {
      patch.approved_at = new Date().toISOString();
      patch.approved_by = user?.id ?? null;
    }
    const { error } = await (supabase as any)
      .from("members")
      .update(patch)
      .eq("id", id);
    setUpdatingId(null);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Status updated",
      description: `Application marked as ${STATUS_LABEL[status]}.`,
    });
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const filtered = apps.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.full_name.toLowerCase().includes(s) ||
      (a.email || "").toLowerCase().includes(s) ||
      (a.phone || "").toLowerCase().includes(s) ||
      (a.city_name || "").toLowerCase().includes(s)
    );
  });

  const counts = apps.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      acc.all++;
      return acc;
    },
    { all: 0, pending: 0, under_review: 0, active: 0, rejected: 0, suspended: 0 } as Record<string, number>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src={renLogo} alt="REN" className="h-10 w-auto" />
              <span className="font-display font-bold text-lg text-foreground">
                Membership Applications
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Applications</h1>
            <p className="text-muted-foreground mt-1">
              Review and approve new membership applications
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search name, email, business..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />
            <Button variant="outline" size="icon" onClick={fetchApps} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="under_review">Under Review ({counts.under_review || 0})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({counts.pending || 0})</TabsTrigger>
            <TabsTrigger value="active">Active ({counts.active || 0})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected || 0})</TabsTrigger>
            <TabsTrigger value="suspended">Suspended ({counts.suspended || 0})</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No applications</h2>
            <p className="text-muted-foreground">No applications match your filter.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Mobile card list */}
            <ul className="md:hidden divide-y divide-border">
              {filtered.map((a) => (
                <li key={a.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{a.full_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.phone || "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.email || "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {a.city_name || "—"}{a.chapter_name ? ` · ${a.chapter_name}` : ""}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(a.submitted_at || a.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline" className={`${STATUS_STYLES[a.status]} shrink-0`}>
                      {STATUS_LABEL[a.status]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelected(a)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    {a.phone ? (
                      <Button size="sm" variant="secondary" asChild>
                        <a
                          href={buildWhatsAppUrl(a.phone, buildApprovalMessage(a.full_name, a.email)) ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Share2 className="h-4 w-4 mr-1" /> Share
                        </a>
                      </Button>
                    ) : null}
                    {a.status !== "active" && (
                      <Button
                        size="sm"
                        disabled={updatingId === a.id}
                        onClick={() => updateStatus(a.id, "active")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    )}
                    {a.status !== "rejected" && a.status !== "active" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={updatingId === a.id}
                        onClick={() => updateStatus(a.id, "rejected")}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    )}
                    {a.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === a.id}
                        onClick={() => updateStatus(a.id, "suspended")}
                      >
                        <Ban className="h-4 w-4 mr-1" /> Suspend
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {/* Desktop / tablet table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold min-w-[200px]">Applicant</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">Contact</th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">City / Chapter</th>
                    <th className="px-4 py-3 font-semibold hidden lg:table-cell">Submitted</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{a.full_name}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{a.phone || "—"} · {a.email || "—"}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{a.city_name || "—"} {a.chapter_name ? `· ${a.chapter_name}` : ""}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{new Date(a.submitted_at || a.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="font-medium">{a.phone || "—"}</div>
                        <div className="text-xs text-muted-foreground">{a.email || "—"}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div>{a.city_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{a.chapter_name || ""}</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                        {new Date(a.submitted_at || a.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={STATUS_STYLES[a.status]}>
                          {STATUS_LABEL[a.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelected(a)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {a.phone ? (
                            <Button size="sm" variant="secondary" asChild>
                              <a
                                href={buildWhatsAppUrl(a.phone, buildApprovalMessage(a.full_name, a.email)) ?? undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Share2 className="h-4 w-4 mr-1" /> Share
                              </a>
                            </Button>
                          ) : null}
                          {a.status !== "active" && (
                            <Button
                              size="sm"
                              variant="default"
                              disabled={updatingId === a.id}
                              onClick={() => updateStatus(a.id, "active")}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                            </Button>
                          )}
                          {a.status !== "rejected" && a.status !== "active" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={updatingId === a.id}
                              onClick={() => updateStatus(a.id, "rejected")}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          )}
                          {a.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingId === a.id}
                              onClick={() => updateStatus(a.id, "suspended")}
                            >
                              <Ban className="h-4 w-4 mr-1" /> Suspend
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selected.full_name}
                  <Badge variant="outline" className={STATUS_STYLES[selected.status]}>
                    {STATUS_LABEL[selected.status]}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div className="flex flex-wrap items-start gap-4">
                  {(selected.profile_image || selected.profile_picture) && (
                    <img
                      src={(selected.profile_image || selected.profile_picture) as string}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover border-2 border-border shrink-0"
                    />
                  )}
                  {selected.logo && (
                    <img
                      src={selected.logo}
                      alt="Company logo"
                      className="h-24 w-24 rounded-lg object-contain border border-border bg-muted/30 shrink-0"
                    />
                  )}
                </div>

                <Section title="Personal">
                  <Field label="Full Name" value={selected.full_name} />
                  <Field label="Email" value={selected.email} />
                  <Field label="Phone" value={selected.phone} />
                  <Field
                    label="Profile Type"
                    value={
                      selected.profile_type
                        ? PROFILE_TYPE_LABEL[selected.profile_type]
                        : null
                    }
                  />
                  <Field label="Chapter" value={selected.chapter_name} />
                  <Field label="City (Member)" value={selected.city_name} />
                  {selected.committee_badge ? (
                    <Field label="Committee Badge" value={selected.committee_badge} />
                  ) : null}
                </Section>

                <Section title={selected.profile_type === "job" ? "Professional" : "Business"}>
                  <Field
                    label={selected.profile_type === "job" ? "Company Name" : "Business Name"}
                    value={selected.business_name}
                  />
                  <Field label="Category" value={selected.category_name} />
                  <Field label="Services / Description" value={selected.services} />
                  <Field label="GST Number" value={selected.gst_number} />
                </Section>

                <Section title="Location">
                  <Field label="City" value={selected.business_city} />
                  <Field label="State" value={selected.business_state} />
                  <Field label="Pincode" value={selected.pincode} />
                  <Field label="Address" value={selected.business_address} />
                </Section>

                <Section title="Referral & Social">
                  <ReferralPersonField
                    value={selected.referral_person}
                    memberId={selected.id}
                    businessProfileId={selected.business_profile_id}
                    memberOptions={memberOptions}
                    saving={savingReferralId === selected.id}
                    onSave={(v) => saveReferralPerson(selected, v)}
                  />
                  <Field label="Website" value={selected.website ? <LinkValue href={selected.website} /> : null} />
                  <Field label="LinkedIn" value={selected.linkedin_url ? <LinkValue href={selected.linkedin_url} /> : null} />
                  <Field label="Instagram" value={selected.instagram_url ? <LinkValue href={selected.instagram_url} /> : null} />
                  <Field label="Facebook" value={selected.facebook_url ? <LinkValue href={selected.facebook_url} /> : null} />
                </Section>

                {selected.visiting_card && (
                  <Section title="Documents">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Visiting Card</div>
                      {selected.visiting_card.toLowerCase().endsWith(".pdf") ? (
                        <a
                          href={selected.visiting_card}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Open PDF
                        </a>
                      ) : (
                        <img
                          src={selected.visiting_card}
                          alt="Visiting card"
                          className="max-h-48 rounded-lg border border-border object-contain"
                        />
                      )}
                    </div>
                  </Section>
                )}

                <Section title="Application">
                  <Field
                    label="Submitted"
                    value={
                      selected.submitted_at
                        ? new Date(selected.submitted_at).toLocaleString()
                        : new Date(selected.created_at).toLocaleString()
                    }
                  />
                  <Field
                    label="Approved At"
                    value={
                      selected.approved_at
                        ? new Date(selected.approved_at).toLocaleString()
                        : null
                    }
                  />
                  <Field label="Rejection Reason" value={selected.rejection_reason} />
                </Section>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  {selected.phone ? (
                    <Button size="sm" variant="secondary" asChild>
                      <a
                        href={buildWhatsAppUrl(selected.phone, buildApprovalMessage(selected.full_name, selected.email)) ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Share2 className="h-4 w-4 mr-2" /> Share Approval
                      </a>
                    </Button>
                  ) : null}
                  {selected.status !== "active" && (
                    <Button
                      onClick={() => updateStatus(selected.id, "active")}
                      disabled={updatingId === selected.id}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                    </Button>
                  )}
                  {selected.status !== "under_review" && (
                    <Button
                      variant="outline"
                      onClick={() => updateStatus(selected.id, "under_review")}
                      disabled={updatingId === selected.id}
                    >
                      <Clock className="h-4 w-4 mr-2" /> Mark Under Review
                    </Button>
                  )}
                  {selected.status !== "rejected" && (
                    <Button
                      variant="destructive"
                      onClick={() => updateStatus(selected.id, "rejected")}
                      disabled={updatingId === selected.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                  )}
                  {selected.status === "active" && (
                    <Button
                      variant="outline"
                      onClick={() => updateStatus(selected.id, "suspended")}
                      disabled={updatingId === selected.id}
                    >
                      <Ban className="h-4 w-4 mr-2" /> Suspend
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const LinkValue = ({ href }: { href: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
    {href}
  </a>
);

const ReferralPersonField = ({
  value,
  memberId,
  businessProfileId,
  memberOptions,
  saving,
  onSave,
}: {
  value: string | null | undefined;
  memberId: string;
  businessProfileId: string | null | undefined;
  memberOptions: MemberOption[];
  saving: boolean;
  onSave: (value: string | null) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  const filteredMembers = memberOptions
    .filter((m) => {
      if (m.id === memberId) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return m.full_name.toLowerCase().includes(q);
    })
    .slice(0, search.trim() ? 50 : 40);

  const handleSave = () => {
    onSave(draft.trim() || null);
    setEditing(false);
    setSearch("");
  };

  const handleCancel = () => {
    setDraft(value ?? "");
    setEditing(false);
    setSearch("");
  };

  if (!editing) {
    return (
      <div className="grid grid-cols-3 gap-2 text-sm items-start">
        <div className="text-muted-foreground pt-0.5">Referral Person</div>
        <div className="col-span-2 flex items-start justify-between gap-2">
          <span className="text-foreground">
            {value || <span className="text-muted-foreground italic">—</span>}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 h-8"
            disabled={!businessProfileId}
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/20">
      <div className="text-sm font-medium text-foreground">Referral Person</div>
      <p className="text-xs text-muted-foreground">Select a member from the directory or type a name.</p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          className="pl-9 h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="max-h-40 overflow-y-auto border border-border rounded-md divide-y bg-card">
        {filteredMembers.length === 0 ? (
          <div className="p-3 text-center text-xs text-muted-foreground">No members match</div>
        ) : (
          filteredMembers.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors ${
                draft === m.full_name ? "bg-primary/10 font-medium" : ""
              }`}
              onClick={() => setDraft(m.full_name)}
            >
              {m.full_name}
            </button>
          ))
        )}
      </div>
      <div>
        <Label htmlFor="referral-person-custom" className="text-xs text-muted-foreground">
          Selected / custom name
        </Label>
        <Input
          id="referral-person-custom"
          className="mt-1 h-9"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Member name or custom referral"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => setDraft("")}
          disabled={saving}
        >
          Clear
        </Button>
      </div>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-2 text-sm">
    <div className="text-muted-foreground">{label}</div>
    <div className="col-span-2 text-foreground">{value || <span className="text-muted-foreground italic">—</span>}</div>
  </div>
);

export default Applications;
