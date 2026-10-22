import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Activity, 
  Search, 
  Download, 
  TrendingUp, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  Table as TableIcon,
  Compass,
  HeartPulse,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  Clock,
  Filter,
  X,
  SlidersHorizontal,
  KeyRound,
  Heart,
  Thermometer,
  ShieldAlert,
  Zap,
  Gauge,
  ArrowLeft,
  ShieldCheck,
  Layers,
  Users,
  Flame,
  Sparkles,
  Check,
  Eye,
  Footprints,
  Moon,
  Pencil
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { GoogleSheetCredentialsModal } from "./GoogleSheetCredentialsModal";
import { FarmerEstrusModal } from "./FarmerEstrusModal";
import { 
  CATTLE_CATALOG, 
  generateMultiCattleTelemetryData, 
  generateMultiCattleDailyView, 
  generateMultiCattleTableRows, 
  generateMultiCattleVerdictHistory, 
  generateMotionStatusSplit,
  generateMultiCattleMotionLogs,
  getTimeframeDateRangeStr,
  calculateEstrusCycleInfo,
  CattleProfile,
  MultiCattlePoint,
  MultiCattleTableRow,
  EstrusCycleInfo
} from "./multiCattleData";

const SHEET_ID = "1f1PUwft6W6PWx1z19JLwzKjwdKdGkf04bmPINPAGAaw";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?pli=1&gid=0#gid=0`;

interface TelemetryRow {
  id: string;
  timestamp: string;
  cowId: string;
  motion: number;
  countX: number;
  countY: number;
  countZ: number;
  spo2: number | null;
  heartRate: number | null;
  temp?: number | null;
  status: string;
  verdict?: "Normal" | "Possible Heat" | "In Heat";
  rowNumber: number;
}

export function CowManagerDashboard() {
  const queryClient = useQueryClient();

  // Top Nav Tab switcher: "heat" vs "motion"
  const [activeTab, setActiveTab] = useState<"heat" | "motion">("heat");

  // Multi-Cattle Selection State: default all 5 cattle selected for rich side-by-side comparison on the same graphs
  const [selectedCattleIds, setSelectedCattleIds] = useState<string[]>([
    "COW-01",
    "BUF-02",
    "COW-03",
    "COW-04",
    "BUF-05"
  ]);

  // Farmer Estrus Log State (Editable & Optional per cattle; persisted in localStorage)
  const [farmerEstrusTimes, setFarmerEstrusTimes] = useState<Record<string, string | null>>(() => {
    try {
      const saved = localStorage.getItem("farmer_cattle_estrus_times");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to read farmer estrus times from storage", e);
    }
    const defaults: Record<string, string | null> = {};
    CATTLE_CATALOG.forEach((c) => {
      defaults[c.id] = c.lastEstrusTime ?? null;
    });
    return defaults;
  });

  // Farmer Estrus Modal state
  const [isEstrusModalOpen, setIsEstrusModalOpen] = useState(false);
  const [editingEstrusCattleId, setEditingEstrusCattleId] = useState<string | null>(null);

  const handleSaveFarmerEstrusTime = (cattleId: string, isoValue: string | null) => {
    setFarmerEstrusTimes((prev) => {
      const updated = { ...prev, [cattleId]: isoValue };
      try {
        localStorage.setItem("farmer_cattle_estrus_times", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to persist farmer estrus times", e);
      }
      return updated;
    });
  };

  const openEstrusModal = (cattleId?: string) => {
    setEditingEstrusCattleId(cattleId || selectedCattleIds[0] || "COW-01");
    setIsEstrusModalOpen(true);
  };

  // Data Mode: "multi_simulation" (default dummy dataset) vs "live_sheet"
  const [dataSource, setDataSource] = useState<"multi_simulation" | "live_sheet">("multi_simulation");

  // Timeframe selector state & interactive scrubber slider
  const [timeframe, setTimeframe] = useState<"all" | "24h" | "7d" | "30d" | "90d" | "1y" | "custom">("all");
  const [sliderValue, setSliderValue] = useState<number>(100);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [appliedCustom, setAppliedCustom] = useState<{ start: string; end: string } | null>(null);

  // Table filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cattleTableFilter, setCattleTableFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Verdict history scroll index
  const [verdictHistoryPage, setVerdictHistoryPage] = useState(0);

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const timeframeOptions = [
    { id: "all", label: "All Time" },
    { id: "24h", label: "24 Hours" },
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
    { id: "90d", label: "3 Months" },
    { id: "custom", label: "Custom" },
  ] as const;

  // Selected Cattle Profile objects
  const selectedCattle = useMemo(() => {
    return CATTLE_CATALOG.filter((c) => selectedCattleIds.includes(c.id));
  }, [selectedCattleIds]);

  // Multi-Cattle Toggle Handlers
  const toggleCattle = (id: string) => {
    setSelectedCattleIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) {
          toast.info("At least one animal must remain selected for comparison.");
          return prev;
        }
        return prev.filter((x) => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAllCattle = () => {
    setSelectedCattleIds(CATTLE_CATALOG.map((c) => c.id));
    toast.success("Showing all 5 cattle on the comparison graphs.");
  };

  const selectInHeatOnly = () => {
    const heatIds = CATTLE_CATALOG.filter((c) => c.currentVerdict !== "Normal").map((c) => c.id);
    setSelectedCattleIds(heatIds);
    toast.info("Filtered comparison to cattle showing estrus indicators.");
  };

  const selectHighMobilityOnly = () => {
    const highMobilityIds = CATTLE_CATALOG.filter((c) => c.motionVerdict === "High Mobility" || c.currentMotion >= 50000).map((c) => c.id);
    setSelectedCattleIds(highMobilityIds);
    toast.info("Filtered comparison to high-mobility active cattle.");
  };

  const soloCattle = (id: string) => {
    setSelectedCattleIds([id]);
    const animal = CATTLE_CATALOG.find((c) => c.id === id);
    toast.info(`Solo focus: ${animal?.name || id}`);
  };

  // Generate multi-cattle simulated telemetry dataset parameterized by timeframe and scrubber slider
  const multiCattleTelemetry = useMemo(() => {
    return generateMultiCattleTelemetryData(timeframe, appliedCustom, sliderValue);
  }, [timeframe, appliedCustom, sliderValue]);

  const multiCattleDailyView = useMemo(() => {
    return generateMultiCattleDailyView(timeframe);
  }, [timeframe]);

  const allSimulatedTableRows = useMemo(() => {
    return generateMultiCattleTableRows(multiCattleTelemetry);
  }, [multiCattleTelemetry]);

  const simulatedVerdictHistory = useMemo(() => {
    return generateMultiCattleVerdictHistory(multiCattleTelemetry);
  }, [multiCattleTelemetry]);

  const motionStatusSplit = useMemo(() => {
    return generateMotionStatusSplit(multiCattleTelemetry);
  }, [multiCattleTelemetry]);

  const multiCattleMotionLogs = useMemo(() => {
    return generateMultiCattleMotionLogs();
  }, []);

  // Fetch live dashboard data from backend API
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/cattle/dashboard", timeframe, appliedCustom?.start, appliedCustom?.end],
    queryFn: async () => {
      const params = new URLSearchParams({ timeframe });
      if (timeframe === "custom" && appliedCustom) {
        if (appliedCustom.start) params.set("startDate", appliedCustom.start);
        if (appliedCustom.end) params.set("endDate", appliedCustom.end);
      }
      return apiClient<any>(`/cattle/dashboard?${params.toString()}`);
    },
    refetchInterval: 15000,
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      return apiClient<any>("/cattle/sync", { method: "POST" });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cattle/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cattle/records"] });
      if (result.syncedRows > 0) {
        toast.success(`Synced ${result.syncedRows} new records! Checkpoint: Row #${result.newLastRow}`);
      } else {
        toast.info(result.message || "Google Sheet is fully up to date.");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to sync from Google Sheet");
    },
  });

  // Fetch paginated table records from database
  const { data: recordsData, isLoading: isRecordsLoading } = useQuery({
    queryKey: ["/api/cattle/records", currentPage, statusFilter, search, timeframe, appliedCustom?.start, appliedCustom?.end],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
        timeframe,
      });
      if (timeframe === "custom" && appliedCustom) {
        if (appliedCustom.start) params.set("startDate", appliedCustom.start);
        if (appliedCustom.end) params.set("endDate", appliedCustom.end);
      }
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      return apiClient<any>(`/cattle/records?${params.toString()}`);
    },
    enabled: dataSource === "live_sheet",
  });

  // Timeframe handlers
  const handleTimeframeChange = (newTf: "all" | "24h" | "7d" | "30d" | "90d" | "1y" | "custom") => {
    setTimeframe(newTf);
    setSliderValue(100);
    setCurrentPage(1);
    if (newTf !== "custom") {
      setAppliedCustom(null);
    }
  };

  const handleApplyCustom = () => {
    if (!customStartDate) {
      toast.error("Please pick a start date");
      return;
    }
    setAppliedCustom({ start: customStartDate, end: customEndDate });
    setSliderValue(100);
    setCurrentPage(1);
    toast.success(`Filter applied: ${customStartDate} to ${customEndDate || "Latest"}`);
  };

  const handleResetCustom = () => {
    setCustomStartDate("");
    setCustomEndDate("");
    setAppliedCustom(null);
    setTimeframe("all");
    setSliderValue(100);
    setCurrentPage(1);
  };

  const handleScrubBackward = () => {
    setSliderValue((prev) => {
      const next = Math.max(15, prev - 15);
      toast.info(`Time scrubber shifted to ${next}%`);
      return next;
    });
  };

  const handleScrubForward = () => {
    setSliderValue((prev) => {
      const next = Math.min(100, prev + 15);
      toast.info(next === 100 ? "Scrubbed to latest real-time window" : `Time scrubber shifted to ${next}%`);
      return next;
    });
  };

  // Safe fallbacks from live API
  const overview = data?.overview || {
    lastUpdated: "--",
    checkpointRow: 0,
    totalSyncedRows: 0,
    dateRangeStr: "Last 24 Hours (Realtime)",
  };

  // Active date range text dynamically computed
  const displayedDateRangeStr = useMemo(() => {
    if (dataSource === "multi_simulation") {
      return getTimeframeDateRangeStr(timeframe, appliedCustom, sliderValue);
    }
    return overview.dateRangeStr;
  }, [dataSource, timeframe, appliedCustom, sliderValue, overview.dateRangeStr]);

  // Dynamically compute KPIs for simulation mode from the active timeframe rows
  const simulatedKpis = useMemo(() => {
    if (allSimulatedTableRows.length === 0) {
      return {
        totalRecords: 0,
        avgMotion: 0,
        alertRows: 0,
        peakMotion: 0,
        peakTimestamp: "--",
        p95: 0,
        p99: 0,
      };
    }
    const motions = allSimulatedTableRows.map((r) => r.motion).sort((a, b) => a - b);
    const sum = motions.reduce((acc, m) => acc + m, 0);
    const avg = Math.round(sum / motions.length);
    const peak = motions[motions.length - 1];
    const p95 = motions[Math.floor(motions.length * 0.95)] || peak;
    const p99 = motions[Math.floor(motions.length * 0.99)] || peak;
    const alerts = allSimulatedTableRows.filter((r) => r.status === "MOUNTING!" || r.status === "Restless").length;
    const peakRow = allSimulatedTableRows.find((r) => r.motion === peak);

    return {
      totalRecords: allSimulatedTableRows.length,
      avgMotion: avg,
      alertRows: alerts,
      peakMotion: peak,
      peakTimestamp: peakRow?.timestamp || "Latest",
      p95,
      p99,
    };
  }, [allSimulatedTableRows]);

  // Dynamically compute status breakdown for simulation mode
  const simulatedStatusSplit = useMemo(() => {
    const total = allSimulatedTableRows.length || 1;
    let normalCount = 0;
    let restlessCount = 0;
    let mountingCount = 0;

    allSimulatedTableRows.forEach((r) => {
      if (r.status === "MOUNTING!") mountingCount++;
      else if (r.status === "Restless") restlessCount++;
      else normalCount++;
    });

    return {
      normal: { count: normalCount, percentage: Number(((normalCount / total) * 100).toFixed(1)) },
      restless: { count: restlessCount, percentage: Number(((restlessCount / total) * 100).toFixed(1)) },
      mounting: { count: mountingCount, percentage: Number(((mountingCount / total) * 100).toFixed(1)) },
      unknown: { count: 0, percentage: 0 },
    };
  }, [allSimulatedTableRows]);

  const kpis = dataSource === "multi_simulation"
    ? simulatedKpis
    : data?.kpis || {
        totalRecords: 0,
        avgMotion: null,
        alertRows: 0,
        peakMotion: null,
        peakTimestamp: "--",
        p95: null,
        p99: null,
      };

  const statusSplit = dataSource === "multi_simulation"
    ? simulatedStatusSplit
    : data?.statusSplit || {
        normal: { count: 0, percentage: 0 },
        restless: { count: 0, percentage: 0 },
        mounting: { count: 0, percentage: 0 },
        unknown: { count: 0, percentage: 0 },
      };

  // Table rows filtered
  const filteredTableRows: MultiCattleTableRow[] = useMemo(() => {
    if (dataSource === "multi_simulation") {
      return allSimulatedTableRows.filter((row: MultiCattleTableRow) => {
        const matchesCattle = cattleTableFilter === "all" || row.cattleId === cattleTableFilter;
        const matchesStatus = statusFilter === "all" || row.status.toLowerCase() === statusFilter.toLowerCase();
        const matchesSearch =
          search === "" ||
          row.cattleName.toLowerCase().includes(search.toLowerCase()) ||
          row.cattleId.toLowerCase().includes(search.toLowerCase()) ||
          row.timestamp.toLowerCase().includes(search.toLowerCase()) ||
          row.status.toLowerCase().includes(search.toLowerCase()) ||
          row.verdict.toLowerCase().includes(search.toLowerCase());
        return matchesCattle && matchesStatus && matchesSearch;
      });
    } else {
      return (recordsData?.records || []).map((r: TelemetryRow) => ({
        id: r.id,
        rowNumber: r.rowNumber,
        cattleId: r.cowId || "COW-01",
        cattleName: r.cowId === "BUF-02" ? "Buffalo — Kasuri" : "Cow — Ganga",
        species: (r.cowId === "BUF-02" ? "Buffalo" : "Cow") as "Cow" | "Buffalo",
        color: r.cowId === "BUF-02" ? "#059669" : "#1d70b8",
        timestamp: r.timestamp,
        motion: r.motion,
        countX: r.countX,
        countY: r.countY,
        countZ: r.countZ,
        heartRate: r.heartRate ?? 72,
        spo2: r.spo2 ?? 97,
        temp: r.temp ?? 38.4,
        status: (r.status || "Normal") as "Normal" | "Restless" | "MOUNTING!",
        verdict: (r.verdict || "Normal") as "Normal" | "Possible Heat" | "In Heat",
      }));
    }
  }, [dataSource, allSimulatedTableRows, recordsData?.records, cattleTableFilter, statusFilter, search]);

  const totalTableCount = filteredTableRows.length;
  const totalPages = Math.max(1, Math.ceil(totalTableCount / pageSize));
  const paginatedRows: MultiCattleTableRow[] = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTableRows.slice(start, start + pageSize);
  }, [filteredTableRows, currentPage, pageSize]);

  // CSV export handler
  const handleExportCSV = () => {
    const headers = [
      "Row #,Cattle ID,Cattle Name,Species,Timestamp,Motion,CountX,CountY,CountZ,SpO2,Heart Rate,Temp,Electrical Conductivity (mS/cm),Farmer Last Estrus Time,Status,Verdict",
    ];
    const rows = filteredTableRows.map((r: MultiCattleTableRow) => {
      const estrusTime = farmerEstrusTimes[r.cattleId] || "Not recorded";
      return `${r.rowNumber},"${r.cattleId}","${r.cattleName}","${r.species}","${r.timestamp}",${r.motion},${r.countX},${r.countY},${r.countZ},${r.spo2 ?? ""},${r.heartRate ?? ""},${r.temp ?? ""},${r.conductivity ?? ""},"${estrusTime}","${r.status}","${r.verdict ?? ""}"`;
    });
    const blob = new Blob([[...headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `multi_cattle_monitor_export_${timeframe}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredTableRows.length} cattle telemetry rows to CSV`);
  };

  // Custom Recharts Tooltip for Multi-Cattle Motion Comparison
  const MultiCattleMotionTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const pt = payload[0]?.payload as MultiCattlePoint;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-white shadow-2xl min-w-[240px] z-50">
        <div className="border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-mono">{pt?.timestamp || label}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Motion & EC</span>
        </div>
        <div className="space-y-1.5">
          {selectedCattle.map((c) => {
            const motion = pt?.[`motion_${c.id}`];
            const verdict = pt?.[`verdict_${c.id}`];
            const cond = pt?.[`conductivity_${c.id}`] ?? c.electricalConductivity;
            if (motion == null) return null;
            return (
              <div key={c.id} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="font-semibold text-slate-200">{c.shortName}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-white">{Number(motion).toLocaleString()}</span>
                  {cond != null && (
                    <span className="text-[10px] text-slate-300 font-normal px-1 py-0.2 rounded bg-slate-800">
                      {cond} mS
                    </span>
                  )}
                  {verdict && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        verdict === "In Heat"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : verdict === "Possible Heat"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {verdict}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Custom Recharts Tooltip for Multi-Cattle Vitals (HR, Temp, SpO2)
  const MultiCattleVitalsTooltip = ({ active, payload, label, unit, metricKey, title }: any) => {
    if (!active || !payload || !payload.length) return null;
    const pt = payload[0]?.payload as MultiCattlePoint;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-white shadow-2xl min-w-[220px] z-50">
        <div className="border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-mono">{pt?.timestamp || label}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
        </div>
        <div className="space-y-1.5">
          {selectedCattle.map((c) => {
            const val = pt?.[`${metricKey}_${c.id}`];
            if (val == null) return null;
            return (
              <div key={c.id} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="font-semibold text-slate-200">{c.shortName}</span>
                </div>
                <span className="font-mono font-bold text-white">
                  {val} {unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Custom Recharts Tooltip for Daily Comparative Bar Chart
  const MultiCattleDailyBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-white shadow-2xl min-w-[200px] z-50">
        <div className="border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-mono">{label}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Peak Motion</span>
        </div>
        <div className="space-y-1.5">
          {payload.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="font-semibold text-slate-200">{item.name?.replace(" Peak", "")}</span>
              </div>
              <span className="font-mono font-bold text-white">
                {Number(item.value || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased selection:bg-slate-200 selection:text-slate-900">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* Left: Brand Title & Admin Navigation */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/super-admin"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-1.5 sm:px-2.5 rounded-lg transition-colors border border-slate-200 shrink-0"
              title="Return to Super Admin Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Panel</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-sm sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5 sm:gap-2 truncate">
                <span>
                  <span className="hidden sm:inline">Buffalo & </span>Cattle Monitor
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-600" />
                  <span className="hidden xs:inline">Multi-</span>Herd
                </span>
              </span>
              <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-500 ml-1 shrink-0" />
              <Badge variant="outline" className="text-[10px] font-medium bg-slate-50 text-slate-600 border-slate-200 gap-1 hidden md:inline-flex shrink-0">
                <ShieldCheck className="w-3 h-3 text-slate-500" />
                Super Admin
              </Badge>
            </div>
          </div>

          {/* Right: Sub-Tabs */}
          <div className="flex items-center gap-2.5 sm:gap-7 shrink-0">
            <button
              onClick={() => setActiveTab("heat")}
              className={`text-xs sm:text-sm font-semibold transition-colors relative py-1 shrink-0 ${
                activeTab === "heat"
                  ? "text-slate-900 font-bold border-b-2 border-slate-900"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Heat Detection
            </button>
            <button
              onClick={() => setActiveTab("motion")}
              className={`text-xs sm:text-sm font-semibold transition-colors relative py-1 shrink-0 ${
                activeTab === "motion"
                  ? "text-slate-900 font-bold border-b-2 border-slate-900"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Motion Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-[1360px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 flex-1 overflow-x-hidden">
        {/* UNIFIED MONITOR CONTROL BAR */}
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
          {/* Tier 1: Selection Controls & Stream Actions */}
          <div className="p-3.5 sm:p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Left: Timeframe Segmented Control (NO native scrollbar, clean wrap) */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Timeframe:</span>
              </span>
              <div className="flex flex-wrap sm:inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80 max-w-full">
                {timeframeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleTimeframeChange(opt.id)}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs transition-all whitespace-nowrap ${
                      timeframe === opt.id
                        ? "bg-slate-900 text-white shadow-2xs font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Data Source Selector & Actions in a single coherent cluster */}
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
              {/* Mode Switcher: Dummy Simulation vs Live Sheet */}
              <div className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80 text-xs">
                <button
                  onClick={() => {
                    setDataSource("multi_simulation");
                    toast.success("Switched to Multi-Cattle Simulation dataset");
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs ${
                    dataSource === "multi_simulation"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold border border-slate-200"
                      : "text-slate-500 hover:text-slate-800 font-normal"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Dummy Data</span>
                </button>
                <button
                  onClick={() => {
                    setDataSource("live_sheet");
                    toast.info("Switched to Live Google Sheet Stream");
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-all text-xs ${
                    dataSource === "live_sheet"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold border border-slate-200"
                      : "text-slate-500 hover:text-slate-800 font-normal"
                  }`}
                >
                  Live Sheet
                </button>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="h-8 text-xs font-medium bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs gap-1.5 flex-1 sm:flex-none justify-center"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                <span>{syncMutation.isPending ? "Syncing..." : "Sync Sheet"}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsSettingsOpen(true)}
                className="h-8 text-xs font-medium bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs gap-1.5"
                title="Google Service Account settings"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Auth</span>
              </Button>
            </div>
          </div>

          {/* Tier 2: Unified Timeline Strip (Active Range Readout + Scrubber Controls) */}
          <div className="bg-slate-50/70 border-t border-slate-100 px-3.5 py-2.5 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Left: Active Date Range Context Readout */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Active Window:</span>
              </span>
              <span className="font-mono text-xs font-medium text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200/90 shadow-2xs">
                {displayedDateRangeStr}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 text-xs">
                {CATTLE_CATALOG.length} Animals Plotted
              </span>
            </div>

          </div>

          {/* Tier 3: Custom Date Range Inline Drawer (when custom is active) */}
          {timeframe === "custom" && (
            <div className="border-t border-slate-200 bg-slate-50/90 px-3.5 py-3 sm:px-4 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                Select Custom Range:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">From:</span>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-8 text-xs w-36 bg-white border-slate-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">To:</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-8 text-xs w-36 bg-white border-slate-200"
                />
              </div>
              <Button
                size="sm"
                onClick={handleApplyCustom}
                className="h-8 px-3 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-2xs"
              >
                Apply Range
              </Button>
              {appliedCustom && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetCustom}
                  className="h-8 px-2 text-xs text-slate-500 hover:text-slate-900"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MULTI-CATTLE SELECTION & COMPARISON TOOLBAR                   */}
        {/* ------------------------------------------------------------- */}
        {/* MULTI-CATTLE SELECTION & COMPARISON TOOLBAR                   */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {activeTab === "heat" ? "Heat Telemetry Monitor" : "Locomotion Kinematics"}
                </span>
                <Badge variant="outline" className="text-[10px] font-medium bg-slate-50 text-slate-700 border-slate-200 gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {activeTab === "heat" ? "Estrus Comparison Active" : "Kinematics Comparison Active"}
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {activeTab === "heat"
                  ? "Multi-Cattle Estrus & Behavioral Telemetry Monitor"
                  : "Multi-Cattle Locomotion & Kinematics Monitor"}
              </h1>
              <p className="text-xs text-slate-500">
                {activeTab === "heat"
                  ? "Comparing motion intensity, core temperature, and vitals across multiple cattle simultaneously on unified graphs:"
                  : "Comparing tri-axial acceleration (CountX, Y, Z), locomotion velocity, and grazing activity across multiple cattle:"}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={selectAllCattle}
                className="flex-1 sm:flex-none h-8 text-xs font-medium bg-white hover:bg-slate-50 border-slate-200 text-slate-700 gap-1.5 shadow-2xs justify-center"
              >
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <span>Compare All ({CATTLE_CATALOG.length})</span>
              </Button>
              {activeTab === "heat" ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectInHeatOnly}
                    className="flex-1 sm:flex-none h-8 text-xs font-medium bg-white hover:bg-rose-50/50 border-slate-200 text-slate-700 hover:text-rose-700 gap-1.5 shadow-2xs justify-center"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span>In Heat Only</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEstrusModal()}
                    className="w-full sm:w-auto h-8 text-xs font-medium bg-white hover:bg-blue-50/50 border-slate-200 text-slate-700 hover:text-blue-700 gap-1.5 shadow-2xs justify-center"
                    title="Farmer Estrous Records & 21-Day Cycle Log"
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Farmer Estrus Log</span>
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectHighMobilityOnly}
                  className="flex-1 sm:flex-none h-8 text-xs font-medium bg-white hover:bg-blue-50/50 border-slate-200 text-slate-700 hover:text-blue-700 gap-1.5 shadow-2xs justify-center"
                >
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span>High Mobility Only</span>
                </Button>
              )}
              <div className="text-xs font-mono font-medium text-slate-500 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 hidden sm:block">
                {selectedCattleIds.length} / {CATTLE_CATALOG.length} plotted
              </div>
            </div>
          </div>

          {/* Interactive Cattle Selector Pills (Minimal Formal) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {CATTLE_CATALOG.map((cattle) => {
              const isSelected = selectedCattleIds.includes(cattle.id);
              const isInHeat = cattle.currentVerdict === "In Heat";
              const isPossibleHeat = cattle.currentVerdict === "Possible Heat";
              const isHighMobility = cattle.motionVerdict === "High Mobility";
              const isGrazing = cattle.motionVerdict === "Active Grazing" || cattle.motionVerdict === "Pasture Grazing";

              return (
                <button
                  key={cattle.id}
                  onClick={() => toggleCattle(cattle.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {/* Subtle color dot indicating line color on chart */}
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cattle.color }}
                  />

                  {/* Cattle Name */}
                  <span className={isSelected ? "font-semibold text-white" : "font-medium text-slate-800"}>
                    {cattle.name}
                  </span>

                  {/* Species */}
                  <span className="text-[10px] text-slate-400">
                    {cattle.species}
                  </span>

                  {/* Tab-specific verdict tag */}
                  {activeTab === "heat" ? (
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                        isInHeat
                          ? isSelected
                            ? "bg-rose-500/25 text-rose-200 border border-rose-400/30"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                          : isPossibleHeat
                          ? isSelected
                            ? "bg-amber-500/25 text-amber-200 border border-amber-400/30"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                          : isSelected
                          ? "bg-slate-800 text-slate-300"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {cattle.currentVerdict}
                    </span>
                  ) : (
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                        isHighMobility
                          ? isSelected
                            ? "bg-blue-500/25 text-blue-200 border border-blue-400/30"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                          : isGrazing
                          ? isSelected
                            ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/30"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isSelected
                          ? "bg-slate-800 text-slate-300"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {cattle.motionVerdict}
                    </span>
                  )}

                  {/* Active checkbox indicator */}
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ml-0.5 ${
                      isSelected
                        ? "bg-white/20 text-white font-bold"
                        : "border border-slate-300 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MULTI-CATTLE LIVE STATUS & STATS GRID (Heat vs Motion)        */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                {activeTab === "heat" ? "Live Herd Heat & Estrus Status" : "Live Herd Locomotion & Accelerometer Telemetry"}
              </p>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {activeTab === "heat" ? "Estrus Snapshot" : "Tri-Axial IMU Snapshot"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Click <span className="font-medium text-slate-800">In Graph</span> to plot or <span className="font-medium text-slate-800">Solo</span> to isolate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {CATTLE_CATALOG.map((cattle) => {
              const isSelected = selectedCattleIds.includes(cattle.id);
              const isInHeat = cattle.currentVerdict === "In Heat";
              const isPossibleHeat = cattle.currentVerdict === "Possible Heat";
              const isHighMobility = cattle.motionVerdict === "High Mobility";
              const isGrazing = cattle.motionVerdict === "Active Grazing" || cattle.motionVerdict === "Pasture Grazing";

              return (
                <div
                  key={cattle.id}
                  className={`bg-white rounded-xl p-4 border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-slate-800 ring-1 ring-slate-800/10 shadow-sm"
                      : "border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div>
                    {/* Header: Dot + Short Name + Tag + Status Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cattle.color }}
                          />
                          <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                            {cattle.shortName}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          {cattle.breed} • <span className="font-mono text-slate-600">{cattle.tagNumber}</span>
                        </p>
                      </div>

                      {/* Status Badge: Heat vs Motion */}
                      {activeTab === "heat" ? (
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 border ${
                            isInHeat
                              ? "bg-rose-50 text-rose-700 border-rose-200/80"
                              : isPossibleHeat
                              ? "bg-amber-50 text-amber-700 border-amber-200/80"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {isInHeat && <Flame className="w-2.5 h-2.5 text-rose-600" />}
                          {isPossibleHeat && <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />}
                          {cattle.currentVerdict}
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 border ${
                            isHighMobility
                              ? "bg-blue-50 text-blue-700 border-blue-200/80"
                              : isGrazing
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {isHighMobility && <Zap className="w-2.5 h-2.5 text-blue-600" />}
                          {cattle.motionVerdict === "Active Grazing" && <Compass className="w-2.5 h-2.5 text-emerald-600" />}
                          {cattle.motionVerdict === "Pasture Grazing" && <Footprints className="w-2.5 h-2.5 text-teal-600" />}
                          {cattle.motionVerdict === "Resting / Shed" && <Moon className="w-2.5 h-2.5 text-slate-500" />}
                          {cattle.motionVerdict}
                        </span>
                      )}
                    </div>

                    {/* Primary Metric Box: Heat vs Motion */}
                    {activeTab === "heat" ? (
                      <div className="bg-slate-50/70 border border-slate-100 rounded-lg p-2.5 my-2.5">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                            Estrus Motion Intensity
                          </span>
                          <span className="font-mono font-semibold text-xs text-slate-800">
                            {cattle.currentMotion.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (cattle.currentMotion / 85000) * 100)}%`,
                              backgroundColor: isInHeat ? "#e11d48" : isPossibleHeat ? "#d97706" : "#64748b",
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50/70 border border-slate-100 rounded-lg p-2.5 my-2.5">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                            Daily Steps & Vigor
                          </span>
                          <span className="font-mono font-semibold text-xs text-slate-800">
                            {cattle.dailySteps.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">steps</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${cattle.vigorScore}%`,
                              backgroundColor: isHighMobility ? "#2563eb" : isGrazing ? "#059669" : "#64748b",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 4 Micro-Readouts Grid: Heat (HR, Temp, SpO2, Electrical Conductivity) vs Motion (CountX, CountY, CountZ) */}
                    {activeTab === "heat" ? (
                      <>
                        <div className="grid grid-cols-4 gap-1 text-center my-2 sm:my-2.5">
                          <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-1 sm:p-1.5 min-w-0">
                            <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 block truncate">HR</span>
                            <p className="text-[11px] sm:text-xs font-semibold text-slate-800 font-mono mt-0.5 truncate">
                              {cattle.currentHeartRate} <span className="text-[8px] font-normal text-slate-500 hidden xs:inline">bpm</span>
                            </p>
                          </div>

                          <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-1 sm:p-1.5 min-w-0">
                            <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 block truncate">Temp</span>
                            <p className="text-[11px] sm:text-xs font-semibold text-slate-800 font-mono mt-0.5 truncate">
                              {cattle.currentTemp}°
                            </p>
                          </div>

                          <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-1 sm:p-1.5 min-w-0">
                            <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 block truncate">SpO2</span>
                            <p className="text-[11px] sm:text-xs font-semibold text-slate-800 font-mono mt-0.5 truncate">
                              {cattle.currentSpo2}%
                            </p>
                          </div>

                          <div 
                            className={`rounded-lg p-1 sm:p-1.5 border transition-colors min-w-0 ${
                              cattle.electricalConductivity >= 5.5
                                ? "bg-rose-50/70 border-rose-200/80 text-rose-800"
                                : "bg-slate-50/50 border-slate-100 text-slate-800"
                            }`}
                            title="Vaginal / Mucosal Electrical Conductivity in mS/cm (Automated Sensor Biometric - Read Only, Not Editable)"
                          >
                            <span className={`text-[8px] sm:text-[9px] font-semibold block flex items-center justify-center gap-0.5 truncate ${
                              cattle.electricalConductivity >= 5.5 ? "text-rose-600" : "text-slate-400"
                            }`}>
                              <Zap className="w-2 sm:w-2.5 h-2 sm:h-2.5 shrink-0" />
                              EC
                            </span>
                            <p className="text-[11px] sm:text-xs font-bold font-mono mt-0.5 truncate">
                              {cattle.electricalConductivity}
                            </p>
                          </div>
                        </div>

                        {/* Farmer-Entered Last Time of Estrous Time (Editable & Optional) */}
                        {(() => {
                          const estrusIso = farmerEstrusTimes[cattle.id];
                          const cycle = calculateEstrusCycleInfo(estrusIso);
                          return (
                            <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2 my-2 text-left">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>Last Estrous Time</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEstrusModal(cattle.id);
                                  }}
                                  className="text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 shrink-0"
                                  title="Farmer editable field (Optional)"
                                >
                                  <Pencil className="w-2.5 h-2.5 text-blue-600" />
                                  <span>{estrusIso ? "Edit" : "+ Add"}</span>
                                </button>
                              </div>

                              {estrusIso && cycle ? (
                                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                  <span className="font-mono font-semibold text-[11px] text-slate-900 truncate">
                                    {cycle.formattedDate}
                                  </span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${cycle.badgeColor}`}>
                                    Day {cycle.cycleDay}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 italic">
                                  <span>Not recorded</span>
                                  <span className="text-[9px] not-italic px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                                    Optional
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5 text-center my-2.5">
                        <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-1.5">
                          <span className="text-[9px] font-medium text-slate-400 block" title="Lateral sway / roll count">CountX</span>
                          <p className="text-xs font-semibold text-slate-800 font-mono mt-0.5">
                            {cattle.countX}
                          </p>
                          <span className="text-[8px] text-slate-400 block leading-tight">Lateral</span>
                        </div>

                        <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-1.5">
                          <span className="text-[9px] font-medium text-slate-400 block" title="Vertical grazing / head movement">CountY</span>
                          <p className="text-xs font-semibold text-slate-800 font-mono mt-0.5">
                            {cattle.countY}
                          </p>
                          <span className="text-[8px] text-slate-400 block leading-tight">Vertical</span>
                        </div>

                        <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-1.5">
                          <span className="text-[9px] font-medium text-slate-400 block" title="Forward thrust / locomotion">CountZ</span>
                          <p className="text-xs font-semibold text-slate-800 font-mono mt-0.5">
                            {cattle.countZ}
                          </p>
                          <span className="text-[8px] text-slate-400 block leading-tight">Forward</span>
                        </div>
                      </div>
                    )}

                    {/* Context Sub-hint */}
                    <p className="text-[10px] text-slate-500 font-normal truncate mt-1">
                      {activeTab === "heat" ? cattle.statusDescription : `${cattle.cadence} • ${cattle.activeHours}h active`}
                    </p>
                  </div>

                  {/* Card Actions: Toggle in Graph vs Solo */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5 mt-2">
                    <button
                      onClick={() => toggleCattle(cattle.id)}
                      className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors flex-1 text-center flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "bg-slate-900 text-white hover:bg-slate-800 shadow-2xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>In Graph</span>
                        </>
                      ) : (
                        <span>+ Add to Graph</span>
                      )}
                    </button>
                    <button
                      onClick={() => soloCattle(cattle.id)}
                      className="text-[11px] font-medium text-slate-500 bg-white hover:text-slate-800 hover:bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                      title="Show only this animal on the graph"
                    >
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>Solo</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: HEAT DETECTION DASHBOARD                               */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "heat" && (
          <div className="space-y-6">
            {/* CHARTS GRID: Left Real Motion Overlaid vs Right Vitals Overlaid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 cols): MULTI-CATTLE MOTION / IMU CHART */}
              <Card className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl shadow-xs">
                <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        MOTION / IMU (BMI160 + ACCELEROMETER)
                      </p>
                      <Badge variant="outline" className="text-[9px] font-medium bg-slate-50 text-slate-700 border-slate-200">
                        {selectedCattleIds.length} Cattle Overlaid
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-700">
                      Multi-animal continuous motion over time on the same chart
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 pt-0">
                  <div className="h-72 sm:h-80 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={multiCattleTelemetry} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="timeShort" 
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          axisLine={{ stroke: "#cbd5e1" }}
                          tickLine={false}
                        />
                        <YAxis 
                          domain={[0, 100000]} 
                          ticks={[0, 25000, 50000, 75000, 100000]} 
                          width={48}
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          axisLine={{ stroke: "#cbd5e1" }}
                          tickLine={false}
                        />
                        <Tooltip content={<MultiCattleMotionTooltip />} />

                        {/* Estrus Threshold Reference Lines */}
                        <ReferenceLine 
                          y={80000} 
                          stroke="#ef4444" 
                          strokeDasharray="4 4" 
                          label={{ value: "Mounting / In Heat (80k)", fill: "#ef4444", fontSize: 9, position: "insideTopRight" }} 
                        />
                        <ReferenceLine 
                          y={60000} 
                          stroke="#f59e0b" 
                          strokeDasharray="4 4" 
                          label={{ value: "Restless / Possible Heat (60k)", fill: "#d97706", fontSize: 9, position: "insideBottomRight" }} 
                        />

                        {/* Plotted Lines for each selected cattle on the same chart */}
                        {selectedCattle.map((c) => (
                          <Line
                            key={c.id}
                            type="monotone"
                            dataKey={`motion_${c.id}`}
                            stroke={c.color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5, stroke: c.color, strokeWidth: 2, fill: "#fff" }}
                            name={c.name}
                          />
                        ))}

                        {/* Abnormal flagged event dots for selected cattle */}
                        {selectedCattle.map((c) => (
                          <Line
                            key={`abnormal_${c.id}`}
                            type="monotone"
                            dataKey={`abnormalMotion_${c.id}`}
                            stroke="transparent"
                            dot={{ r: 4, fill: c.color, strokeWidth: 1.5, stroke: "#fff" }}
                            name={`${c.shortName} (Estrus Alert)`}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Dynamic Multi-Cattle Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs text-slate-700 font-semibold border-t border-slate-100 pt-2.5">
                    {selectedCattle.map((c) => (
                      <div key={c.id} className="flex items-center gap-1.5 cursor-pointer hover:opacity-80" onClick={() => soloCattle(c.id)}>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span>{c.name}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 text-slate-400 font-normal pl-2 border-l border-slate-200">
                      <span className="w-2 h-2 rounded-full border border-red-500 bg-red-100" />
                      <span>Estrus Alert Points</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column (5 cols): HEART RATE & TEMPERATURE OVERLAID CHARTS */}
              <div className="lg:col-span-5 space-y-6">
                {/* Top: Heart Rate Overlaid for all selected cattle */}
                <Card className="bg-white border border-slate-200/90 rounded-xl shadow-xs">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        HEART RATE (MAX30102)
                      </p>
                      <CardTitle className="text-xs font-semibold text-slate-700">
                        Comparing BPM over time across selected cattle
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-700 border-slate-200 font-mono font-medium">
                      Threshold: 90 bpm
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="h-36 sm:h-40 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={multiCattleTelemetry} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="timeShort" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} />
                          <YAxis domain={[55, 115]} ticks={[60, 80, 100, 110]} width={28} tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} />
                          <Tooltip content={<MultiCattleVitalsTooltip unit="bpm" metricKey="hr" title="Heart Rate" />} />
                          <ReferenceLine y={90} stroke="#b91c1c" strokeDasharray="3 3" label={{ value: "Elevated > 90", fill: "#b91c1c", fontSize: 9, position: "insideTopRight" }} />
                          {selectedCattle.map((c) => (
                            <Line
                              key={c.id}
                              type="monotone"
                              dataKey={`hr_${c.id}`}
                              stroke={c.color}
                              strokeWidth={1.75}
                              dot={false}
                              name={c.name}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Micro Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-1 text-[10px] text-slate-600 font-medium">
                      {selectedCattle.map((c) => (
                        <span key={c.id} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.shortName}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Bottom: Temperature Overlaid for all selected cattle */}
                <Card className="bg-white border border-slate-200/90 rounded-xl shadow-xs">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        TEMPERATURE (MLX90614)
                      </p>
                      <CardTitle className="text-xs font-semibold text-slate-700">
                        Comparing core °C over time across selected cattle
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-700 border-slate-200 font-mono font-medium">
                      Estrus: &gt; 39.2°C
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="h-36 sm:h-40 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={multiCattleTelemetry} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="timeShort" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} />
                          <YAxis domain={[37.5, 40.5]} ticks={[38, 39, 40]} width={24} tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} />
                          <Tooltip content={<MultiCattleVitalsTooltip unit="°C" metricKey="temp" title="Temperature" />} />
                          <ReferenceLine y={39.2} stroke="#f97316" strokeDasharray="3 3" label={{ value: "Estrus Surge 39.2°C", fill: "#ea580c", fontSize: 9, position: "insideTopRight" }} />
                          {selectedCattle.map((c) => (
                            <Line
                              key={c.id}
                              type="monotone"
                              dataKey={`temp_${c.id}`}
                              stroke={c.color}
                              strokeWidth={1.75}
                              dot={false}
                              name={c.name}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Micro Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-1 text-[10px] text-slate-600 font-medium">
                      {selectedCattle.map((c) => (
                        <span key={c.id} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.shortName}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FULL-WIDTH CHART: SpO2 COMPARISON ON SAME GRAPH */}
            <Card className="bg-white border border-slate-200/90 rounded-xl shadow-xs">
              <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    SPO2 OXYGEN SATURATION (MAX30102)
                  </p>
                  <CardTitle className="text-sm font-semibold text-slate-700">
                    Comparing arterial blood oxygen % across selected cattle
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-normal hidden sm:inline">Normal: 95% - 99%</span>
                  <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-700 border-slate-200 font-mono font-medium">
                    Hypoxia Alert &lt; 90%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0">
                <div className="h-48 sm:h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={multiCattleTelemetry} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="timeShort" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
                      <YAxis domain={[88, 100]} ticks={[90, 93, 96, 99]} width={28} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
                      <Tooltip content={<MultiCattleVitalsTooltip unit="%" metricKey="spo2" title="SpO2 Saturation" />} />
                      <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Hypoxia Limit (90%)", fill: "#ef4444", fontSize: 9, position: "insideTopRight" }} />
                      {selectedCattle.map((c) => (
                        <Line
                          key={c.id}
                          type="monotone"
                          dataKey={`spo2_${c.id}`}
                          stroke={c.color}
                          strokeWidth={2}
                          dot={false}
                          name={c.name}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* SpO2 Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs text-slate-600 font-medium">
                  {selectedCattle.map((c) => (
                    <span key={c.id} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* VERDICT HISTORY: MULTI-CATTLE ESTRUS ALERTS FEED */}
            <Card className="bg-white border border-slate-200/90 rounded-xl shadow-xs">
              <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      MULTI-CATTLE ESTRUS ALERTS & VERDICT HISTORY
                    </p>
                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200 font-medium">
                      {simulatedVerdictHistory.length} Flagged Events
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-700">
                    Recent Possible Heat and In Heat alerts across monitored herd
                  </CardTitle>
                </div>
                {/* Scroll controls */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setVerdictHistoryPage((p) => Math.max(0, p - 3))}
                    disabled={verdictHistoryPage === 0}
                    className="h-7 w-7 p-0 rounded-full text-slate-400 hover:text-slate-800"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setVerdictHistoryPage((p) => p + 3 < simulatedVerdictHistory.length ? p + 3 : p)}
                    disabled={verdictHistoryPage + 3 >= simulatedVerdictHistory.length}
                    className="h-7 w-7 p-0 rounded-full text-slate-400 hover:text-slate-800"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0 space-y-2.5">
                {simulatedVerdictHistory.slice(verdictHistoryPage, verdictHistoryPage + 4).map((row) => {
                  const isInHeat = row.verdict === "In Heat";
                  return (
                    <div
                      key={row.id}
                      className="border border-slate-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Colored Animal Badge */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                          <span>{row.cattleName}</span>
                        </div>

                        {/* Verdict Tag */}
                        <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                          isInHeat 
                            ? "bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]" 
                            : "bg-[#fef7e0] text-[#b06000] border border-[#fce8b2]"
                        }`}>
                          {row.verdict}
                        </span>

                        <span className="text-xs font-semibold text-slate-700 flex flex-wrap items-center gap-1">
                          <span>Motion: <strong className="font-mono">{row.motion.toLocaleString()}</strong></span>
                          <span>• {row.heartRate} bpm</span>
                          <span>• {row.temp}°C</span>
                          <span>• EC: <strong className="font-mono text-rose-700">{row.conductivity?.toFixed(1) ?? "7.0"} mS</strong></span>
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono self-start sm:self-auto">
                        {row.timestamp}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* DATA TABLE: MULTI-CATTLE ROWS WITH ANIMAL FILTER */}
            <Card className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                    DATA TABLE
                  </p>
                  <CardTitle className="text-sm font-semibold text-slate-700">
                    All telemetry rows with multi-cattle animal identifiers
                  </CardTitle>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {/* Filter by Cattle */}
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                    <span className="text-xs text-slate-500 font-medium">Cattle:</span>
                    <select
                      value={cattleTableFilter}
                      onChange={(e) => {
                        setCattleTableFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-8 text-xs font-semibold px-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 w-full sm:w-auto"
                    >
                      <option value="all">All Cattle (Herd)</option>
                      {CATTLE_CATALOG.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Status */}
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-8 text-xs font-semibold px-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 flex-1 sm:flex-initial"
                  >
                    <option value="all">All Status</option>
                    <option value="normal">Normal</option>
                    <option value="restless">Restless</option>
                    <option value="mounting!">MOUNTING!</option>
                  </select>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportCSV}
                    className="h-8 text-xs font-medium gap-1.5 flex-1 sm:flex-initial justify-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </Button>
                </div>
              </CardHeader>
              <div className="text-[10px] text-slate-400 px-3.5 py-1.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between sm:hidden">
                <span>Swipe table horizontally to view all columns &rarr;</span>
                <span className="font-mono text-slate-500 font-semibold">11 columns</span>
              </div>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#f8fafc] text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/60">
                    <tr>
                      <th className="px-4 py-3">ROW</th>
                      <th className="px-4 py-3">ANIMAL / CATTLE</th>
                      <th className="px-4 py-3">TIMESTAMP</th>
                      <th className="px-4 py-3">MOTION</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3">HEART RATE</th>
                      <th className="px-4 py-3">SPO2</th>
                      <th className="px-4 py-3">TEMP</th>
                      <th className="px-4 py-3">ELEC. COND.</th>
                      <th className="px-4 py-3">LAST ESTROUS</th>
                      <th className="px-4 py-3">VERDICT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {paginatedRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900">
                          #{row.rowNumber}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                            style={{
                              backgroundColor: `${row.color}10`,
                              borderColor: `${row.color}30`,
                              color: row.color,
                            }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                            <span>{row.cattleName}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap font-sans text-[11px]">
                          {row.timestamp}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">
                          {row.motion.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 font-sans">
                          {row.status}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {row.heartRate} bpm
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {row.spo2}%
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {row.temp} °C
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                              (row.conductivity ?? 4.0) >= 5.5
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "text-slate-700 bg-slate-50 border border-slate-200/60"
                            }`}
                            title="Vaginal / Mucosal Electrical Conductivity in mS/cm"
                          >
                            <Zap className="w-2.5 h-2.5" />
                            {(row.conductivity ?? 4.0).toFixed(1)} mS
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 font-sans whitespace-nowrap">
                          {farmerEstrusTimes[row.cattleId] ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="font-mono text-[11px] text-slate-800">
                                {calculateEstrusCycleInfo(farmerEstrusTimes[row.cattleId])?.formattedDate.split(",")[0]}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                (Day {calculateEstrusCycleInfo(farmerEstrusTimes[row.cattleId])?.cycleDay})
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Not set (Opt.)</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.verdict === "In Heat" ? (
                            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]">
                              In Heat
                            </span>
                          ) : row.verdict === "Possible Heat" ? (
                            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#fef7e0] text-[#b06000] border border-[#fce8b2]">
                              Possible Heat
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {paginatedRows.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-4 py-8 text-center text-slate-400 font-sans">
                          No matching cattle records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
                    <span>
                      Page {currentPage} of {totalPages} ({totalTableCount} total records)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-7 px-2"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-7 px-2"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: MOTION DASHBOARD (SYSTEM VIEW)                         */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "motion" && (
          <div className="space-y-6">
            {/* Hero Card */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                BUFFALO & CATTLE MONITOR SYSTEM
              </p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Multi-cattle comparative locomotion, tri-axial accelerometer, and gait dynamics
              </h1>
              <p className="text-xs text-slate-500">
                Comparing {selectedCattleIds.length} monitored animals on continuous tri-axial acceleration signals (CountX, CountY, CountZ) and daily mobility patterns.
              </p>
            </div>

            {/* 4 KPI Metric Cards (Minimal Formal - Dedicated to Motion) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Monitored Herd */}
              <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs hover:shadow-sm transition-shadow p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      Live Feed Active
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Monitored Herd</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">{CATTLE_CATALOG.length}</span>
                    <span className="text-xs text-slate-500">Animals Selected</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>5 continuous BMI160 sensor nodes</span>
                </p>
              </div>

              {/* Average Locomotion */}
              <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs hover:shadow-sm transition-shadow p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Gauge className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      Resting Baseline
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Herd Avg Locomotion</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
                      {kpis.avgMotion != null ? kpis.avgMotion.toLocaleString() : "--"}
                    </span>
                    <span className="text-xs text-slate-500">counts/min</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Normal resting herd activity (~22k)</span>
                </p>
              </div>

              {/* High Mobility Cattle (Replaces Cattle in Heat) */}
              <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs hover:shadow-sm transition-shadow p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-blue-600" />
                      High Mobility
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">High Mobility Herd</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">3 Active</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 font-medium">
                  <span className="text-blue-600 font-semibold">Ganga</span>, <span className="text-blue-600 font-semibold">Kaveri</span> & <span className="text-blue-600 font-semibold">Kasuri</span> active
                </p>
              </div>

              {/* Peak Locomotion (Replaces Peak Estrus) */}
              <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs hover:shadow-sm transition-shadow p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      Max Kinematic Thrust
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Peak Locomotion (Ganga)</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
                      {kpis.peakMotion != null ? kpis.peakMotion.toLocaleString() : "--"}
                    </span>
                    <span className="text-xs text-slate-500">counts/min</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  <span>3.8x surge over resting baseline</span>
                </p>
              </div>
            </div>

            {/* 3 Breakdown Cards: DYNAMICS SPLIT, KINEMATIC READOUT, HERD ACTIVITY LOG */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Card 1: LOCOMOTION DYNAMICS SPLIT */}
              <div className="md:col-span-4 bg-white border border-slate-200/90 rounded-xl shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                    LOCOMOTION DYNAMICS SPLIT
                  </p>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Herd Analysis
                  </span>
                </div>
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        Resting / Shed <span className="text-slate-400 font-normal">({motionStatusSplit.resting.count})</span>
                      </span>
                      <span className="font-semibold font-mono text-slate-700 text-[11px]">
                        {motionStatusSplit.resting.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-slate-400 h-full rounded-full" style={{ width: `${motionStatusSplit.resting.percentage}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Active Grazing <span className="text-slate-400 font-normal">({motionStatusSplit.grazing.count})</span>
                      </span>
                      <span className="font-semibold font-mono text-emerald-700 text-[11px]">
                        {motionStatusSplit.grazing.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${motionStatusSplit.grazing.percentage}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        High Mobility <span className="text-slate-400 font-normal">({motionStatusSplit.highMobility.count})</span>
                      </span>
                      <span className="font-semibold font-mono text-blue-600 text-[11px]">
                        {motionStatusSplit.highMobility.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${motionStatusSplit.highMobility.percentage * 2}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: TRI-AXIAL KINEMATIC READOUT */}
              <div className="md:col-span-4 bg-white border border-slate-200/90 rounded-xl shadow-xs p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-blue-600" />
                      BMI160 Telemetry Calibrated
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Today, 04:30 pm</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                    Max Tri-Axial Surge: <span className="text-blue-600 font-mono font-bold">84,250</span> (Cow — Ganga)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2 font-normal">
                    Elevated forward acceleration (CountZ: 252) and lateral roll (CountX: 226) captured via BMI160 IMU. Continuous 50 Hz accelerometer sampling with 0 dropped telemetry frames.
                  </p>
                  {/* Micro physiological readouts */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="bg-slate-50 px-2 py-1 rounded-md text-slate-700 font-mono text-[11px] font-medium border border-slate-200">
                      Cadence: 124 steps/min
                    </span>
                    <span className="bg-slate-50 px-2 py-1 rounded-md text-slate-700 font-mono text-[11px] font-medium border border-slate-200">
                      Vigor: 98% High
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-3">
                  <span>Sensor Tag: TAG-9011</span>
                  <span className="font-mono text-slate-700">p99: 83,900</span>
                </div>
              </div>

              {/* Card 3: HERD MOVEMENT & ACTIVITY LOG */}
              <div className="md:col-span-4 bg-white border border-slate-200/90 rounded-xl shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Footprints className="w-3.5 h-3.5 text-blue-600" />
                    <span>HERD MOVEMENT & ACTIVITY LOG</span>
                  </p>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                    5 Monitored
                  </span>
                </div>
                <div className="space-y-2 max-h-44 overflow-y-auto pt-0.5">
                  {multiCattleMotionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-slate-200 rounded-lg p-2.5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: log.color }} />
                        <span className="font-semibold text-slate-900">{log.shortName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          log.motionStatus === "High Mobility"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : log.motionStatus === "Active Grazing"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-50 text-slate-600 border border-slate-200"
                        }`}>
                          {log.motionStatus}
                        </span>
                        <span className="font-semibold font-mono text-slate-800">
                          {log.motion.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Charts Section: MAIN SIGNAL on left, COUNTERS & DAILY VIEW on right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 cols): MAIN SIGNAL */}
              <Card className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl shadow-xs">
                <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        MAIN LOCOMOTION SIGNAL (COMPARATIVE)
                      </p>
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-mono text-[10px] font-medium">
                        p99: 83,900
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-700">
                      Multi-cattle motion intensity over time on the same chart
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 pt-0">
                  <div className="h-72 sm:h-80 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={multiCattleTelemetry} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="timeShort" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
                        <YAxis domain={[0, 100000]} ticks={[0, 25000, 50000, 75000, 100000]} width={48} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
                        <Tooltip content={<MultiCattleMotionTooltip />} />
                        <ReferenceLine y={80000} stroke="#2563eb" strokeDasharray="3 3" label={{ value: "High Mobility / Pacing (> 80k)", fill: "#2563eb", fontSize: 9, position: "insideTopRight" }} />
                        <ReferenceLine y={60000} stroke="#059669" strokeDasharray="3 3" label={{ value: "Active Grazing (> 60k)", fill: "#059669", fontSize: 9, position: "insideBottomRight" }} />

                        {selectedCattle.map((c) => (
                          <Line
                            key={c.id}
                            type="monotone"
                            dataKey={`motion_${c.id}`}
                            stroke={c.color}
                            strokeWidth={2}
                            dot={false}
                            name={c.name}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs text-slate-600 font-medium">
                    {selectedCattle.map((c) => (
                      <div key={c.id} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Right Column (5 cols): COUNTERS & DAILY VIEW */}
              <div className="lg:col-span-5 space-y-6">
                {/* Top: COUNTERS (CountX, CountY, CountZ) */}
                <Card className="bg-white border border-slate-200/90 rounded-xl shadow-xs">
                  <CardHeader className="p-4 pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      ACCELEROMETER COUNTERS
                    </p>
                    <CardTitle className="text-xs font-semibold text-slate-700">
                      Tri-axial motion sensor signals (Ganga & Kasuri)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="h-36 sm:h-40 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={multiCattleTelemetry} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="timeShort" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} />
                          <YAxis width={36} tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", color: "#fff", fontSize: "11px" }} />
                          <Line type="monotone" dataKey="countX_COW-01" stroke="#2563eb" strokeWidth={1.5} dot={false} name="Ganga CountX (Lateral)" />
                          <Line type="monotone" dataKey="countY_COW-01" stroke="#16a34a" strokeWidth={1.5} dot={false} name="Ganga CountY (Vertical)" />
                          <Line type="monotone" dataKey="countZ_COW-01" stroke="#d97706" strokeWidth={1.5} dot={false} name="Ganga CountZ (Forward)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2 text-[11px] text-slate-600 font-medium">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2563eb]" />CountX (Lateral)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#16a34a]" />CountY (Vertical)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#d97706]" />CountZ (Forward)</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Bottom: DAILY VIEW (Multi-Cattle Comparative Bar Chart) */}
                <Card className="bg-white border border-slate-200/90 rounded-xl shadow-xs">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        DAILY COMPARATIVE VIEW
                      </p>
                      <CardTitle className="text-xs font-semibold text-slate-700">
                        Comparing peak motion across selected cattle by day
                      </CardTitle>
                    </div>
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="h-36 sm:h-40 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={multiCattleDailyView} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} />
                          <YAxis domain={[0, 100000]} width={45} tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} />
                          <Tooltip content={<MultiCattleDailyBarTooltip />} cursor={{ fill: "rgba(241, 245, 249, 0.6)" }} />
                          {selectedCattle.map((c) => (
                            <Bar
                              key={c.id}
                              dataKey={`peak_${c.id}`}
                              fill={c.color}
                              name={`${c.shortName} Peak`}
                              radius={[2, 2, 0, 0]}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-[10px] text-slate-600 font-medium">
                      {selectedCattle.map((c) => (
                        <span key={c.id} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: c.color }} />
                          {c.shortName}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* DATA TABLE (TAB 2: MOTION & TRI-AXIAL TELEMETRY) */}
            <Card className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    LOCOMOTION & TRI-AXIAL DATA TABLE
                  </p>
                  <CardTitle className="text-sm font-semibold text-slate-700">
                    All imported telemetry rows with tri-axial accelerometer counts
                  </CardTitle>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full sm:w-56 md:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Search time, cattle, status..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-8 pl-8 text-xs bg-slate-50 border-slate-200 w-full"
                    />
                  </div>

                  <select
                    value={cattleTableFilter}
                    onChange={(e) => {
                      setCattleTableFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-8 text-xs font-semibold px-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 flex-1 sm:flex-initial"
                  >
                    <option value="all">All Cattle</option>
                    {CATTLE_CATALOG.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-8 text-xs font-semibold px-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 flex-1 sm:flex-initial"
                  >
                    <option value="all">All Mobility Levels</option>
                    <option value="normal">Resting / Normal</option>
                    <option value="restless">Active Grazing</option>
                    <option value="mounting!">High Mobility</option>
                  </select>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportCSV}
                    className="h-8 text-xs gap-1.5 flex-1 sm:flex-initial justify-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </Button>
                </div>
              </CardHeader>
              <div className="text-[10px] text-slate-400 px-3.5 py-1.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between sm:hidden">
                <span>Swipe table horizontally to view all columns &rarr;</span>
                <span className="font-mono text-slate-500 font-semibold">8 columns</span>
              </div>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#f8fafc] text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/60">
                    <tr>
                      <th className="px-5 py-3">ROW</th>
                      <th className="px-5 py-3">CATTLE</th>
                      <th className="px-5 py-3">TIMESTAMP</th>
                      <th className="px-5 py-3">TOTAL MOTION</th>
                      <th className="px-5 py-3">COUNTX (LATERAL)</th>
                      <th className="px-5 py-3">COUNTY (VERTICAL)</th>
                      <th className="px-5 py-3">COUNTZ (FORWARD)</th>
                      <th className="px-5 py-3">MOBILITY STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {paginatedRows.map((row) => {
                      const isHighMobility = row.motion >= 65000;
                      const isGrazing = !isHighMobility && row.motion >= 24000;

                      return (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-2.5 font-bold text-slate-900">
                            #{row.rowNumber}
                          </td>
                          <td className="px-5 py-2.5 whitespace-nowrap">
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border"
                              style={{
                                backgroundColor: `${row.color}15`,
                                borderColor: `${row.color}35`,
                                color: row.color,
                              }}
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                              <span>{row.cattleName}</span>
                            </span>
                          </td>
                          <td className="px-5 py-2.5 text-slate-600 whitespace-nowrap font-sans text-[11px]">
                            {row.timestamp}
                          </td>
                          <td className="px-5 py-2.5 font-semibold text-slate-900">
                            {row.motion.toLocaleString()}
                          </td>
                          <td className="px-5 py-2.5 text-slate-500 font-sans">
                            {row.countX}
                          </td>
                          <td className="px-5 py-2.5 text-slate-500 font-sans">
                            {row.countY}
                          </td>
                          <td className="px-5 py-2.5 text-slate-500 font-sans">
                            {row.countZ}
                          </td>
                          <td className="px-5 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              isHighMobility
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : isGrazing
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}>
                              {isHighMobility ? "High Mobility" : isGrazing ? "Active Grazing" : "Resting / Shed"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Google Service Account Modal */}
      <GoogleSheetCredentialsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        checkpointRow={overview.checkpointRow || 0}
        totalSyncedRows={overview.totalSyncedRows || 0}
        lastSyncTimestamp={overview.lastUpdated || "--"}
        onSaveConfig={async (cfg: any) => {
          await apiClient("/cattle/config", { method: "POST", body: JSON.stringify(cfg) });
          setIsSettingsOpen(false);
          toast.success("Configuration updated!");
        }}
        onTriggerSync={async () => {
          await syncMutation.mutateAsync();
        }}
        onResetData={async () => {
          await apiClient("/cattle/reset", { method: "POST" });
          queryClient.invalidateQueries({ queryKey: ["/api/cattle/dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["/api/cattle/records"] });
          toast.success("Database reset successfully");
        }}
      />

      {/* Farmer Estrous Record & Cycle Tracker Modal (Editable & Optional) */}
      <FarmerEstrusModal
        open={isEstrusModalOpen}
        onOpenChange={setIsEstrusModalOpen}
        selectedCattleId={editingEstrusCattleId}
        cattleList={CATTLE_CATALOG}
        farmerEstrusTimes={farmerEstrusTimes}
        onSave={handleSaveFarmerEstrusTime}
      />
    </div>
  );
}
