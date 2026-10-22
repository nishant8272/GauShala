import { HeartPulse, Thermometer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface HealthAlertsCardProps {
  totalSick: number;
  new24h: number;
  verySickCount: number;
  suspiciousSickCount: number;
  noMovementCount: number;
  temperatureAlerts: number;
}

export function HealthAlertsCard({
  totalSick = 10,
  new24h = 5,
  verySickCount = 2,
  suspiciousSickCount = 8,
  noMovementCount = 0,
  temperatureAlerts = 4,
}: HealthAlertsCardProps) {
  const verySickPct = totalSick > 0 ? (verySickCount / totalSick) * 100 : 0;
  const suspiciousPct = totalSick > 0 ? (suspiciousSickCount / totalSick) * 100 : 0;
  const noMovementPct = totalSick > 0 ? (noMovementCount / totalSick) * 100 : 0;

  return (
    <Card className="border border-border/80 shadow-sm hover:shadow-md transition-shadow bg-card relative overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-[#990000]">
              <HeartPulse className="w-3.5 h-3.5 text-[#990000]" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Health alerts</h3>
          </div>

          <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
            {new24h} new &lt; 24h
          </span>
        </div>

        {/* Content Body: 2 Columns (Breakdown bars + Circular Temp Gauge) */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          {/* Left Column: Number + Breakdown bars */}
          <div className="sm:col-span-2 space-y-3">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total sick cows</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {totalSick}
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase">cows</span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-2 pt-1">
              {/* Very Sick */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-foreground">Very sick</span>
                  <span className="font-bold text-red-600 dark:text-red-400">{verySickCount}/{totalSick}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all duration-500"
                    style={{ width: `${verySickPct}%` }}
                  />
                </div>
              </div>

              {/* Suspicious - sick */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-foreground">Suspicious - sick</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">{suspiciousSickCount}/{totalSick}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${suspiciousPct}%` }}
                  />
                </div>
              </div>

              {/* No movement */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-foreground">No movement</span>
                  <span className="font-bold text-muted-foreground">{noMovementCount}/{totalSick}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full transition-all duration-500"
                    style={{ width: `${noMovementPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Circular Temperature Alert Gauge */}
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/40 border border-border/50">
            <span className="text-[10px] text-muted-foreground font-medium text-center">
              Temperature alert
            </span>
            <div className="relative w-16 h-16 mt-1 flex items-center justify-center">
              {/* SVG circular track */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/80"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-red-600 transition-all duration-700"
                  strokeDasharray="65, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                <span className="text-xl font-extrabold text-foreground">{temperatureAlerts}</span>
                <Thermometer className="w-3.5 h-3.5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
