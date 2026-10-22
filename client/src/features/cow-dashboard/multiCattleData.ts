export interface CattleProfile {
  id: string;
  name: string;
  shortName: string;
  species: "Cow" | "Buffalo";
  breed: string;
  tagNumber: string;
  color: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  // Heat specific
  currentVerdict: "In Heat" | "Possible Heat" | "Normal";
  currentMotion: number;
  currentHeartRate: number;
  currentTemp: number;
  currentSpo2: number;
  electricalConductivity: number; // Vaginal/Mucosal Electrical Conductivity in mS/cm (3.5 - 7.5 mS/cm)
  lastEstrusTime: string | null; // Optional farmer-entered estrus timestamp (ISO string or null)
  statusDescription: string;
  // Motion specific
  motionVerdict: "High Mobility" | "Active Grazing" | "Resting / Shed" | "Pasture Grazing";
  motionBadgeBg: string;
  motionBadgeText: string;
  motionBadgeBorder: string;
  dailySteps: number;
  activeHours: number;
  ruminationMin: number;
  countX: number;
  countY: number;
  countZ: number;
  vigorScore: number;
  cadence: string;
  motionDescription: string;
}

export const CATTLE_CATALOG: CattleProfile[] = [
  {
    id: "COW-01",
    name: "Cow — Ganga",
    shortName: "Ganga",
    species: "Cow",
    breed: "Gir Cow",
    tagNumber: "TAG-9011",
    color: "#1d70b8", // Royal Blue
    dotColor: "bg-[#1d70b8]",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200",
    currentVerdict: "In Heat",
    currentMotion: 84250,
    currentHeartRate: 98,
    currentTemp: 39.4,
    currentSpo2: 94,
    electricalConductivity: 7.2, // Elevated peak surge in mS/cm
    lastEstrusTime: "2026-10-01T06:30", // Day 21 of bovine cycle
    statusDescription: "Mounting activity surge, elevated core temp & 7.2 mS/cm conductivity. Estrus peak confirmed.",
    motionVerdict: "High Mobility",
    motionBadgeBg: "bg-blue-50",
    motionBadgeText: "text-blue-700",
    motionBadgeBorder: "border-blue-200",
    dailySteps: 14850,
    activeHours: 9.4,
    ruminationMin: 320,
    countX: 226,
    countY: 189,
    countZ: 252,
    vigorScore: 98,
    cadence: "124 steps/min",
    motionDescription: "Rapid tri-axial movement, high forward propulsion and restlessness.",
  },
  {
    id: "BUF-02",
    name: "Buffalo — Kasuri",
    shortName: "Kasuri",
    species: "Buffalo",
    breed: "Murrah Buffalo",
    tagNumber: "TAG-8824",
    color: "#059669", // Emerald Green
    dotColor: "bg-[#059669]",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    currentVerdict: "Possible Heat",
    currentMotion: 63800,
    currentHeartRate: 84,
    currentTemp: 38.9,
    currentSpo2: 96,
    electricalConductivity: 5.8, // Rising conductivity proestrus
    lastEstrusTime: "2026-10-02T14:00", // Day 20 of cycle
    statusDescription: "Motor restlessness rising above 60k threshold & EC climbing (5.8 mS/cm). Approaching standing heat.",
    motionVerdict: "Active Grazing",
    motionBadgeBg: "bg-emerald-50",
    motionBadgeText: "text-emerald-700",
    motionBadgeBorder: "border-emerald-200",
    dailySteps: 11200,
    activeHours: 7.8,
    ruminationMin: 390,
    countX: 185,
    countY: 155,
    countZ: 210,
    vigorScore: 76,
    cadence: "88 steps/min",
    motionDescription: "Steady walking cadence with elevated vertical grazing movements.",
  },
  {
    id: "COW-03",
    name: "Cow — Nandini",
    shortName: "Nandini",
    species: "Cow",
    breed: "Sahiwal Cow",
    tagNumber: "TAG-7712",
    color: "#7c3aed", // Vivid Violet
    dotColor: "bg-[#7c3aed]",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    badgeBorder: "border-purple-200",
    currentVerdict: "Normal",
    currentMotion: 21400,
    currentHeartRate: 68,
    currentTemp: 38.3,
    currentSpo2: 98,
    electricalConductivity: 3.9, // Normal baseline
    lastEstrusTime: "2026-10-12T09:15", // Mid-diestrus (~Day 10)
    statusDescription: "Resting comfortably in shed. Electrical conductivity baseline (3.9 mS/cm) & normal vitals.",
    motionVerdict: "Resting / Shed",
    motionBadgeBg: "bg-slate-50",
    motionBadgeText: "text-slate-600",
    motionBadgeBorder: "border-slate-200",
    dailySteps: 4600,
    activeHours: 4.2,
    ruminationMin: 480,
    countX: 121,
    countY: 101,
    countZ: 144,
    vigorScore: 32,
    cadence: "42 steps/min",
    motionDescription: "Prolonged lying posture with steady, rhythmic rumination cycles.",
  },
  {
    id: "COW-04",
    name: "Cow — Shanti",
    shortName: "Shanti",
    species: "Cow",
    breed: "Red Sindhi",
    tagNumber: "TAG-6641",
    color: "#d97706", // Amber
    dotColor: "bg-[#d97706]",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200",
    currentVerdict: "Normal",
    currentMotion: 24900,
    currentHeartRate: 72,
    currentTemp: 38.5,
    currentSpo2: 97,
    electricalConductivity: 4.1, // Normal baseline
    lastEstrusTime: null, // Optional Demonstration: Farmer has not recorded estrus time yet
    statusDescription: "Active pasture grazing. Normal baseline conductivity (4.1 mS/cm). Estrus log optional/pending.",
    motionVerdict: "Pasture Grazing",
    motionBadgeBg: "bg-teal-50",
    motionBadgeText: "text-teal-700",
    motionBadgeBorder: "border-teal-200",
    dailySteps: 5900,
    activeHours: 5.6,
    ruminationMin: 460,
    countX: 142,
    countY: 119,
    countZ: 164,
    vigorScore: 48,
    cadence: "56 steps/min",
    motionDescription: "Balanced pasture browsing and periodic low-frequency locomotion.",
  },
  {
    id: "BUF-05",
    name: "Buffalo — Kaveri",
    shortName: "Kaveri",
    species: "Buffalo",
    breed: "Nili-Ravi",
    tagNumber: "TAG-5509",
    color: "#e11d48", // Rose Red
    dotColor: "bg-[#e11d48]",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700",
    badgeBorder: "border-rose-200",
    currentVerdict: "In Heat",
    currentMotion: 79100,
    currentHeartRate: 94,
    currentTemp: 39.2,
    currentSpo2: 95,
    electricalConductivity: 6.9, // High surge
    lastEstrusTime: "2026-10-01T10:45", // Day 21 of cycle
    statusDescription: "Secondary mounting attempts recorded. High conductivity surge (6.9 mS/cm). Insemination window open.",
    motionVerdict: "High Mobility",
    motionBadgeBg: "bg-blue-50",
    motionBadgeText: "text-blue-700",
    motionBadgeBorder: "border-blue-200",
    dailySteps: 13900,
    activeHours: 9.1,
    ruminationMin: 335,
    countX: 224,
    countY: 186,
    countZ: 250,
    vigorScore: 95,
    cadence: "118 steps/min",
    motionDescription: "Elevated locomotion velocity and frequent pacing along enclosure perimeter.",
  },
];

export interface MultiCattlePoint {
  timestamp: string;
  timeShort: string;
  [key: string]: any;
}

export interface MultiCattleTableRow {
  id: string;
  rowNumber: number;
  cattleId: string;
  cattleName: string;
  species: "Cow" | "Buffalo";
  color: string;
  timestamp: string;
  motion: number;
  countX: number;
  countY: number;
  countZ: number;
  heartRate: number;
  spo2: number;
  temp: number;
  conductivity: number; // mS/cm
  status: "Normal" | "Restless" | "MOUNTING!";
  verdict: "Normal" | "Possible Heat" | "In Heat";
}

export interface MultiCattleVerdictItem {
  id: string;
  cattleId: string;
  cattleName: string;
  color: string;
  verdict: "Possible Heat" | "In Heat";
  status: string;
  heartRate: number;
  temp: number;
  spo2: number;
  motion: number;
  conductivity: number; // mS/cm
  timestamp: string;
}

export interface MultiCattleDailyPoint {
  day: string;
  [key: string]: any;
}

export interface EstrusCycleInfo {
  formattedDate: string;
  rawIso: string;
  daysAgo: number;
  cycleDay: number;
  phase: "Standing Heat (Surge Window)" | "Proestrus (Approaching Heat)" | "Diestrus (Luteal Phase)" | "Metestrus (Early Post-Heat)";
  badgeColor: string;
  isRecurringWindow: boolean;
}

/**
 * Calculates biological 21-day bovine estrous cycle status from a farmer-entered date
 * If estrusIso is null/empty, returns null (field is optional).
 */
export function calculateEstrusCycleInfo(
  estrusIso: string | null | undefined,
  referenceDate: Date = new Date("2026-10-22T11:34:00")
): EstrusCycleInfo | null {
  if (!estrusIso || estrusIso.trim() === "") return null;
  const parsed = new Date(estrusIso);
  if (isNaN(parsed.getTime())) return null;

  const diffMs = referenceDate.getTime() - parsed.getTime();
  const daysAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  // Standard bovine estrous cycle length = 21 days
  const cycleDay = (daysAgo % 21) + 1;

  let phase: EstrusCycleInfo["phase"] = "Diestrus (Luteal Phase)";
  let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
  let isRecurringWindow = false;

  if (cycleDay === 21 || cycleDay === 1) {
    phase = "Standing Heat (Surge Window)";
    badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
    isRecurringWindow = true;
  } else if (cycleDay >= 19 && cycleDay <= 20) {
    phase = "Proestrus (Approaching Heat)";
    badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
    isRecurringWindow = true;
  } else if (cycleDay >= 2 && cycleDay <= 4) {
    phase = "Metestrus (Early Post-Heat)";
    badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
  }

  const formattedDate = parsed.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return {
    formattedDate,
    rawIso: estrusIso,
    daysAgo,
    cycleDay,
    phase,
    badgeColor,
    isRecurringWindow,
  };
}

/**
 * Formats a clean date range string for the selected timeframe and scrubber position
 */
export function getTimeframeDateRangeStr(
  timeframe: "all" | "24h" | "7d" | "30d" | "90d" | "1y" | "custom" = "24h",
  customRange?: { start: string; end: string } | null,
  sliderValue: number = 100
): string {
  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const fmtFull = (d: Date) => {
    const day = String(d.getDate()).padStart(2, "0");
    const m = monthNames[d.getMonth()];
    const y = d.getFullYear();
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    const h12 = hours % 12 ? hours % 12 : 12;
    return `${day} ${m} ${y}, ${String(h12).padStart(2, "0")}:${mins} ${ampm}`;
  };

  const fmtDateOnly = (d: Date) => {
    const day = String(d.getDate()).padStart(2, "0");
    const m = monthNames[d.getMonth()];
    const y = d.getFullYear();
    return `${day} ${m} ${y}`;
  };

  if (timeframe === "custom" && customRange?.start) {
    const startD = new Date(customRange.start);
    const endD = customRange.end ? new Date(customRange.end) : now;
    return `${fmtDateOnly(startD)} TO ${fmtDateOnly(endD)}`;
  }

  let durationMs = 24 * 60 * 60 * 1000;
  if (timeframe === "7d") durationMs = 7 * 24 * 60 * 60 * 1000;
  else if (timeframe === "30d") durationMs = 30 * 24 * 60 * 60 * 1000;
  else if (timeframe === "90d") durationMs = 90 * 24 * 60 * 60 * 1000;
  else if (timeframe === "1y" || timeframe === "all") durationMs = 365 * 24 * 60 * 60 * 1000;

  // Window pan offset based on slider (100 = real-time, 10 = back in time)
  const shiftMs = (100 - sliderValue) * 0.01 * durationMs * 0.8;
  const endDate = new Date(now.getTime() - shiftMs);
  const startDate = new Date(endDate.getTime() - durationMs);

  if (timeframe === "24h") {
    return `${fmtFull(startDate)} TO ${fmtFull(endDate)}`;
  }
  return `${fmtFull(startDate)} TO ${fmtFull(endDate)}`;
}

/**
 * Generate synchronized continuous multi-cattle telemetry points parameterized by timeframe and scrubber slider
 */
export function generateMultiCattleTelemetryData(
  timeframe: "all" | "24h" | "7d" | "30d" | "90d" | "1y" | "custom" = "24h",
  customRange?: { start: string; end: string } | null,
  sliderValue: number = 100
): MultiCattlePoint[] {
  const points: MultiCattlePoint[] = [];
  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  let totalDurationMs = 24 * 60 * 60 * 1000;
  let numPoints = 28;

  if (timeframe === "7d") {
    totalDurationMs = 7 * 24 * 60 * 60 * 1000;
    numPoints = 28;
  } else if (timeframe === "30d") {
    totalDurationMs = 30 * 24 * 60 * 60 * 1000;
    numPoints = 30;
  } else if (timeframe === "90d") {
    totalDurationMs = 90 * 24 * 60 * 60 * 1000;
    numPoints = 30;
  } else if (timeframe === "1y" || timeframe === "all") {
    totalDurationMs = 365 * 24 * 60 * 60 * 1000;
    numPoints = 26;
  } else if (timeframe === "custom" && customRange?.start) {
    const s = new Date(customRange.start).getTime();
    const e = customRange.end ? new Date(customRange.end).getTime() : now.getTime();
    totalDurationMs = Math.max(3600000, e - s);
    numPoints = 28;
  }

  // Pan shift based on timeline scrubber
  const shiftMs = (100 - sliderValue) * 0.01 * totalDurationMs * 0.8;
  const endMs = now.getTime() - shiftMs;
  const startMs = endMs - totalDurationMs;
  const stepMs = totalDurationMs / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const ptDate = new Date(startMs + i * stepMs);
    const day = String(ptDate.getDate()).padStart(2, "0");
    const month = monthNames[ptDate.getMonth()];
    const year = ptDate.getFullYear();
    let hours = ptDate.getHours();
    const minutes = String(ptDate.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    const hours12 = hours % 12 ? hours % 12 : 12;
    const timeClock = `${String(hours12).padStart(2, "0")}:${minutes} ${ampm}`;

    let timeShort = timeClock;
    if (timeframe === "7d") {
      timeShort = `${day} ${month} ${String(hours12).padStart(2, "0")}${ampm}`;
    } else if (timeframe === "30d" || timeframe === "90d") {
      timeShort = `${day} ${month}`;
    } else if (timeframe === "1y" || timeframe === "all") {
      timeShort = `${month} ${String(year).slice(2)}`;
    } else if (timeframe === "custom") {
      timeShort = totalDurationMs <= 86400000 * 2 ? timeClock : `${day} ${month}`;
    }

    const timestamp = `${day} ${month} ${year}, ${timeClock}`;
    const pt: MultiCattlePoint = {
      timestamp,
      timeShort,
    };

    const progress = i / (numPoints - 1);

    // Realistic estrus dynamics:
    let gangaSurgeFactor = 0;
    let kaveriSurgeFactor = 0;
    let kasuriSurgeFactor = 0;

    if (timeframe === "24h") {
      // Acute surge occurring near the latest window
      gangaSurgeFactor = progress > 0.7 ? Math.pow((progress - 0.7) / 0.3, 1.4) : 0;
      kaveriSurgeFactor = progress > 0.65 ? Math.pow((progress - 0.65) / 0.35, 1.3) : 0;
      kasuriSurgeFactor = progress > 0.75 ? (progress - 0.75) / 0.25 : 0;
    } else if (timeframe === "7d") {
      gangaSurgeFactor = progress > 0.8 ? (progress - 0.8) / 0.2 : 0;
      kaveriSurgeFactor = progress > 0.75 ? (progress - 0.75) / 0.25 : 0;
      kasuriSurgeFactor = progress > 0.82 ? (progress - 0.82) / 0.18 : 0;
    } else if (timeframe === "30d") {
      // 21-day cycle recurrence
      const peak1 = Math.exp(-Math.pow((progress - 0.25) / 0.08, 2));
      const peak2 = Math.exp(-Math.pow((progress - 0.95) / 0.08, 2));
      gangaSurgeFactor = Math.max(peak1 * 0.9, peak2);
      kaveriSurgeFactor = Math.max(peak1 * 0.85, peak2 * 0.95);
      kasuriSurgeFactor = peak2 * 0.7;
    } else {
      // 90d / 1y: periodic estrus spikes every ~21 days
      const cycle = Math.sin(progress * Math.PI * 6);
      gangaSurgeFactor = cycle > 0.6 ? (cycle - 0.6) / 0.4 : 0;
      kaveriSurgeFactor = Math.sin(progress * Math.PI * 6 + 0.3) > 0.65 ? 0.9 : 0;
      kasuriSurgeFactor = cycle > 0.45 && cycle <= 0.75 ? 0.65 : 0;
    }

    if (sliderValue < 70 && timeframe === "24h") {
      gangaSurgeFactor *= sliderValue / 100;
      kaveriSurgeFactor *= sliderValue / 100;
      kasuriSurgeFactor *= sliderValue / 100;
    }

    // 1. Ganga (COW-01) - Gir Cow
    let gangaMotion = Math.floor(19000 + Math.sin(i * 0.3) * 3500 + gangaSurgeFactor * 62000);
    const gangaIsMounting = gangaMotion >= 80000;
    const gangaIsRestless = !gangaIsMounting && gangaMotion >= 60000;
    pt["motion_COW-01"] = gangaMotion;
    pt["abnormalMotion_COW-01"] = gangaIsMounting || gangaIsRestless ? gangaMotion : null;
    pt["hr_COW-01"] = Math.floor(68 + (gangaMotion / 85000) * 30);
    pt["temp_COW-01"] = Number((38.2 + (gangaMotion / 85000) * 1.3).toFixed(1));
    pt["spo2_COW-01"] = Math.floor(98 - (gangaMotion / 85000) * 4);
    pt["conductivity_COW-01"] = Number((4.0 + (gangaMotion / 85000) * 3.2).toFixed(1)); // Vaginal/Mucosal EC in mS/cm
    pt["countX_COW-01"] = Math.floor(120 + Math.sin(i * 0.4) * 40 + gangaMotion / 800);
    pt["countY_COW-01"] = Math.floor(95 + Math.cos(i * 0.4) * 30 + gangaMotion / 900);
    pt["countZ_COW-01"] = Math.floor(140 + Math.sin(i * 0.2) * 50 + gangaMotion / 750);
    pt["status_COW-01"] = gangaIsMounting ? "MOUNTING!" : gangaIsRestless ? "Restless" : "Normal";
    pt["verdict_COW-01"] = gangaIsMounting ? "In Heat" : gangaIsRestless ? "Possible Heat" : "Normal";

    // 2. Kasuri (BUF-02) - Murrah Buffalo
    let kasuriMotion = Math.floor(22000 + Math.cos(i * 0.35) * 4000 + kasuriSurgeFactor * 42000);
    const kasuriIsMounting = kasuriMotion >= 80000;
    const kasuriIsRestless = !kasuriIsMounting && kasuriMotion >= 60000;
    pt["motion_BUF-02"] = kasuriMotion;
    pt["abnormalMotion_BUF-02"] = kasuriIsMounting || kasuriIsRestless ? kasuriMotion : null;
    pt["hr_BUF-02"] = Math.floor(66 + (kasuriMotion / 70000) * 20);
    pt["temp_BUF-02"] = Number((38.3 + (kasuriMotion / 70000) * 0.7).toFixed(1));
    pt["spo2_BUF-02"] = Math.floor(97 - (kasuriMotion / 70000) * 2);
    pt["conductivity_BUF-02"] = Number((3.8 + (kasuriMotion / 70000) * 2.0).toFixed(1)); // Vaginal/Mucosal EC in mS/cm
    pt["countX_BUF-02"] = Math.floor(110 + kasuriMotion / 850);
    pt["countY_BUF-02"] = Math.floor(88 + kasuriMotion / 950);
    pt["countZ_BUF-02"] = Math.floor(130 + kasuriMotion / 800);
    pt["status_BUF-02"] = kasuriIsMounting ? "MOUNTING!" : kasuriIsRestless ? "Restless" : "Normal";
    pt["verdict_BUF-02"] = kasuriIsMounting ? "In Heat" : kasuriIsRestless ? "Possible Heat" : "Normal";

    // 3. Nandini (COW-03) - Sahiwal Cow
    const nandiniMotion = Math.floor(18500 + Math.sin(i * 0.5) * 3200 + (i % 4) * 800);
    pt["motion_COW-03"] = nandiniMotion;
    pt["abnormalMotion_COW-03"] = null;
    pt["hr_COW-03"] = Math.floor(66 + Math.sin(i * 0.3) * 4);
    pt["temp_COW-03"] = Number((38.2 + Math.cos(i * 0.2) * 0.2).toFixed(1));
    pt["spo2_COW-03"] = Math.floor(97 + (i % 3 === 0 ? 1 : 0));
    pt["conductivity_COW-03"] = Number((3.9 + Math.sin(i * 0.2) * 0.1).toFixed(1)); // Baseline EC in mS/cm
    pt["countX_COW-03"] = Math.floor(100 + nandiniMotion / 1000);
    pt["countY_COW-03"] = Math.floor(80 + nandiniMotion / 1100);
    pt["countZ_COW-03"] = Math.floor(120 + nandiniMotion / 900);
    pt["status_COW-03"] = "Normal";
    pt["verdict_COW-03"] = "Normal";

    // 4. Shanti (COW-04) - Red Sindhi
    const shantiMotion = Math.floor(21000 + Math.sin(i * 0.4) * 5000 + (i % 5) * 1000);
    pt["motion_COW-04"] = shantiMotion;
    pt["abnormalMotion_COW-04"] = null;
    pt["hr_COW-04"] = Math.floor(70 + Math.cos(i * 0.3) * 3);
    pt["temp_COW-04"] = Number((38.4 + Math.sin(i * 0.3) * 0.2).toFixed(1));
    pt["spo2_COW-04"] = Math.floor(96 + (i % 2));
    pt["conductivity_COW-04"] = Number((4.1 + Math.cos(i * 0.3) * 0.1).toFixed(1)); // Baseline EC in mS/cm
    pt["countX_COW-04"] = Math.floor(115 + shantiMotion / 900);
    pt["countY_COW-04"] = Math.floor(92 + shantiMotion / 1000);
    pt["countZ_COW-04"] = Math.floor(135 + shantiMotion / 850);
    pt["status_COW-04"] = "Normal";
    pt["verdict_COW-04"] = "Normal";

    // 5. Kaveri (BUF-05) - Nili-Ravi Buffalo
    let kaveriMotion = Math.floor(23000 + Math.sin(i * 0.45) * 5000 + kaveriSurgeFactor * 57000);
    const kaveriIsMounting = kaveriMotion >= 80000;
    const kaveriIsRestless = !kaveriIsMounting && kaveriMotion >= 60000;
    pt["motion_BUF-05"] = kaveriMotion;
    pt["abnormalMotion_BUF-05"] = kaveriIsMounting || kaveriIsRestless ? kaveriMotion : null;
    pt["hr_BUF-05"] = Math.floor(72 + (kaveriMotion / 80000) * 24);
    pt["temp_BUF-05"] = Number((38.4 + (kaveriMotion / 80000) * 0.9).toFixed(1));
    pt["spo2_BUF-05"] = Math.floor(97 - (kaveriMotion / 80000) * 3);
    pt["conductivity_BUF-05"] = Number((4.1 + (kaveriMotion / 80000) * 2.8).toFixed(1)); // High surge EC in mS/cm
    pt["countX_BUF-05"] = Math.floor(125 + kaveriMotion / 800);
    pt["countY_BUF-05"] = Math.floor(98 + kaveriMotion / 900);
    pt["countZ_BUF-05"] = Math.floor(145 + kaveriMotion / 750);
    pt["status_BUF-05"] = kaveriIsMounting ? "MOUNTING!" : kaveriIsRestless ? "Restless" : "Normal";
    pt["verdict_BUF-05"] = kaveriIsMounting ? "In Heat" : kaveriIsRestless ? "Possible Heat" : "Normal";

    points.push(pt);
  }

  return points;
}

/**
 * Generate multi-cattle comparative bar chart data adapted to timeframe
 */
export function generateMultiCattleDailyView(
  timeframe: "all" | "24h" | "7d" | "30d" | "90d" | "1y" | "custom" = "7d"
): MultiCattleDailyPoint[] {
  let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
  if (timeframe === "24h") {
    days = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Latest"];
  } else if (timeframe === "7d") {
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
  } else if (timeframe === "30d") {
    days = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Current"];
  } else if (timeframe === "90d") {
    days = ["Month -2", "Month -1", "Current Month"];
  } else if (timeframe === "1y" || timeframe === "all") {
    days = ["Q1", "Q2", "Q3", "Q4"];
  }

  return days.map((day, idx) => {
    const isLatest = idx === days.length - 1;
    const pt: MultiCattleDailyPoint = { day };

    CATTLE_CATALOG.forEach((cattle) => {
      let peak = 28000;
      let avg = 20000;
      if (cattle.id === "COW-01") {
        peak = isLatest ? 84250 : Math.floor(48000 + Math.sin(idx * 0.9) * 16000);
        avg = Math.round(peak * 0.65);
      } else if (cattle.id === "BUF-02") {
        peak = isLatest ? 63800 : Math.floor(42000 + Math.cos(idx * 0.7) * 12000);
        avg = Math.round(peak * 0.62);
      } else if (cattle.id === "COW-03") {
        peak = Math.floor(25000 + Math.sin(idx * 0.5) * 5000);
        avg = Math.round(peak * 0.7);
      } else if (cattle.id === "COW-04") {
        peak = Math.floor(29000 + Math.cos(idx * 0.6) * 6000);
        avg = Math.round(peak * 0.68);
      } else if (cattle.id === "BUF-05") {
        peak = isLatest ? 79100 : Math.floor(52000 + Math.sin(idx * 1.1) * 15000);
        avg = Math.round(peak * 0.64);
      }

      // Keys with hyphen (e.g. peak_COW-01, matching cattle.id)
      pt[`peak_${cattle.id}`] = peak;
      pt[`avg_${cattle.id}`] = avg;

      // Keys with underscore (e.g. peak_COW_01) for backwards compatibility
      const safeId = cattle.id.replace("-", "_");
      pt[`peak_${safeId}`] = peak;
      pt[`avg_${safeId}`] = avg;
    });

    return pt;
  });
}

/**
 * Generate comprehensive tabular records for all cattle mapped from telemetry points
 */
export function generateMultiCattleTableRows(
  telemetryInput?: MultiCattlePoint[]
): MultiCattleTableRow[] {
  const telemetry = telemetryInput || generateMultiCattleTelemetryData();
  const rows: MultiCattleTableRow[] = [];
  let rowNum = 3450;

  telemetry.slice().reverse().forEach((pt) => {
    CATTLE_CATALOG.forEach((cattle) => {
      const motion = pt[`motion_${cattle.id}`] ?? 20000;
      const hr = pt[`hr_${cattle.id}`] ?? 70;
      const temp = pt[`temp_${cattle.id}`] ?? 38.3;
      const spo2 = pt[`spo2_${cattle.id}`] ?? 97;
      const conductivity = pt[`conductivity_${cattle.id}`] ?? cattle.electricalConductivity;
      const countX = pt[`countX_${cattle.id}`] ?? 110;
      const countY = pt[`countY_${cattle.id}`] ?? 90;
      const countZ = pt[`countZ_${cattle.id}`] ?? 130;
      const status = pt[`status_${cattle.id}`] ?? "Normal";
      const verdict = pt[`verdict_${cattle.id}`] ?? "Normal";

      rows.push({
        id: `${cattle.id}-${rowNum}`,
        rowNumber: rowNum--,
        cattleId: cattle.id,
        cattleName: cattle.name,
        species: cattle.species,
        color: cattle.color,
        timestamp: pt.timestamp,
        motion,
        countX,
        countY,
        countZ,
        heartRate: hr,
        spo2,
        temp,
        conductivity,
        status,
        verdict,
      });
    });
  });

  return rows;
}

/**
 * Generate flagged estrus alerts across all monitored cattle from current telemetry points
 */
export function generateMultiCattleVerdictHistory(
  telemetryInput?: MultiCattlePoint[]
): MultiCattleVerdictItem[] {
  if (telemetryInput && telemetryInput.length > 0) {
    const alerts: MultiCattleVerdictItem[] = [];
    let alertId = 1;

    // Scan backwards from most recent
    telemetryInput.slice().reverse().forEach((pt) => {
      CATTLE_CATALOG.forEach((c) => {
        const verdict = pt[`verdict_${c.id}`];
        const status = pt[`status_${c.id}`];
        if (verdict === "In Heat" || verdict === "Possible Heat") {
          alerts.push({
            id: `alert-${alertId++}`,
            cattleId: c.id,
            cattleName: c.name,
            color: c.color,
            verdict: verdict,
            status: status || (verdict === "In Heat" ? "MOUNTING!" : "Restless"),
            heartRate: pt[`hr_${c.id}`] || 85,
            temp: pt[`temp_${c.id}`] || 38.8,
            spo2: pt[`spo2_${c.id}`] || 95,
            motion: pt[`motion_${c.id}`] || 70000,
            conductivity: pt[`conductivity_${c.id}`] || c.electricalConductivity,
            timestamp: pt.timestamp,
          });
        }
      });
    });

    if (alerts.length > 0) {
      return alerts.slice(0, 10);
    }
  }

  // Fallback defaults
  return [
    {
      id: "alert-01",
      cattleId: "COW-01",
      cattleName: "Cow — Ganga",
      color: "#1d70b8",
      verdict: "In Heat",
      status: "MOUNTING!",
      heartRate: 98,
      temp: 39.4,
      spo2: 94,
      motion: 84250,
      conductivity: 7.2,
      timestamp: "Today, 04:30 pm",
    },
    {
      id: "alert-02",
      cattleId: "BUF-05",
      cattleName: "Buffalo — Kaveri",
      color: "#e11d48",
      verdict: "In Heat",
      status: "MOUNTING!",
      heartRate: 94,
      temp: 39.2,
      spo2: 95,
      motion: 79100,
      conductivity: 6.9,
      timestamp: "Today, 03:55 pm",
    },
    {
      id: "alert-03",
      cattleId: "COW-01",
      cattleName: "Cow — Ganga",
      color: "#1d70b8",
      verdict: "In Heat",
      status: "MOUNTING!",
      heartRate: 96,
      temp: 39.3,
      spo2: 94,
      motion: 82400,
      conductivity: 7.0,
      timestamp: "Today, 03:05 pm",
    },
    {
      id: "alert-04",
      cattleId: "BUF-02",
      cattleName: "Buffalo — Kasuri",
      color: "#059669",
      verdict: "Possible Heat",
      status: "Restless",
      heartRate: 84,
      temp: 38.9,
      spo2: 96,
      motion: 63800,
      conductivity: 5.8,
      timestamp: "Today, 02:15 pm",
    },
    {
      id: "alert-05",
      cattleId: "BUF-05",
      cattleName: "Buffalo — Kaveri",
      color: "#e11d48",
      verdict: "Possible Heat",
      status: "Restless",
      heartRate: 88,
      temp: 38.8,
      spo2: 95,
      motion: 66900,
      conductivity: 6.1,
      timestamp: "Today, 01:25 pm",
    },
  ];
}

export interface MotionStatusSplit {
  resting: { count: number; percentage: number };
  grazing: { count: number; percentage: number };
  highMobility: { count: number; percentage: number };
}

export function generateMotionStatusSplit(telemetryInput?: MultiCattlePoint[]): MotionStatusSplit {
  const telemetry = telemetryInput || [];
  let restingCount = 0;
  let grazingCount = 0;
  let highMobilityCount = 0;

  if (telemetry.length === 0) {
    return {
      resting: { count: 82, percentage: 58.6 },
      grazing: { count: 40, percentage: 28.6 },
      highMobility: { count: 18, percentage: 12.8 },
    };
  }

  telemetry.forEach((pt) => {
    CATTLE_CATALOG.forEach((c) => {
      const motion = pt[`motion_${c.id}`] ?? 20000;
      if (motion >= 65000) highMobilityCount++;
      else if (motion >= 24000) grazingCount++;
      else restingCount++;
    });
  });

  const total = Math.max(1, restingCount + grazingCount + highMobilityCount);
  return {
    resting: { count: restingCount, percentage: Number(((restingCount / total) * 100).toFixed(1)) },
    grazing: { count: grazingCount, percentage: Number(((grazingCount / total) * 100).toFixed(1)) },
    highMobility: { count: highMobilityCount, percentage: Number(((highMobilityCount / total) * 100).toFixed(1)) },
  };
}

export interface CattleMotionActivityLog {
  id: string;
  cattleId: string;
  cattleName: string;
  shortName: string;
  color: string;
  motionStatus: "High Mobility" | "Active Grazing" | "Resting / Shed" | "Pasture Grazing";
  motion: number;
  countX: number;
  countY: number;
  countZ: number;
  cadence: string;
  vigorScore: number;
  timestamp: string;
}

export function generateMultiCattleMotionLogs(): CattleMotionActivityLog[] {
  return [
    {
      id: "motion-01",
      cattleId: "COW-01",
      cattleName: "Cow — Ganga",
      shortName: "Ganga",
      color: "#1d70b8",
      motionStatus: "High Mobility",
      motion: 84250,
      countX: 226,
      countY: 189,
      countZ: 252,
      cadence: "124 steps/min",
      vigorScore: 98,
      timestamp: "Today, 04:30 pm",
    },
    {
      id: "motion-02",
      cattleId: "BUF-05",
      cattleName: "Buffalo — Kaveri",
      shortName: "Kaveri",
      color: "#e11d48",
      motionStatus: "High Mobility",
      motion: 79100,
      countX: 224,
      countY: 186,
      countZ: 250,
      cadence: "118 steps/min",
      vigorScore: 95,
      timestamp: "Today, 03:55 pm",
    },
    {
      id: "motion-03",
      cattleId: "BUF-02",
      cattleName: "Buffalo — Kasuri",
      shortName: "Kasuri",
      color: "#059669",
      motionStatus: "Active Grazing",
      motion: 63800,
      countX: 185,
      countY: 155,
      countZ: 210,
      cadence: "88 steps/min",
      vigorScore: 76,
      timestamp: "Today, 02:15 pm",
    },
    {
      id: "motion-04",
      cattleId: "COW-04",
      cattleName: "Cow — Shanti",
      shortName: "Shanti",
      color: "#d97706",
      motionStatus: "Pasture Grazing",
      motion: 24900,
      countX: 142,
      countY: 119,
      countZ: 164,
      cadence: "56 steps/min",
      vigorScore: 48,
      timestamp: "Today, 01:45 pm",
    },
    {
      id: "motion-05",
      cattleId: "COW-03",
      cattleName: "Cow — Nandini",
      shortName: "Nandini",
      color: "#7c3aed",
      motionStatus: "Resting / Shed",
      motion: 21400,
      countX: 121,
      countY: 101,
      countZ: 144,
      cadence: "42 steps/min",
      vigorScore: 32,
      timestamp: "Today, 12:30 pm",
    },
  ];
}
