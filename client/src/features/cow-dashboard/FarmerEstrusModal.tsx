import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles, 
  Trash2, 
  Check, 
  Zap, 
  Info, 
  Activity,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { 
  CattleProfile, 
  calculateEstrusCycleInfo, 
  EstrusCycleInfo 
} from "./multiCattleData";

interface FarmerEstrusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCattleId: string | null;
  cattleList: CattleProfile[];
  farmerEstrusTimes: Record<string, string | null>;
  onSave: (cattleId: string, isoValue: string | null) => void;
}

export function FarmerEstrusModal({
  open,
  onOpenChange,
  selectedCattleId,
  cattleList,
  farmerEstrusTimes,
  onSave,
}: FarmerEstrusModalProps) {
  const [activeId, setActiveId] = useState<string>(selectedCattleId || cattleList[0]?.id || "COW-01");
  const [inputDateTime, setInputDateTime] = useState<string>("");
  const [showCalendarView, setShowCalendarView] = useState<boolean>(true);

  // Sync activeId when selectedCattleId changes
  useEffect(() => {
    if (selectedCattleId) {
      setActiveId(selectedCattleId);
    }
  }, [selectedCattleId]);

  // Sync input value when activeId or farmerEstrusTimes changes
  useEffect(() => {
    const recorded = farmerEstrusTimes[activeId];
    if (recorded) {
      try {
        const d = new Date(recorded);
        if (!isNaN(d.getTime())) {
          const pad = (n: number) => String(n).padStart(2, "0");
          const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          setInputDateTime(formatted);
          return;
        }
      } catch (e) {
        // Fallback to raw string
      }
      setInputDateTime(recorded.slice(0, 16));
    } else {
      setInputDateTime("");
    }
  }, [activeId, farmerEstrusTimes, open]);

  const currentCattle = cattleList.find((c) => c.id === activeId) || cattleList[0];
  const currentSavedValue = farmerEstrusTimes[activeId] ?? null;
  const cycleInfo: EstrusCycleInfo | null = calculateEstrusCycleInfo(currentSavedValue);

  // Active date parsed from inputDateTime
  const parsedDate = useMemo(() => {
    if (!inputDateTime) return null;
    const d = new Date(inputDateTime);
    return isNaN(d.getTime()) ? null : d;
  }, [inputDateTime]);

  // Calendar View month/year navigation state
  const [calendarMonth, setCalendarMonth] = useState<number>(() => {
    return parsedDate ? parsedDate.getMonth() : new Date().getMonth();
  });
  const [calendarYear, setCalendarYear] = useState<number>(() => {
    return parsedDate ? parsedDate.getFullYear() : new Date().getFullYear();
  });

  // Sync calendar view month/year when input date changes
  useEffect(() => {
    if (parsedDate) {
      setCalendarMonth(parsedDate.getMonth());
      setCalendarYear(parsedDate.getFullYear());
    }
  }, [parsedDate]);

  // Format helper to YYYY-MM-DDTHH:mm
  const formatToIsoLocal = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Formatted display text for current input value
  const formattedDisplay = useMemo(() => {
    if (!parsedDate) return null;
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayName = days[parsedDate.getDay()];
    const monName = months[parsedDate.getMonth()];
    const dayNum = String(parsedDate.getDate()).padStart(2, "0");
    const year = parsedDate.getFullYear();
    let hours = parsedDate.getHours();
    const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hourStr = String(hours).padStart(2, "0");
    return `${dayName}, ${dayNum} ${monName} ${year} at ${hourStr}:${minutes} ${ampm}`;
  }, [parsedDate]);

  // Date parts for responsive inline selectors
  const currentYear = parsedDate ? parsedDate.getFullYear() : new Date().getFullYear();
  const currentMonth = parsedDate ? parsedDate.getMonth() + 1 : new Date().getMonth() + 1;
  const currentDay = parsedDate ? parsedDate.getDate() : new Date().getDate();
  const currentHours24 = parsedDate ? parsedDate.getHours() : 6;
  const currentHours12 = currentHours24 % 12 === 0 ? 12 : currentHours24 % 12;
  const currentMinutes = parsedDate ? parsedDate.getMinutes() : 30;
  const currentAmPm = currentHours24 >= 12 ? "PM" : "AM";

  const handleDateChange = (newYear: number, newMonth: number, newDay: number) => {
    const d = parsedDate ? new Date(parsedDate) : new Date();
    d.setFullYear(newYear);
    d.setMonth(newMonth - 1);
    d.setDate(newDay);
    setInputDateTime(formatToIsoLocal(d));
  };

  const handleTimeChange = (hours12: number, minutes: number, ampm: "AM" | "PM") => {
    const d = parsedDate ? new Date(parsedDate) : new Date();
    let h24 = hours12 % 12;
    if (ampm === "PM") h24 += 12;
    d.setHours(h24, minutes, 0, 0);
    setInputDateTime(formatToIsoLocal(d));
  };

  // Custom Calendar Math & Grid Generator (100% CSS Grid, No CSS external dependencies)
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const calendarGrid = useMemo(() => {
    const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();

    // Previous month trailing days
    const prevDays = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      prevDays.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        year: calendarMonth === 0 ? calendarYear - 1 : calendarYear,
        month: calendarMonth === 0 ? 11 : calendarMonth - 1,
      });
    }

    // Current month days
    const currentDays = [];
    for (let d = 1; d <= daysInMonth; d++) {
      currentDays.push({
        day: d,
        isCurrentMonth: true,
        year: calendarYear,
        month: calendarMonth,
      });
    }

    // Next month leading days to complete grid rows
    const totalCells = Math.ceil((prevDays.length + currentDays.length) / 7) * 7;
    const nextDays = [];
    const needed = totalCells - (prevDays.length + currentDays.length);
    for (let d = 1; d <= needed; d++) {
      nextDays.push({
        day: d,
        isCurrentMonth: false,
        year: calendarMonth === 11 ? calendarYear + 1 : calendarYear,
        month: calendarMonth === 11 ? 0 : calendarMonth + 1,
      });
    }

    return [...prevDays, ...currentDays, ...nextDays];
  }, [calendarYear, calendarMonth]);

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleSelectCalendarDay = (cell: { day: number; month: number; year: number }) => {
    const d = parsedDate ? new Date(parsedDate) : new Date();
    d.setFullYear(cell.year);
    d.setMonth(cell.month);
    d.setDate(cell.day);
    setInputDateTime(formatToIsoLocal(d));
  };

  // Quick preset helpers
  const setNow = () => {
    setInputDateTime(formatToIsoLocal(new Date()));
  };

  const set21DaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 21);
    d.setHours(6, 30, 0, 0);
    setInputDateTime(formatToIsoLocal(d));
  };

  const setYesterdayMorning = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(6, 0, 0, 0);
    setInputDateTime(formatToIsoLocal(d));
  };

  const handleClear = () => {
    setInputDateTime("");
    onSave(activeId, null);
    toast.success(`Cleared estrous time for ${currentCattle.name}. Field is now unrecorded/optional.`);
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!inputDateTime.trim()) {
      onSave(activeId, null);
      toast.info(`Marked estrous time as optional/empty for ${currentCattle.name}`);
      onOpenChange(false);
      return;
    }

    onSave(activeId, inputDateTime);
    const updatedCycle = calculateEstrusCycleInfo(inputDateTime);
    toast.success(
      `Saved estrous time for ${currentCattle.name}! (Day ${updatedCycle?.cycleDay ?? "--"} of 21-day cycle)`
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] sm:w-[90vw] max-w-[520px] max-h-[92vh] p-0 flex flex-col bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header (Shrink-0) */}
        <DialogHeader className="p-3.5 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/70 shrink-0 text-left">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 sm:mt-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 pr-6">
              <DialogTitle className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                <span>Farmer Estrous Record</span>
                <span className="text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Editable & Optional
                </span>
              </DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                Record or adjust the last observed standing heat time to track the 21-day bovine estrous recurrence cycle.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body (100% Contained) */}
        <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4 text-xs overflow-y-auto flex-1">
          {/* Cattle Selector Tabs */}
          <div>
            <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
              Select Animal / Cattle:
            </Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {cattleList.map((c) => {
                const isCurrent = c.id === activeId;
                const hasTime = !!farmerEstrusTimes[c.id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all border ${
                      isCurrent
                        ? "bg-slate-900 text-white border-slate-900 font-semibold shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span>{c.shortName}</span>
                    {hasTime ? (
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCurrent ? "bg-emerald-400" : "bg-emerald-500"}`} title="Recorded" />
                    ) : (
                      <span className="text-[9px] text-slate-400 opacity-70 shrink-0">(opt)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Cattle Snapshot Card */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: currentCattle.color }} />
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-xs truncate">{currentCattle.name}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {currentCattle.species} • {currentCattle.breed} • <span className="font-mono">{currentCattle.tagNumber}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              {/* Electrical Conductivity Badge (Read-Only Sensor Biometric) */}
              <div 
                className={`px-2.5 py-1 rounded-lg border text-left sm:text-right flex-1 sm:flex-initial ${
                  currentCattle.electricalConductivity >= 5.5
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
                title="Vaginal / Mucosal Electrical Conductivity in mS/cm (Automated Telemetry Sensor - Read Only, Not Editable)"
              >
                <span className="text-[9px] font-semibold uppercase text-slate-400 block flex items-center sm:justify-end gap-1">
                  <Zap className="w-2.5 h-2.5 shrink-0" />
                  EC (Sensor • Read-Only)
                </span>
                <span className="font-mono font-bold text-xs">
                  {currentCattle.electricalConductivity} mS/cm
                </span>
              </div>

              {/* Status Verdict */}
              <span className={`px-2 py-1 rounded-lg border text-[11px] font-bold shrink-0 ${
                currentCattle.currentVerdict === "In Heat"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : currentCattle.currentVerdict === "Possible Heat"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}>
                {currentCattle.currentVerdict}
              </span>
            </div>
          </div>

          {/* Cycle Analysis Banner */}
          {cycleInfo ? (
            <div className="bg-blue-50/50 border border-blue-200/70 rounded-xl p-3 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  21-Day Estrous Cycle Tracking
                </span>
                <Badge variant="outline" className={`text-[10px] font-bold self-start sm:self-auto ${cycleInfo.badgeColor}`}>
                  Day {cycleInfo.cycleDay} of 21
                </Badge>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
                Last recorded heat was on <span className="font-semibold text-slate-900 font-mono">{cycleInfo.formattedDate}</span> ({cycleInfo.daysAgo} days ago).
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-600 pt-0.5 flex-wrap">
                <span className="font-medium text-blue-800">Biological Phase:</span>
                <span>{cycleInfo.phase}</span>
                {cycleInfo.isRecurringWindow && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                    ★ Fertile Window
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 flex items-start gap-2.5 text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs leading-relaxed">
                <span className="font-medium text-slate-700">No estrous record entered yet for {currentCattle.shortName}.</span>{" "}
                This field is optional. If known, enter the date/time below to initiate 21-day cycle projection.
              </p>
            </div>
          )}

          {/* Fully In-Modal Contained Date & Time Controller */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5 sm:gap-2">
              <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Last Observed Estrous Date & Time:</span>
              </Label>
              <span className="text-[10px] text-slate-400 font-normal italic">
                Leave blank if unrecorded (Optional)
              </span>
            </div>

            {/* Selection Status & Inline Controls Card */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Active Date & Time:
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-0.5 truncate">
                    {formattedDisplay ? formattedDisplay : "Not recorded (Field is Optional)"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCalendarView(!showCalendarView)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                      showCalendarView
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                    <span>{showCalendarView ? "Hide Calendar" : "Show Calendar"}</span>
                    {showCalendarView ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {inputDateTime && (
                    <button
                      type="button"
                      onClick={() => setInputDateTime("")}
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 transition-colors"
                      title="Clear this input"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Pixel-Perfect Clean Inline Calendar (100% Contained, Perfectly Aligned Grid) */}
              {showCalendarView && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="w-full max-w-[310px] mx-auto bg-slate-50/70 border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    {/* Month & Year header with Chevrons */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 mb-1.5">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                        title="Previous month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <span>{monthNames[calendarMonth]}</span>
                        <span className="font-mono text-slate-600">{calendarYear}</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                        title="Next month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Day of week labels (Exact 7-col grid) */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((weekday) => (
                        <div key={weekday} className="text-[11px] font-bold text-slate-400 py-0.5">
                          {weekday}
                        </div>
                      ))}
                    </div>

                    {/* Day cells (Exact 7-col grid, never clumped) */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {calendarGrid.map((cell, idx) => {
                        const isSelected =
                          parsedDate &&
                          parsedDate.getDate() === cell.day &&
                          parsedDate.getMonth() === cell.month &&
                          parsedDate.getFullYear() === cell.year;

                        const today = new Date();
                        const isToday =
                          today.getDate() === cell.day &&
                          today.getMonth() === cell.month &&
                          today.getFullYear() === cell.year;

                        return (
                          <button
                            key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                            type="button"
                            onClick={() => handleSelectCalendarDay(cell)}
                            className={`h-7 sm:h-7.5 w-full rounded-lg text-xs flex items-center justify-center font-medium transition-all ${
                              isSelected
                                ? "bg-slate-900 text-white font-bold shadow-xs scale-102"
                                : isToday
                                ? "border border-blue-400 text-blue-700 bg-blue-50/70 font-semibold hover:bg-blue-100"
                                : cell.isCurrentMonth
                                ? "text-slate-700 hover:bg-white hover:border hover:border-slate-200"
                                : "text-slate-300 hover:text-slate-500"
                            }`}
                          >
                            {cell.day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Direct Responsive Date & Time Dropdown Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {/* Date Selectors (Month, Day, Year) */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Date:
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <select
                      value={currentMonth}
                      onChange={(e) => handleDateChange(currentYear, Number(e.target.value), currentDay)}
                      className="h-8 text-[11px] font-semibold px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    >
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, idx) => (
                        <option key={m} value={idx + 1}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={currentDay}
                      onChange={(e) => handleDateChange(currentYear, currentMonth, Number(e.target.value))}
                      className="h-8 text-[11px] font-semibold px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>{String(d).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <select
                      value={currentYear}
                      onChange={(e) => handleDateChange(Number(e.target.value), currentMonth, currentDay)}
                      className="h-8 text-[11px] font-semibold px-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                    >
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Time Selectors (Hour, Minute, AM/PM) */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Time:
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <select
                      value={currentHours12}
                      onChange={(e) => handleTimeChange(Number(e.target.value), currentMinutes, currentAmPm as any)}
                      className="h-8 text-[11px] font-semibold px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <select
                      value={Math.floor(currentMinutes / 5) * 5}
                      onChange={(e) => handleTimeChange(currentHours12, Number(e.target.value), currentAmPm as any)}
                      className="h-8 text-[11px] font-semibold px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                    >
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden h-8">
                      <button
                        type="button"
                        onClick={() => handleTimeChange(currentHours12, currentMinutes, "AM")}
                        className={`flex-1 text-[10px] font-bold transition-colors ${
                          currentAmPm === "AM" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTimeChange(currentHours12, currentMinutes, "PM")}
                        className={`flex-1 text-[10px] font-bold transition-colors border-l border-slate-200 ${
                          currentAmPm === "PM" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons (Mobile-friendly flex wrap) */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-semibold uppercase text-slate-400 mr-0.5">
                Quick Fill:
              </span>
              <button
                type="button"
                onClick={setNow}
                className="text-[10px] sm:text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 transition-colors"
              >
                Now
              </button>
              <button
                type="button"
                onClick={setYesterdayMorning}
                className="text-[10px] sm:text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 transition-colors"
              >
                Yesterday (06:00 AM)
              </button>
              <button
                type="button"
                onClick={set21DaysAgo}
                className="text-[10px] sm:text-[11px] font-medium px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                title="Set to 21 days ago, matching the bovine estrus recurrence cycle"
              >
                21 Days Ago (Cycle)
              </button>
            </div>
          </div>

          {/* Educational Note */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-2.5 sm:p-3 flex items-start gap-2 text-[10px] sm:text-[11px] text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-800">Why Electrical Conductivity & Estrous Time?</strong>{" "}
              During estrus, vaginal mucus conductivity increases significantly (often &gt; 5.5 mS/cm) due to elevated electrolyte concentrations (Na⁺, Cl⁻). Comparing this biophysical reading with the farmer's 21-day cycle log provides dual-factor validation before artificial insemination.
            </p>
          </div>
        </div>

        {/* Footer (Mobile friendly flex-col-reverse / sm:flex-row) */}
        <DialogFooter className="p-3 sm:p-4 bg-slate-50/90 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="order-2 sm:order-1 flex justify-center sm:justify-start">
            {currentSavedValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="w-full sm:w-auto h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 px-2.5 justify-center"
                title="Remove this record and restore optional empty state"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Remove (Make Optional)</span>
              </Button>
            )}
          </div>

          <div className="order-1 sm:order-2 flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="flex-1 sm:flex-none h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold gap-1.5 px-3.5 shadow-xs justify-center"
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Save Estrous Record</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}