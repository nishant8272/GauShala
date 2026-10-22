import { 
  LayoutDashboard, 
  ListFilter, 
  FileInput, 
  Wheat, 
  LineChart, 
  FileText, 
  Compass, 
  Settings, 
  Grid2X2, 
  Activity, 
  PhoneCall, 
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

interface CowManagerSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function CowManagerSidebar({
  currentView,
  onViewChange,
  collapsed,
  onToggleCollapse,
}: CowManagerSidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: "Live" },
    { id: "cow-list", label: "Cow list", icon: ListFilter },
    { id: "input", label: "Input / Sync Log", icon: FileInput },
    { id: "nutrition", label: "Nutrition", icon: Wheat },
    { id: "analytics", label: "Analytics", icon: LineChart },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "find-my-cow", label: "Find My Cow", icon: Compass },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "multiview", label: "Multiview", icon: Grid2X2 },
    { id: "system-status", label: "System status", icon: Activity },
    { id: "contact", label: "Contact", icon: PhoneCall },
    { id: "support", label: "Support", icon: HelpCircle },
  ];

  return (
    <aside
      className={`bg-white dark:bg-card border-r border-border/80 flex flex-col justify-between transition-all duration-300 select-none shadow-sm z-20 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <div className="py-3">
        {/* Toggle Collapse */}
        <div className="px-3 pb-2 flex justify-end">
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? "bg-[#990000]/10 text-[#990000] font-semibold dark:bg-[#990000]/20"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div
                  className={`p-1 rounded-md transition-colors ${
                    isActive ? "text-[#990000]" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {!collapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!collapsed && isActive && item.badge && (
                  <span className="w-2 h-2 rounded-full bg-[#990000] animate-ping" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Tag */}
      {!collapsed && (
        <div className="p-3 border-t border-border/60 text-[11px] text-muted-foreground bg-muted/30">
          <p className="font-semibold text-foreground/80">CowManager IoT Suite</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Continuous Herd Telemetry</p>
        </div>
      )}
    </aside>
  );
}
