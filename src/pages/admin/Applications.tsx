import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle2, XCircle, Clock, Eye, Ban, RefreshCw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import renLogo from "@/assets/ren-logo.png";

type AppStatus = "pending" | "under_review" | "active" | "rejected" | "suspended";

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
  city_name?: string | null;
  chapter_name?: string | null;
}

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

  const fetchApps = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("members")
      .select("*, cities(name), chapters(name)")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const mapped = (data || []).map((m: any) => ({
        ...m,
        city_name: m.cities?.name ?? null,
        chapter_name: m.chapters?.name ?? null,
      })) as Application[];
      setApps(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApps();
  }, []);

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
            <div className="overflow-x-auto">
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
                {(selected.profile_image || selected.profile_picture) && (
                  <img
                    src={(selected.profile_image || selected.profile_picture) as string}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover border-2 border-border"
                  />
                )}

                <Section title="Personal">
                  <Field label="Full Name" value={selected.full_name} />
                  <Field label="Email" value={selected.email} />
                  <Field label="Phone" value={selected.phone} />
                  <Field label="City" value={selected.city_name} />
                  <Field label="Chapter" value={selected.chapter_name} />
                </Section>

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

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-2 text-sm">
    <div className="text-muted-foreground">{label}</div>
    <div className="col-span-2 text-foreground">{value || <span className="text-muted-foreground italic">—</span>}</div>
  </div>
);

export default Applications;
