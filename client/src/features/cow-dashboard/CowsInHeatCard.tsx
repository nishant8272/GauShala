import { useState } from "react";
import { Flame, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

interface CowsInHeatCardProps {
  total: number;
  early: number;
  conventional: number;
  late: number;
  sensorBased: boolean;
  onToggleSensor?: (val: boolean) => void;
}

export function CowsInHeatCard({
  total = 16,
  early = 5,
  conventional = 5,
  late = 6,
  sensorBased = true,
  onToggleSensor,
}: CowsInHeatCardProps) {
  const [isSensorBased, setIsSensorBased] = useState(sensorBased);

  const handleToggle = (checked: boolean) => {
    setIsSensorBased(checked);
    if (onToggleSensor) onToggleSensor(checked);
  };

  return (
    <Card className="border border-border/80 shadow-sm hover:shadow-md transition-shadow bg-card relative overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-[#990000]">
              <Flame className="w-3.5 h-3.5 text-[#990000]" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Cows in heat</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Based sensor</span>
            <Switch
              checked={isSensorBased}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-[#990000] scale-75"
            />
          </div>
        </div>

        {/* Big Number */}
        <div className="mt-3">
          <p className="text-[11px] text-muted-foreground font-medium">Total cows in heat</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {total}
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase">cows</span>
          </div>
        </div>

        {/* Visual Heat Cycle Ramp Polygon Chart matching CowManager */}
        <div className="mt-4 pt-2">
          <div className="relative w-full h-20 sm:h-24">
            <svg viewBox="0 0 300 90" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="heatGreenGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#22c55e" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#15803d" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Ramp polygon shape */}
              <polygon
                points="10,85 10,75 140,20 290,55 290,85"
                fill="url(#heatGreenGradient)"
                stroke="#16a34a"
                strokeWidth="1.5"
                className="transition-all duration-500"
              />

              {/* Zone divider lines */}
              <line x1="100" y1="85" x2="100" y2="35" stroke="#ffffff" strokeDasharray="3 3" strokeWidth="1.5" opacity="0.7" />
              <line x1="200" y1="85" x2="200" y2="35" stroke="#ffffff" strokeDasharray="3 3" strokeWidth="1.5" opacity="0.7" />
            </svg>
          </div>

          {/* Labels for Early, Conventional, Late */}
          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border/40 text-center">
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground font-medium">Early</p>
              <p className="text-xs font-bold text-foreground">
                {early} <span className="text-[10px] font-normal text-muted-foreground">cows</span>
              </p>
            </div>
            <div className="space-y-0.5 border-x border-border/40">
              <p className="text-[10px] text-muted-foreground font-medium">Conventional</p>
              <p className="text-xs font-bold text-foreground">
                {conventional} <span className="text-[10px] font-normal text-muted-foreground">cows</span>
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground font-medium">Late</p>
              <p className="text-xs font-bold text-foreground">
                {late} <span className="text-[10px] font-normal text-muted-foreground">cows</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
