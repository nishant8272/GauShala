import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TransitionAlertsCardProps {
  totalAtRisk: number;
  new24h: number;
  prepartumCount: number;
  prepartumTotal: number;
  freshCount: number;
  freshTotal: number;
}

export function TransitionAlertsCard({
  totalAtRisk = 4,
  new24h = 0,
  prepartumCount = 2,
  prepartumTotal = 11,
  freshCount = 2,
  freshTotal = 9,
}: TransitionAlertsCardProps) {
  const prepPct = prepartumTotal > 0 ? (prepartumCount / prepartumTotal) * 100 : 0;
  const freshPct = freshTotal > 0 ? (freshCount / freshTotal) * 100 : 0;

  return (
    <Card className="border border-border/80 shadow-sm hover:shadow-md transition-shadow bg-card relative overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-[#990000]">
              <AlertCircle className="w-3.5 h-3.5 text-[#990000]" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Transition alerts</h3>
          </div>

          <span className="text-[11px] font-medium text-muted-foreground">
            {new24h} new &lt; 24h
          </span>
        </div>

        {/* Big Number */}
        <div className="mt-3">
          <p className="text-[11px] text-muted-foreground font-medium">Total cows at risk</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {totalAtRisk}
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase">cows</span>
          </div>
        </div>

        {/* Breakdown Progress Bars */}
        <div className="mt-4 space-y-3 pt-1 border-t border-border/40">
          {/* Prepartum */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-medium text-foreground">Prepartum cows at risk</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {prepartumCount}/{prepartumTotal}
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-500"
                style={{ width: `${prepPct}%` }}
              />
            </div>
          </div>

          {/* Fresh cows */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-medium text-foreground">Fresh cows at risk</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">
                {freshCount}/{freshTotal}
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${freshPct}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
