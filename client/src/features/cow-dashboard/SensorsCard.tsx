import { Radio, AlertTriangle, XCircle, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SensorsCardProps {
  totalSensors: number;
  performanceAlerts: number;
  notCommunicating: number;
  delayedData: number;
  checkpointRow?: number;
}

export function SensorsCard({
  totalSensors = 399,
  performanceAlerts = 2,
  notCommunicating = 0,
  delayedData = 0,
  checkpointRow = 25,
}: SensorsCardProps) {
  return (
    <Card className="border border-border/80 shadow-sm hover:shadow-md transition-shadow bg-card relative overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-[#990000]">
              <Radio className="w-3.5 h-3.5 text-[#990000]" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Sensors</h3>
          </div>

          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Online
          </span>
        </div>

        {/* Telemetry Alert Rows */}
        <div className="mt-3 space-y-3">
          {/* Performance alert */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Performance alert</span>
            </div>
            <span className="text-sm font-bold text-foreground">{performanceAlerts}</span>
          </div>

          {/* Not communicating */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>Not communicating</span>
            </div>
            <span className="text-sm font-bold text-foreground">{notCommunicating}</span>
          </div>

          {/* Delayed data */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Delayed data</span>
            </div>
            <span className="text-sm font-bold text-foreground">{delayedData}</span>
          </div>
        </div>

        {/* Bottom Total Footer matching CowManager */}
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Total {totalSensors} Sensors</span>
          <span className="font-mono text-[10px] text-primary/80 bg-primary/10 px-2 py-0.5 rounded">
            Checkpoint: #{checkpointRow}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
