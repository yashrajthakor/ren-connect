import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import renLogo from "@/assets/ren-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type City = {
  id: string;
  name: string;
  state?: string | null;
  created_at?: string | null;
};

const Cities = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [stateName, setStateName] = useState("");

  const fetchCities = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("cities").select("*").order("name", { ascending: true });
    setLoading(false);
    if (error) {
      console.error("Error fetching cities:", error);
      toast({ title: "Error loading cities", description: error.message, variant: "destructive" });
      return;
    }
    setCities((data as City[]) || []);
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleAddCity = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Name required", description: "Please enter a city name." });
      return;
    }

    const payload = { name: trimmed, state: stateName.trim() || null };
    const { data, error } = await supabase.from("cities").insert(payload).select().limit(1).single();

    if (error) {
      console.error("Error inserting city:", error);
      toast({ title: "Error adding city", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "City added", description: `${(data as City).name} has been added.` });
    setDialogOpen(false);
    setName("");
    setStateName("");
    await fetchCities();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src={renLogo} alt="REN" className="h-10 w-auto" />
              <span className="font-display font-bold text-lg text-foreground">Cities</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Manage Cities</h1>
            <p className="text-muted-foreground mt-1">Add and manage city locations</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => fetchCities()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="royal">
                  <Plus className="h-4 w-4 mr-2" />
                  Add City
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add City</DialogTitle>
                  <DialogDescription>Enter a name and optional state for the city.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddCity} className="grid gap-4 mt-4">
                  <div>
                    <Label htmlFor="city-name">Name</Label>
                    <Input id="city-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nairobi" />
                  </div>

                  <div>
                    <Label htmlFor="city-state">State (optional)</Label>
                    <Input id="city-state" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="e.g. California" />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create City</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* List / Table */}
        <div className="bg-card rounded-xl border border-border p-6">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading cities…</div>
          ) : cities.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No cities yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">Cities will be listed here. Click "Add City" to create your first city.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="w-24">{c.id}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.state || "—"}</TableCell>
                    <TableCell className="w-44 text-muted-foreground">
                      {c.created_at ? new Date(c.created_at).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
};

export default Cities;
