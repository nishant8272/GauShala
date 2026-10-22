import { useState } from "react";
import { 
  Tractor, 
  Search, 
  Heart, 
  Flame, 
  Wheat, 
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Table
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CowManagerHeaderProps {
  activeTab: "fertility" | "health" | "nutrition" | "all";
  onTabChange: (tab: "fertility" | "health" | "nutrition" | "all") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSync: () => void;
  onSimulate: () => void;
  isSyncing: boolean;
  isSimulating: boolean;
  dbConnected: boolean;
  checkpointRow: number;
}

export function CowManagerHeader({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onSync,
  onSimulate,
  isSyncing,
  isSimulating,
  dbConnected,
  checkpointRow,
}: CowManagerHeaderProps) {
  const SHEET_URL = "https://docs.google.com/spreadsheets/d/1f1PUwft6W6PWx1z19JLwzKjwdKdGkf04bmPINPAGAaw/edit?pli=1&gid=0#gid=0";

  return (
    <header className="bg-gradient-to-r from-[#990000] via-[#850000] to-[#6b0000] text-white shadow-md select-none">
      {/* Top Main Navigation Bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
        {/* Brand Logo matching CowManager */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/15 transition-all">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#990000] font-black shadow-inner">
              <span className="text-sm tracking-tighter font-extrabold">CM</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-wider leading-none text-white drop-shadow">
                COW<span className="font-light opacity-95">MANAGER</span>
              </span>
              <span className="text-[10px] text-white/70 font-medium tracking-tight">
                गौशाला Livestock Intelligence
              </span>
            </div>
          </div>

          {/* Database & Checkpoint Status Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-black/25 px-3 py-1 rounded-full text-xs border border-white/10">
            <div className={`w-2 h-2 rounded-full ${dbConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span className="font-mono text-[11px] text-white/90">
              Checkpoint: <span className="font-bold text-amber-300">Row #{checkpointRow}</span>
            </span>
            <span className="text-white/40">|</span>
            <span className="text-[11px] text-white/80">Neon PostgreSQL</span>
          </div>

          {/* Locked Active Google Sheet Link */}
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Connected Google Sheet"
            className="hidden xl:flex items-center gap-1.5 bg-black/30 hover:bg-black/45 px-3 py-1 rounded-full text-[11px] text-white/90 border border-white/15 transition-colors"
          >
            <Table className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sheet: 1f1PUwft... (Locked)</span>
            <ExternalLink className="w-3 h-3 text-white/50" />
          </a>
        </div>

        {/* Center Category Badges (FERTILITY, HEALTH, NUTRITION) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onTabChange("all")}
            className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === "all"
                ? "bg-white text-[#990000] shadow"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            All
          </button>

          <button
            onClick={() => onTabChange("fertility")}
            className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === "fertility"
                ? "bg-white text-[#990000] shadow"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
              <Flame className="w-3 h-3 text-red-400" />
            </div>
            <span>Fertility</span>
          </button>

          <button
            onClick={() => onTabChange("health")}
            className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === "health"
                ? "bg-white text-[#990000] shadow"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
              <Heart className="w-3 h-3 text-emerald-300" />
            </div>
            <span>Health</span>
          </button>

          <button
            onClick={() => onTabChange("nutrition")}
            className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === "nutrition"
                ? "bg-white text-[#990000] shadow"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
              <Wheat className="w-3 h-3 text-amber-300" />
            </div>
            <span>Nutrition</span>
          </button>
        </div>

        {/* Right Search & Sync Actions (Zero Setup Required) */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative w-36 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search cow..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 pl-8 pr-2.5 text-xs bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 rounded-md"
            />
          </div>

          {/* Sync Button */}
          <Button
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            className="h-8 px-3 text-xs bg-white text-[#990000] hover:bg-amber-100 font-bold shadow transition-all gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync Sheet"}</span>
          </Button>

          {/* Simulate New Row Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onSimulate}
            disabled={isSimulating}
            title="Simulate 1 new row appended to sheet"
            className="h-8 px-2.5 text-xs bg-black/20 text-white hover:bg-black/40 border-white/20 gap-1"
          >
            <PlusCircle className={`w-3.5 h-3.5 text-amber-300 ${isSimulating ? "animate-spin" : ""}`} />
            <span className="hidden md:inline text-[11px]">+Row</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
