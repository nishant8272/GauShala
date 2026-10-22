import { useState, useMemo } from "react";
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

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
  status: string;
  rowNumber: number;
}

interface LiveTelemetryStreamProps {
  telemetry: TelemetryRow[];
  totalSyncedRows: number;
  checkpointRow: number;
  onRefresh?: () => void;
}

export function LiveTelemetryStream({
  telemetry = [],
  totalSyncedRows = 24,
  checkpointRow = 25,
}: LiveTelemetryStreamProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [chartView, setChartView] = useState<"motion" | "acceleration" | "vitals">("motion");

  // Filtered rows
  const filteredRows = useMemo(() => {
    return telemetry.filter((row) => {
      const matchesSearch =
        search === "" ||
        row.cowId.toLowerCase().includes(search.toLowerCase()) ||
        row.timestamp.includes(search) ||
        row.status.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || row.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [telemetry, search, statusFilter]);

  // Chart data formatted
  const chartData = useMemo(() => {
    return telemetry.slice(-30).map((row) => ({
      time: row.timestamp.split(" ")[1] || row.timestamp,
      motion: row.motion,
      countX: row.countX,
      countY: row.countY,
      countZ: row.countZ,
      spo2: row.spo2 || 98,
      heartRate: row.heartRate || 72,
      status: row.status,
    }));
  }, [telemetry]);

  // CSV export handler
  const handleExportCSV = () => {
    const headers = ["RowNumber,Timestamp,CowID,Motion,CountX,CountY,CountZ,SpO2,HeartRate,Status"];
    const rows = filteredRows.map(
      (r) =>
        `${r.rowNumber},"${r.timestamp}","${r.cowId}",${r.motion},${r.countX},${r.countY},${r.countZ},${r.spo2 || ""},${r.heartRate || ""},"${r.status}"`
    );
    const blob = new Blob([[...headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `google_sheet_cattle_telemetry_checkpoint_${checkpointRow}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Real-time Telemetry Trend Chart */}
      <Card className="border border-border/80 shadow-sm bg-card">
        <CardHeader className="p-4 sm:p-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#990000]/10 flex items-center justify-center text-[#990000]">
              <TrendingUp className="w-4 h-4 text-[#990000]" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                Google Sheet Live Telemetry Feed
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Continuous sensor acceleration & behavioral motion stream
              </p>
            </div>
          </div>

          {/* Chart Toggle View */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg">
            <Button
              size="sm"
              variant={chartView === "motion" ? "default" : "ghost"}
              onClick={() => setChartView("motion")}
              className={`h-7 px-2.5 text-xs font-semibold ${
                chartView === "motion" ? "bg-[#990000] text-white hover:bg-[#800000]" : ""
              }`}
            >
              Motion (Sensor B)
            </Button>
            <Button
              size="sm"
              variant={chartView === "acceleration" ? "default" : "ghost"}
              onClick={() => setChartView("acceleration")}
              className={`h-7 px-2.5 text-xs font-semibold ${
                chartView === "acceleration" ? "bg-[#990000] text-white hover:bg-[#800000]" : ""
              }`}
            >
              XYZ Axes (Cols C, D, E)
            </Button>
            <Button
              size="sm"
              variant={chartView === "vitals" ? "default" : "ghost"}
              onClick={() => setChartView("vitals")}
              className={`h-7 px-2.5 text-xs font-semibold ${
                chartView === "vitals" ? "bg-[#990000] text-white hover:bg-[#800000]" : ""
              }`}
            >
              SpO2 & Heart Rate
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === "motion" ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="motionFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#990000" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#990000" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis domain={["dataMin - 5000", "dataMax + 5000"]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      border: "none",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="motion"
                    stroke="#990000"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#motionFill)"
                    name="Motion Level"
                  />
                </AreaChart>
              ) : chartView === "acceleration" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      border: "none",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="countX" stroke="#3b82f6" strokeWidth={2} name="CountX" />
                  <Line type="monotone" dataKey="countY" stroke="#10b981" strokeWidth={2} name="CountY" />
                  <Line type="monotone" dataKey="countZ" stroke="#f59e0b" strokeWidth={2} name="CountZ" />
                </LineChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="spo2" domain={[85, 100]} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="hr" orientation="right" domain={[50, 120]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      border: "none",
                    }}
                  />
                  <Legend />
                  <Line yAxisId="spo2" type="monotone" dataKey="spo2" stroke="#06b6d4" strokeWidth={2.5} name="SpO2 (%)" />
                  <Line yAxisId="hr" type="monotone" dataKey="heartRate" stroke="#ec4899" strokeWidth={2.5} name="Heart Rate (bpm)" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Synced Google Sheet Data Table */}
      <Card className="border border-border/80 shadow-sm bg-card">
        <CardHeader className="p-4 sm:p-5 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <span>Google Sheet Synchronized Table</span>
                <Badge variant="outline" className="font-mono text-xs font-semibold bg-primary/5 text-primary">
                  {filteredRows.length} Rows
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exact schema ingested from Sheet1 (Columns A to I) • Checkpoint: Row #{checkpointRow}
              </p>
            </div>

            {/* Filter, Search & Export Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Filter row, time, cow..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs bg-muted/40"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-md text-xs">
                {["all", "normal", "restless"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold capitalize transition-all ${
                      statusFilter === st
                        ? "bg-card text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Export CSV */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
                className="h-8 px-2.5 text-xs gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/40">
              <tr>
                <th className="px-4 py-2.5">Row #</th>
                <th className="px-4 py-2.5">Timestamp (Col A)</th>
                <th className="px-4 py-2.5">Cow ID</th>
                <th className="px-4 py-2.5">Motion (Col B)</th>
                <th className="px-3 py-2.5 text-center">CountX (C)</th>
                <th className="px-3 py-2.5 text-center">CountY (D)</th>
                <th className="px-3 py-2.5 text-center">CountZ (E)</th>
                <th className="px-4 py-2.5">SpO2 (F)</th>
                <th className="px-4 py-2.5">Heart Rate (G)</th>
                <th className="px-4 py-2.5">Status (Col I)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredRows.map((row) => {
                const isRestless = row.status?.toLowerCase() === "restless";
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-muted/30 transition-colors font-mono ${
                      isRestless ? "bg-amber-500/10 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-bold text-foreground">
                      #{row.rowNumber}
                    </td>
                    <td className="px-4 py-2.5 text-foreground/90 whitespace-nowrap">
                      {row.timestamp}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-[#990000] dark:text-red-400">
                      {row.cowId}
                    </td>
                    <td className="px-4 py-2.5 font-extrabold text-foreground">
                      <span className={isRestless ? "text-red-600 font-black text-sm" : ""}>
                        {row.motion.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground">
                      {row.countX}
                    </td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground">
                      {row.countY}
                    </td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground">
                      {row.countZ}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">
                      {row.spo2 ? `${row.spo2}%` : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">
                      {row.heartRate ? `${row.heartRate} bpm` : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {isRestless ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700">
                          <AlertTriangle className="w-3 h-3 text-amber-600 animate-bounce" />
                          Restless
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                    No matching sensor records found for the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
