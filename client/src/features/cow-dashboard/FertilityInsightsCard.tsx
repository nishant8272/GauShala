import { Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface FertilityInsightsCardProps {
  reproductionChecks: number;
  suspectedAbortion: number;
  irregularHeats: number;
  noHeatAfterCalving: number;
  possiblePregnant: number;
  totalCows: number;
  distribution?: Array<{ name: string; value: number; color: string }>;
}

export function FertilityInsightsCard({
  reproductionChecks = 8,
  suspectedAbortion = 2,
  irregularHeats = 2,
  noHeatAfterCalving = 3,
  possiblePregnant = 1,
  totalCows = 166,
  distribution = [
    { name: "Normal Cycling", value: 122, color: "#22c55e" },
    { name: "In Heat", value: 16, color: "#3b82f6" },
    { name: "Suspected Sick", value: 10, color: "#ef4444" },
    { name: "Repro Checks", value: 8, color: "#f59e0b" },
    { name: "Transition Risk", value: 10, color: "#94a3b8" },
  ],
}: FertilityInsightsCardProps) {
  return (
    <Card className="border border-border/80 shadow-sm hover:shadow-md transition-shadow bg-card relative overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-[#990000]">
              <Stethoscope className="w-3.5 h-3.5 text-[#990000]" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Fertility Insights</h3>
          </div>
        </div>

        {/* 2-Column Content: Donut Chart on Left, Breakdown List on Right */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Left: Recharts Donut Chart */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-28 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} cows`, name]}
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "11px",
                      border: "none",
                    }}
                  />
                  <Pie
                    data={distribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={36}
                    outerRadius={50}
                    strokeWidth={2}
                    stroke="transparent"
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-black text-foreground">{totalCows}</span>
                <span className="text-[9px] text-muted-foreground uppercase font-semibold">Total</span>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium mt-1">
              Total {totalCows} cows
            </span>
          </div>

          {/* Right: Reproduction Checks Details */}
          <div className="sm:col-span-7 space-y-2 border-t sm:border-t-0 sm:border-l border-border/40 pt-2 sm:pt-0 sm:pl-3">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Reproduction checks</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {reproductionChecks}
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase">cows</span>
              </div>
            </div>

            {/* Sub-items with colored status indicators */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Suspected for abortion</span>
                </div>
                <span className="font-bold text-red-600 dark:text-red-400">{suspectedAbortion}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Irregular heats</span>
                </div>
                <span className="font-bold text-orange-600 dark:text-orange-400">{irregularHeats}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>No heat after calving</span>
                </div>
                <span className="font-bold text-blue-600 dark:text-blue-400">{noHeatAfterCalving}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Possible pregnant</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{possiblePregnant}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
