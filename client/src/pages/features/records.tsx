import { useState, useEffect } from "react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { 
  Plus, Search, Calendar, Activity, Syringe, HeartPulse, 
  X, Check, ShieldCheck, Tag, Info, Milk, Sparkles, RefreshCw, Trash2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export interface AnimalRecord {
  id: string;
  tagId?: string;
  name: string;
  breed: string;
  species: "Cow" | "Buffalo" | "Goat" | "Other" | string;
  age: string;
  milkYield: string;
  status: "Healthy" | "Due Vaccination" | "Under Treatment" | "Pregnant" | string;
  lastUpdate: string;
  vaccinationDate: string;
  ownerNotes?: string;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<AnimalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AnimalRecord | null>(null);

  // New Record Form state
  const [newTagId, setNewTagId] = useState("");
  const [newName, setNewName] = useState("");
  const [newBreed, setNewBreed] = useState("Gir Cow");
  const [newSpecies, setNewSpecies] = useState<"Cow" | "Buffalo" | "Goat" | "Other">("Cow");
  const [newAge, setNewAge] = useState("3 Yrs");
  const [newMilkYield, setNewMilkYield] = useState("12 L/day");
  const [newStatus, setNewStatus] = useState<"Healthy" | "Due Vaccination" | "Under Treatment" | "Pregnant">("Healthy");
  const [newNotes, setNewNotes] = useState("");

  // Fetch real records from PostgreSQL for the current authenticated user
  const loadRecords = async () => {
    setLoading(true);
    try {
      // Purge any stale legacy localStorage mock cache
      if (typeof window !== "undefined") {
        localStorage.removeItem("gaushala_animal_records");
      }
      const data = await apiClient<AnimalRecord[]>("/animals");
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Could not load animals from database:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleAddAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSaving(true);
    try {
      const generatedTagId = newTagId.trim() 
        ? newTagId.trim().toUpperCase() 
        : `TAG-${Math.floor(100 + Math.random() * 900)}`;

      const payload = {
        tagId: generatedTagId.startsWith("TAG-") ? generatedTagId : `TAG-${generatedTagId}`,
        name: newName.trim(),
        breed: newBreed,
        species: newSpecies,
        age: newAge,
        milkYield: newMilkYield,
        status: newStatus,
        lastUpdate: "Just now",
        vaccinationDate: new Date().toISOString().split("T")[0],
        ownerNotes: newNotes || "Newly registered animal record."
      };

      const created = await apiClient<AnimalRecord>("/animals", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setRecords((prev) => [created, ...prev]);
      toast.success(`${created.name} registered to your herd successfully!`);
      setIsAddModalOpen(false);

      // Reset Form
      setNewTagId("");
      setNewName("");
      setNewBreed("Gir Cow");
      setNewSpecies("Cow");
      setNewAge("3 Yrs");
      setNewMilkYield("12 L/day");
      setNewStatus("Healthy");
      setNewNotes("");
    } catch (err: any) {
      toast.error(err.message || "Failed to register animal into database");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnimal = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your herd?`)) return;
    setDeletingId(id);
    try {
      await apiClient(`/animals/${id}`, { method: "DELETE" });
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (selectedRecord?.id === id) setSelectedRecord(null);
      toast.success(`${name} removed from your database records.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((r.tagId || r.id).toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.breed.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "All" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalCattle = records.length;
  const totalMilk = records.reduce((sum, r) => {
    const val = parseInt(r.milkYield);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  const dueVaccinations = records.filter((r) => r.status === "Due Vaccination").length;
  const healthyCount = records.filter((r) => r.status === "Healthy").length;

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main className="pt-24 pb-16 container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs mb-2">
              <Sparkles className="w-3.5 h-3.5" /> HERD MANAGEMENT HUB
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Digital Animal Records</h1>
            <p className="text-muted-foreground mt-1">Manage health histories, milk production, and vaccination schedules for your livestock.</p>
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto h-12 px-6 rounded-2xl shadow-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="h-5 w-5" /> Add New Animal
          </Button>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Card className="border-border/60 shadow-md bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Registered</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{totalCattle} Animals</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-md bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Milk className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Milk Yield (Est.)</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{totalMilk} L/day</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-md bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Syringe className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vaccinations Due</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{dueVaccinations}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-md bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Healthy Cattle</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-0.5">{healthyCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Bar & Table */}
        <div className="bg-card border border-border/80 rounded-3xl shadow-lg overflow-hidden">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-muted/30">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, tag ID, or breed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["All", "Healthy", "Due Vaccination", "Pregnant"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    filterStatus === st
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-background hover:bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Card List (Phones & Small Tablets) */}
          <div className="block md:hidden divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2 text-sm font-semibold">
                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                <span>Loading animal records...</span>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-3">
                <p className="font-bold text-foreground text-base">No Records Found</p>
                <p className="text-xs">
                  {records.length === 0
                    ? "Your registry is empty. Tap '+ Add New Animal' to add your first animal."
                    : `No results matching "${searchQuery || filterStatus}".`}
                </p>
              </div>
            ) : (
              filteredRecords.map((r) => (
                <div key={r.id} className="p-4 space-y-3 hover:bg-muted/30 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                          {r.tagId || r.id}
                        </span>
                        <h3 className="font-bold text-foreground text-base">{r.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.species} · {r.breed} · {r.age}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                      r.status === "Healthy"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : r.status === "Due Vaccination"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        r.status === "Healthy" ? "bg-emerald-500" : r.status === "Due Vaccination" ? "bg-amber-500 animate-ping" : "bg-blue-500"
                      }`} />
                      {r.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl">
                    <span>Milk: <strong className="text-foreground">{r.milkYield}</strong></span>
                    <span>Updated: {r.lastUpdate}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRecord(r)}
                      className="flex-1 rounded-xl text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      View Health Card
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === r.id}
                      onClick={() => handleDeleteAnimal(r.id, r.name)}
                      className="rounded-xl text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-2"
                      title="Remove animal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="px-6 py-4 font-bold">Tag ID</th>
                  <th className="px-6 py-4 font-bold">Name</th>
                  <th className="px-6 py-4 font-bold">Species / Breed</th>
                  <th className="px-6 py-4 font-bold">Milk Yield</th>
                  <th className="px-6 py-4 font-bold">Health Status</th>
                  <th className="px-6 py-4 font-bold">Last Update</th>
                  <th className="px-6 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2.5 text-sm font-semibold">
                        <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                        <span>Loading your animal records from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                          <Activity className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-foreground text-base">No Animal Records Found</p>
                        <p className="text-xs text-muted-foreground">
                          {records.length === 0
                            ? "Your livestock registry is currently empty in the database. Click '+ Add New Animal' to register your first cow or buffalo."
                            : `No animal records found matching "${searchQuery || filterStatus}".`}
                        </p>
                        {records.length === 0 && (
                          <Button
                            onClick={() => setIsAddModalOpen(true)}
                            size="sm"
                            className="rounded-xl font-bold bg-primary text-primary-foreground text-xs mt-2"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Register First Animal
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/40 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">
                        <span className="bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">{r.tagId || r.id}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground text-sm">{r.name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="font-medium text-foreground">{r.breed}</span>
                        <span className="text-xs text-muted-foreground block">{r.species} · {r.age}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">{r.milkYield}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          r.status === "Healthy"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : r.status === "Due Vaccination"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            r.status === "Healthy" ? "bg-emerald-500" : r.status === "Due Vaccination" ? "bg-amber-500 animate-ping" : "bg-blue-500"
                          }`} />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{r.lastUpdate}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRecord(r)}
                            className="rounded-xl text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all"
                          >
                            View Health Card
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === r.id}
                            onClick={() => handleDeleteAnimal(r.id, r.name)}
                            className="rounded-xl text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            title="Remove animal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD NEW ANIMAL DIALOG MODAL */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="w-[94vw] sm:max-w-md bg-card border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" /> Register New Animal
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddAnimal} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Tag / Ear Ring ID</label>
                  <input
                    type="text"
                    placeholder="e.g. TAG-201"
                    value={newTagId}
                    onChange={(e) => setNewTagId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Animal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kamala"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Species</label>
                  <select
                    value={newSpecies}
                    onChange={(e) => setNewSpecies(e.target.value as any)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:border-primary"
                  >
                    <option value="Cow">Cow</option>
                    <option value="Buffalo">Buffalo</option>
                    <option value="Goat">Goat</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Breed</label>
                  <input
                    type="text"
                    placeholder="e.g. Gir / Murrah"
                    value={newBreed}
                    onChange={(e) => setNewBreed(e.target.value)}
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Age</label>
                  <input
                    type="text"
                    placeholder="3 Yrs"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Milk (L/day)</label>
                  <input
                    type="text"
                    placeholder="12 L/day"
                    value={newMilkYield}
                    onChange={(e) => setNewMilkYield(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Health Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-2 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary font-semibold"
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Due Vaccination">Due Vaccination</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Pregnant">Pregnant</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Notes / Medical History</label>
                <textarea
                  rows={2}
                  placeholder="Vaccination details, deworming history, notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="w-full sm:w-auto rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="w-full sm:w-auto rounded-xl font-bold bg-primary text-primary-foreground">
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> Saving to Database...
                    </>
                  ) : (
                    "Save Animal Record"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* VIEW ANIMAL HEALTH CARD MODAL */}
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          {selectedRecord && (
            <DialogContent className="w-[94vw] sm:max-w-lg bg-card border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                      {selectedRecord.tagId || selectedRecord.id}
                    </span>
                    <DialogTitle className="text-2xl font-bold mt-2 text-foreground">{selectedRecord.name}</DialogTitle>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedRecord.status === "Healthy"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}>
                    {selectedRecord.status}
                  </span>
                </div>
              </DialogHeader>

              <div className="space-y-4 my-2 text-sm">
                <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-2xl border border-border/50">
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block">Species & Breed</span>
                    <span className="font-bold text-foreground">{selectedRecord.species} ({selectedRecord.breed})</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block">Age</span>
                    <span className="font-bold text-foreground">{selectedRecord.age}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block">Average Milk Yield</span>
                    <span className="font-bold text-foreground">{selectedRecord.milkYield}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block">Last Vaccine Date</span>
                    <span className="font-bold text-foreground">{selectedRecord.vaccinationDate}</span>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> Owner & Health Notes
                  </h4>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {selectedRecord.ownerNotes || "No medical alerts filed."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteAnimal(selectedRecord.id, selectedRecord.name)}
                  className="rounded-xl text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Delete Animal
                </Button>
                <Button onClick={() => setSelectedRecord(null)} className="rounded-xl font-bold text-xs">
                  Close Health Card
                </Button>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
