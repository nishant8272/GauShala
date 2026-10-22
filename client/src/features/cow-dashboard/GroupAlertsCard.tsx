import { Users, Sun, Utensils, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface GroupAlertsCardProps {
  totalGroupAlerts: number;
  heatStressCount: number;
  heatStressTotal: number;
  lowFeedCount: number;
  lowFeedTotal: number;
  healthStressCount: number;
  healthStressTotal: number;
}

export function GroupAlertsCard({
  totalGroupAlerts = 3,
  heatStressCount = 1,
  heatStressTotal = 3,
  lowFeedCount = 1,
  lowFeedTotal = 3,
  healthStressCount = 1,
  healthStressTotal = 3,
}: GroupAlertsCardProps) {
  return (
    <Card className="border border-border/80 shadow-sm hover:shadow-md transition-shadow bg-card relative overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-[#990000]">
              <Users className="w-3.5 h-3.5 text-[#990000]" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Group alerts</h3>
          </div>
        </div>

        {/* Big Number */}
        <div className="mt-3">
          <p className="text-[11px] text-muted-foreground font-medium">Total group alerts</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {totalGroupAlerts}
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase">group alerts</span>
          </div>
        </div>

        {/* Breakdown Items */}
        <div className="mt-4 space-y-2.5 pt-1 border-t border-border/40">
          {/* Heat stress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Heat stress</span>
              </div>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {heatStressCount}/{heatStressTotal}
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(heatStressCount / heatStressTotal) * 100}%` }}
              />
            </div>
          </div>

          {/* Low feed intake */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <Utensils className="w-3.5 h-3.5 text-orange-500" />
                <span>Low feed intake</span>
              </div>
              <span className="font-bold text-orange-600 dark:text-orange-400">
                {lowFeedCount}/{lowFeedTotal}
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${(lowFeedCount / lowFeedTotal) * 100}%` }}
              />
            </div>
          </div>

          {/* Health or stress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                <span>Health or stress</span>
              </div>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {healthStressCount}/{healthStressTotal}
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(healthStressCount / healthStressTotal) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
