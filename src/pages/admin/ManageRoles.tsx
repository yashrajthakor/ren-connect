import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type Member = {
  member_id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  chapter_id: string | null;
  chapter_name: string | null;
  status: string | null;
  role_id: string | null;
  role_name: string | null;
};

const ROLES = ["member", "admin", "super_admin"] as const;

const roleBadgeClass = (role: string | null) => {
  switch ((role || "").toLowerCase()) {
    case "super_admin":
      return "bg-primary text-primary-foreground";
    case "admin":
      return "bg-secondary text-secondary-foreground";
    case "member":
      return "bg-muted text-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const ManageRoles = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ member: Member; newRole: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);
    const { data, error } = await supabase.rpc("list_members_with_roles");
    if (error) {
      toast({ title: "Failed to load members", description: error.message, variant: "destructive" });
      setMembers([]);
    } else {
      setMembers((data as Member[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchesSearch =
        !q ||
        m.full_name?.toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q);
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "none"
          ? !m.role_name
          : (m.role_name || "").toLowerCase() === roleFilter);
      return matchesSearch && matchesRole;
    });
  }, [members, search, roleFilter]);

  const requestRoleChange = (member: Member, newRole: string) => {
    if ((member.role_name || "").toLowerCase() === newRole) return;
    setPending({ member, newRole });
  };

  const confirmRoleChange = async () => {
    if (!pending) return;
    const { member, newRole } = pending;
    if (!member.user_id) {
      toast({ title: "Cannot update", description: "Member is not linked to a user account.", variant: "destructive" });
      setPending(null);
      return;
    }
    setUpdatingId(member.member_id);
    setPending(null);
    const { error } = await supabase.rpc("assign_user_role", {
      _user_id: member.user_id,
      _role_name: newRole,
    });
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role updated", description: `${member.full_name} is now ${newRole.replace("_", " ")}.` });
      await load();
    }
    setUpdatingId(null);
  };

  const isSelfDemotion =
    pending?.member.user_id === currentUserId && pending?.newRole !== "super_admin";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-md bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Manage Roles</h1>
            <p className="text-muted-foreground">Assign roles to active members.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r.replace("_", " ")}
                </SelectItem>
              ))}
              <SelectItem value="none">No role</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading members...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No members found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Full Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Chapter</TableHead>
                    <TableHead className="hidden lg:table-cell">Status</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead className="min-w-[200px]">Assign Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.member_id}>
                      <TableCell>
                        <div className="font-medium">{m.full_name}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{m.email || "—"}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{m.chapter_name || "—"}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          <Badge variant="outline" className="capitalize text-[10px]">{m.status || "—"}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{m.email || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{m.chapter_name || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="capitalize">{m.status || "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        {m.role_name ? (
                          <Badge className={`capitalize ${roleBadgeClass(m.role_name)}`}>
                            {m.role_name.replace("_", " ")}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">No role</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={(m.role_name || "").toLowerCase() || undefined}
                          onValueChange={(val) => requestRoleChange(m, val)}
                          disabled={!m.user_id || updatingId === m.member_id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm role change</AlertDialogTitle>
            <AlertDialogDescription>
              {pending && (
                <>
                  Change <strong>{pending.member.full_name}</strong>'s role to{" "}
                  <strong className="capitalize">{pending.newRole.replace("_", " ")}</strong>?
                  {isSelfDemotion && (
                    <span className="block mt-2 text-destructive font-medium">
                      Warning: You are about to demote yourself. You will lose super_admin access immediately.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageRoles;