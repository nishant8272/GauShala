import { pool } from "../config/database";
import { googleSheetsService } from "./google-sheets.service";

export interface TimeframeInfo {
  timeframe: string;
  label: string;
  startDate: string | null;
  endDate: string | null;
  totalInTimeframe: number;
  totalInDatabase: number;
  minAvailableDate: string | null;
  maxAvailableDate: string | null;
}

export interface DashboardFilterOptions {
  group?: string;
  timeframe?: string; // "all" | "24h" | "7d" | "30d" | "90d" | "1y" | "custom"
  startDate?: string;
  endDate?: string;
}

export interface TelemetryPoint {
  id: string;
  timestamp: string;
  cowId: string;
  motion: number;
  countX: number;
  countY: number;
  countZ: number;
  spo2: number | null;
  heartRate: number | null;
  temp: number | null;
  status: string;
  verdict: "Normal" | "Possible Heat" | "In Heat" | "--";
  rowNumber: number;
}

export interface CattleDashboardStats {
  overview: {
    lastUpdated: string;
    selectedGroup: string;
    totalMonitoredCows: number;
    dbConnected: boolean;
    checkpointRow: number;
    totalSyncedRows: number;
    syncStatus: string;
    syncMessage: string;
    spreadsheetId: string;
    sheetName: string;
    sheetUrl: string;
    dateRangeStr: string;
  };
  timeframeInfo?: TimeframeInfo;
  kpis: {
    totalRecords: number;
    avgMotion: number | null;
    alertRows: number;
    peakMotion: number | null;
    peakTimestamp: string | null;
    p95: number | null;
    p99: number | null;
  };
  statusSplit: {
    normal: { count: number; percentage: number };
    restless: { count: number; percentage: number };
    mounting: { count: number; percentage: number };
    unknown: { count: number; percentage: number };
  };
  importantReading: {
    title: string;
    motion: number | null;
    timestamp: string;
    p95: number | null;
    p99: number | null;
    description: string;
  };
  abnormalEvents: Array<{
    id: string;
    rowNumber: number;
    status: string;
    motion: number;
    timestamp: string;
  }>;
  highestMotion: Array<{
    id: string;
    rowNumber: number;
    motion: number;
    status: string;
    timestamp: string;
    countX: number;
    countY: number;
    countZ: number;
  }>;
  dailyView: Array<{
    day: string;
    avgMotion: number;
    peakMotion: number;
  }>;
  recentTelemetry: TelemetryPoint[];
  verdictHistory: Array<{
    id: string;
    rowNumber: number;
    verdict: "Possible Heat" | "In Heat";
    status: string;
    heartRate: number | null;
    temp: number | null;
    spo2: number | null;
    timestamp: string;
    motion: number;
  }>;
  currentReading: {
    timestamp: string;
    status: string;
    verdict: string;
    description: string;
    heartRate: number | null;
    spo2: number | null;
    temp: number | null;
    motion: number | null;
  };
  summary?: any;
  cowsInHeat?: any;
  healthAlerts?: any;
  sensors?: any;
  transitionAlerts?: any;
  groupAlerts?: any;
  fertilityInsights?: any;
}

function formatToIST(dateInput: Date | string | null): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return String(dateInput);
  }
  
  const day = String(d.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, "0");

  return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
}

export function computeRowVitals(r: {
  rowNumber: number;
  motion: number;
  status?: string | null;
  heartRate?: number | null;
  spo2?: number | null;
  temp?: number | null;
}) {
  const isMounting = r.motion >= 80000 || r.status?.toLowerCase() === "mounting!";
  const isRestless = !isMounting && (r.motion >= 60000 || r.status?.toLowerCase() === "restless");

  // STRICT REQUIREMENT: Only show what is actually in the sheet! If missing, return null!
  const heartRate = r.heartRate != null && !isNaN(Number(r.heartRate)) ? Number(r.heartRate) : null;
  const spo2 = r.spo2 != null && !isNaN(Number(r.spo2)) ? Number(r.spo2) : null;
  const temp = r.temp != null && !isNaN(Number(r.temp)) ? Number(r.temp) : null;

  let verdict: "Normal" | "Possible Heat" | "In Heat" = "Normal";
  if (isMounting) {
    verdict = "In Heat";
  } else if (isRestless) {
    verdict = "Possible Heat";
  }

  let finalStatus = r.status && r.status.trim() ? r.status.trim() : "Normal";
  if (isMounting && finalStatus.toLowerCase() !== "mounting!") finalStatus = "MOUNTING!";
  else if (isRestless && finalStatus.toLowerCase() === "normal") finalStatus = "Restless";

  return {
    heartRate,
    spo2,
    temp,
    verdict,
    status: finalStatus,
  };
}

function resolveDateRange(
  timeframe?: string,
  startDate?: string,
  endDate?: string,
  maxDate?: Date | null
): { effectiveStart: Date | null; effectiveEnd: Date | null; label: string } {
  let effectiveStart: Date | null = null;
  let effectiveEnd: Date | null = null;
  let label = "All Time";
  const tf = timeframe || "all";

  if (maxDate) {
    if (tf === "24h") {
      effectiveStart = new Date(maxDate.getTime() - 24 * 60 * 60 * 1000);
      effectiveEnd = maxDate;
      label = "Last 24 Hours";
    } else if (tf === "7d") {
      effectiveStart = new Date(maxDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      effectiveEnd = maxDate;
      label = "Last 7 Days";
    } else if (tf === "30d") {
      effectiveStart = new Date(maxDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      effectiveEnd = maxDate;
      label = "Last 30 Days";
    } else if (tf === "90d") {
      effectiveStart = new Date(maxDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      effectiveEnd = maxDate;
      label = "Last 3 Months";
    } else if (tf === "1y") {
      effectiveStart = new Date(maxDate.getTime() - 365 * 24 * 60 * 60 * 1000);
      effectiveEnd = maxDate;
      label = "Last 1 Year";
    } else if (tf === "custom" && startDate) {
      effectiveStart = new Date(startDate);
      if (endDate) {
        effectiveEnd = new Date(endDate);
        effectiveEnd.setHours(23, 59, 59, 999);
      } else {
        effectiveEnd = maxDate;
      }
      label = `Custom (${startDate} to ${endDate || "Latest"})`;
    }
  }

  return { effectiveStart, effectiveEnd, label };
}

export class CattleDashboardService {
  /**
   * Get all dashboard metrics and telemetry for selected timeframe
   */
  public async getDashboardData(
    filterInput: string | DashboardFilterOptions = "All Cows"
  ): Promise<CattleDashboardStats> {
    const options: DashboardFilterOptions =
      typeof filterInput === "string" ? { group: filterInput } : filterInput;
    const group = options.group || "All Cows";
    const checkpoint = await googleSheetsService.getOrCreateCheckpoint();

    let recentTelemetry: TelemetryPoint[] = [];
    let verdictHistory: Array<{
      id: string;
      rowNumber: number;
      verdict: "Possible Heat" | "In Heat";
      status: string;
      heartRate: number | null;
      temp: number | null;
      spo2: number | null;
      timestamp: string;
      motion: number;
    }> = [];
    let abnormalEvents: Array<{
      id: string;
      rowNumber: number;
      status: string;
      motion: number;
      timestamp: string;
    }> = [];
    let highestMotion: Array<{
      id: string;
      rowNumber: number;
      motion: number;
      status: string;
      timestamp: string;
      countX: number;
      countY: number;
      countZ: number;
    }> = [];
    let dailyView: Array<{ day: string; avgMotion: number; peakMotion: number }> = [];

    let totalRecordsInDb = 0;
    let totalInTimeframe = 0;
    let avgMotion: number | null = null;
    let maxMotion: number | null = null;
    let minMotion: number | null = null;
    let p95: number | null = null;
    let p99: number | null = null;
    let peakTimestamp: string | null = null;

    let normalCount = 0;
    let restlessCount = 0;
    let mountingCount = 0;
    let unknownCount = 0;

    let minDate: Date | null = null;
    let maxDate: Date | null = null;
    let effectiveStart: Date | null = null;
    let effectiveEnd: Date | null = null;
    let timeframeLabel = "All Time";

    if (pool) {
      try {
        const boundsRes = await pool.query(
          "SELECT MIN(recorded_at) as min_d, MAX(recorded_at) as max_d, COUNT(*) as cnt FROM cattle_sensor_records"
        );
        if (boundsRes.rows.length > 0) {
          minDate = boundsRes.rows[0].min_d ? new Date(boundsRes.rows[0].min_d) : null;
          maxDate = boundsRes.rows[0].max_d ? new Date(boundsRes.rows[0].max_d) : null;
          totalRecordsInDb = parseInt(boundsRes.rows[0].cnt || "0", 10);
        }

        // Resolve active timeframe range
        const range = resolveDateRange(options.timeframe, options.startDate, options.endDate, maxDate);
        effectiveStart = range.effectiveStart;
        effectiveEnd = range.effectiveEnd;
        timeframeLabel = range.label;

        // Build dynamic WHERE clause for timeframe
        const whereClauses: string[] = ["1=1"];
        const whereParams: any[] = [];
        let pIdx = 1;

        if (effectiveStart) {
          whereClauses.push(`recorded_at >= $${pIdx}`);
          whereParams.push(effectiveStart);
          pIdx++;
        }
        if (effectiveEnd) {
          whereClauses.push(`recorded_at <= $${pIdx}`);
          whereParams.push(effectiveEnd);
          pIdx++;
        }

        const whereSql = whereClauses.join(" AND ");

        // Total rows in timeframe
        const countRes = await pool.query(
          `SELECT COUNT(*) as total FROM cattle_sensor_records WHERE ${whereSql}`,
          whereParams
        );
        totalInTimeframe = parseInt(countRes.rows[0].total, 10);

        // ONLY compute stats if records exist! NO MOCK/SEED FALLBACKS!
        if (totalInTimeframe > 0) {
          // Percentiles (p95, p99)
          const pctlRes = await pool.query(
            `SELECT 
               PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY motion) as p95, 
               PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY motion) as p99 
             FROM cattle_sensor_records WHERE ${whereSql}`,
            whereParams
          );
          if (pctlRes.rows[0]?.p95 != null) {
            p95 = Math.round(Number(pctlRes.rows[0].p95));
          }
          if (pctlRes.rows[0]?.p99 != null) {
            p99 = Math.round(Number(pctlRes.rows[0].p99));
          }

          // Motion metrics (avg, max, min)
          const aggRes = await pool.query(
            `SELECT 
               AVG(motion) as avg_motion, 
               MAX(motion) as max_motion, 
               MIN(motion) as min_motion
             FROM cattle_sensor_records WHERE ${whereSql}`,
            whereParams
          );
          if (aggRes.rows.length > 0) {
            const r = aggRes.rows[0];
            avgMotion = r.avg_motion != null ? Math.round(Number(r.avg_motion)) : null;
            maxMotion = r.max_motion != null ? Number(r.max_motion) : null;
            minMotion = r.min_motion != null ? Number(r.min_motion) : null;
          }

          // Peak reading details
          const peakRes = await pool.query(
            `SELECT raw_timestamp, recorded_at, motion, status FROM cattle_sensor_records WHERE ${whereSql} ORDER BY motion DESC LIMIT 1`,
            whereParams
          );
          if (peakRes.rows.length > 0) {
            peakTimestamp = formatToIST(peakRes.rows[0].recorded_at || peakRes.rows[0].raw_timestamp);
          }

          // Status counts and split
          const statusRes = await pool.query(
            `SELECT 
               status, 
               motion,
               COUNT(*) as count 
             FROM cattle_sensor_records 
             WHERE ${whereSql} 
             GROUP BY status, motion`,
            whereParams
          );
          for (const row of statusRes.rows) {
            const m = Number(row.motion || 0);
            const st = (row.status || "").toLowerCase();
            const cnt = parseInt(row.count, 10);
            if (m >= 80000 || st === "mounting!") {
              mountingCount += cnt;
            } else if (m >= 60000 || st === "restless") {
              restlessCount += cnt;
            } else if (st === "normal" || st === "") {
              normalCount += cnt;
            } else {
              unknownCount += cnt;
            }
          }

          // Daily View (Avg and Peak motion by day)
          const dailyRes = await pool.query(
            `SELECT 
               TO_CHAR(recorded_at, 'YYYY-MM-DD') as day,
               ROUND(AVG(motion)) as avg_motion,
               MAX(motion) as max_motion
             FROM cattle_sensor_records 
             WHERE ${whereSql} 
             GROUP BY TO_CHAR(recorded_at, 'YYYY-MM-DD')
             ORDER BY day ASC 
             LIMIT 40`,
            whereParams
          );
          dailyView = dailyRes.rows.map((r: any) => ({
            day: r.day,
            avgMotion: Number(r.avg_motion || 0),
            peakMotion: Number(r.max_motion || 0),
          }));

          // Highest Motion readings (Top 10)
          const highestRes = await pool.query(
            `SELECT id, row_number, raw_timestamp, recorded_at, motion, count_x, count_y, count_z, status 
             FROM cattle_sensor_records 
             WHERE ${whereSql} 
             ORDER BY motion DESC 
             LIMIT 10`,
            whereParams
          );
          highestMotion = highestRes.rows.map((r: any) => {
            const m = Number(r.motion);
            let st = r.status || "Normal";
            if (m >= 80000) st = "MOUNTING!";
            else if (m >= 60000 && st === "Normal") st = "Restless";
            return {
              id: r.id,
              rowNumber: Number(r.row_number),
              motion: m,
              status: st,
              timestamp: formatToIST(r.recorded_at || r.raw_timestamp),
              countX: Number(r.count_x),
              countY: Number(r.count_y),
              countZ: Number(r.count_z),
            };
          });

          // Abnormal Events (Restless, MOUNTING!, or motion >= 60000)
          const abnormalRes = await pool.query(
            `SELECT id, row_number, raw_timestamp, recorded_at, motion, status 
             FROM cattle_sensor_records 
             WHERE (${whereSql}) AND (LOWER(status) != 'normal' OR motion >= 60000)
             ORDER BY row_number DESC 
             LIMIT 20`,
            whereParams
          );
          abnormalEvents = abnormalRes.rows.map((r: any) => {
            const m = Number(r.motion);
            let st = r.status || "Restless";
            if (m >= 80000) st = "MOUNTING!";
            return {
              id: r.id,
              rowNumber: Number(r.row_number),
              status: st,
              motion: m,
              timestamp: formatToIST(r.recorded_at || r.raw_timestamp),
            };
          });

          // Telemetry chart points (latest 180 chronologically for smooth charts)
          const teleRes = await pool.query(
            `SELECT id, raw_timestamp, recorded_at, cow_id, motion, count_x, count_y, count_z, spo2, heart_rate, status, row_number 
             FROM cattle_sensor_records 
             WHERE ${whereSql}
             ORDER BY row_number DESC 
             LIMIT 180`,
            whereParams
          );

          recentTelemetry = teleRes.rows.reverse().map((r: any) => {
            const rowNum = Number(r.row_number);
            const m = Number(r.motion);
            const vitals = computeRowVitals({
              rowNumber: rowNum,
              motion: m,
              status: r.status,
              heartRate: r.heart_rate != null ? Number(r.heart_rate) : null,
              spo2: r.spo2 != null ? Number(r.spo2) : null,
            });

            return {
              id: r.id,
              timestamp: formatToIST(r.recorded_at || r.raw_timestamp),
              cowId: r.cow_id,
              motion: m,
              countX: Number(r.count_x),
              countY: Number(r.count_y),
              countZ: Number(r.count_z),
              spo2: vitals.spo2,
              heartRate: vitals.heartRate,
              temp: vitals.temp,
              status: vitals.status,
              verdict: vitals.verdict,
              rowNumber: rowNum,
            };
          });

          // Verdict History: Query all flagged rows in timeframe
          const verdictRes = await pool.query(
            `SELECT id, row_number, raw_timestamp, recorded_at, motion, count_x, count_y, count_z, spo2, heart_rate, status 
             FROM cattle_sensor_records 
             WHERE (${whereSql}) AND (LOWER(status) != 'normal' OR motion >= 60000)
             ORDER BY row_number DESC 
             LIMIT 30`,
            whereParams
          );

          verdictHistory = verdictRes.rows.map((r: any) => {
            const rowNum = Number(r.row_number);
            const m = Number(r.motion);
            const vitals = computeRowVitals({
              rowNumber: rowNum,
              motion: m,
              status: r.status,
              heartRate: r.heart_rate != null ? Number(r.heart_rate) : null,
              spo2: r.spo2 != null ? Number(r.spo2) : null,
            });

            return {
              id: r.id,
              rowNumber: rowNum,
              verdict: vitals.verdict as "Possible Heat" | "In Heat",
              status: vitals.status,
              heartRate: vitals.heartRate,
              temp: vitals.temp,
              spo2: vitals.spo2,
              timestamp: formatToIST(r.recorded_at || r.raw_timestamp),
              motion: m,
            };
          });
        }
      } catch (err) {
        console.error("Error fetching cattle dashboard data:", err);
      }
    }

    // EMPTY DATABASE / TIMEFRAME: Return clean empty state with "--" (NO SEED DATA)
    if (totalRecordsInDb === 0 || totalInTimeframe === 0) {
      return {
        overview: {
          lastUpdated: checkpoint.lastSyncedTimestamp || "--",
          selectedGroup: group,
          totalMonitoredCows: 0,
          dbConnected: !!pool,
          checkpointRow: checkpoint.lastSyncedRow || 0,
          totalSyncedRows: totalRecordsInDb,
          syncStatus: checkpoint.lastSyncStatus || "idle",
          syncMessage: checkpoint.lastSyncMessage || "No data in database",
          spreadsheetId: checkpoint.spreadsheetId,
          sheetName: checkpoint.sheetName,
          sheetUrl: `https://docs.google.com/spreadsheets/d/${checkpoint.spreadsheetId}/edit`,
          dateRangeStr: "--",
        },
        timeframeInfo: {
          timeframe: options.timeframe || "all",
          label: timeframeLabel,
          startDate: null,
          endDate: null,
          totalInTimeframe: 0,
          totalInDatabase: totalRecordsInDb,
          minAvailableDate: null,
          maxAvailableDate: null,
        },
        kpis: {
          totalRecords: 0,
          avgMotion: null,
          alertRows: 0,
          peakMotion: null,
          peakTimestamp: "--",
          p95: null,
          p99: null,
        },
        statusSplit: {
          normal: { count: 0, percentage: 0 },
          restless: { count: 0, percentage: 0 },
          mounting: { count: 0, percentage: 0 },
          unknown: { count: 0, percentage: 0 },
        },
        importantReading: {
          title: "--",
          motion: null,
          timestamp: "--",
          p95: null,
          p99: null,
          description: "No records found in database. Click 'Sync Sheet' to import online data.",
        },
        abnormalEvents: [],
        highestMotion: [],
        dailyView: [],
        recentTelemetry: [],
        verdictHistory: [],
        currentReading: {
          timestamp: "--",
          status: "--",
          verdict: "--",
          description: "No sensor readings available.",
          heartRate: null,
          spo2: null,
          temp: null,
          motion: null,
        },
        summary: {
          totalRecords: 0,
          currentStatus: "--",
          statusCounts: { normal: 0, restless: 0 },
          latestReading: null,
          motionMetrics: { latest: 0, avg: 0, max: 0, min: 0 },
          xyzMetrics: { countX: 0, countY: 0, countZ: 0 },
          vitals: { spo2: null, heartRate: null, temp: null },
        },
      };
    }

    // Compute status percentages from REAL records
    const denom = totalInTimeframe > 0 ? totalInTimeframe : 1;
    const statusSplit = {
      normal: {
        count: normalCount,
        percentage: Number(((normalCount / denom) * 100).toFixed(2)),
      },
      restless: {
        count: restlessCount,
        percentage: Number(((restlessCount / denom) * 100).toFixed(2)),
      },
      mounting: {
        count: mountingCount,
        percentage: Number(((mountingCount / denom) * 100).toFixed(2)),
      },
      unknown: {
        count: unknownCount,
        percentage: Number(((unknownCount / denom) * 100).toFixed(2)),
      },
    };

    const latest = recentTelemetry[recentTelemetry.length - 1] || null;
    const lastTs = latest?.timestamp || checkpoint.lastSyncedTimestamp || "--";

    // Format range string
    const startStr = effectiveStart ? formatToIST(effectiveStart) : minDate ? formatToIST(minDate) : "--";
    const endStr = effectiveEnd ? formatToIST(effectiveEnd) : maxDate ? formatToIST(maxDate) : "--";
    const dateRangeStr = startStr !== "--" && endStr !== "--" ? `${startStr} TO ${endStr}` : "--";

    const currentReading = {
      timestamp: latest?.timestamp || "--",
      status: latest?.status || "--",
      verdict: latest?.verdict ? (latest.verdict.toUpperCase() as any) : "--",
      description: latest?.verdict === "In Heat"
        ? "Alert: Critical estrus indicators detected! Immediate insemination recommended."
        : latest?.verdict === "Possible Heat"
        ? "Warning: Elevated motor activity surge. Monitor closely."
        : "All readings within normal resting ranges.",
      heartRate: latest?.heartRate ?? null,
      spo2: latest?.spo2 ?? null,
      temp: latest?.temp ?? null,
      motion: latest?.motion ?? null,
    };

    const importantReading = {
      title: maxMotion != null ? `PEAK MOTION at ${maxMotion.toLocaleString()}` : "--",
      motion: maxMotion,
      timestamp: peakTimestamp || "--",
      p95,
      p99,
      description: maxMotion != null && peakTimestamp
        ? `Peak motion happened at ${peakTimestamp}. The 95th percentile is ${p95?.toLocaleString() ?? "--"} and the 99th percentile is ${p99?.toLocaleString() ?? "--"}.`
        : "No records found.",
    };

    const timeframeInfo: TimeframeInfo = {
      timeframe: options.timeframe || "all",
      label: timeframeLabel,
      startDate: effectiveStart ? effectiveStart.toISOString() : null,
      endDate: effectiveEnd ? effectiveEnd.toISOString() : null,
      totalInTimeframe,
      totalInDatabase: totalRecordsInDb,
      minAvailableDate: minDate ? minDate.toISOString() : null,
      maxAvailableDate: maxDate ? maxDate.toISOString() : null,
    };

    const alertRows = restlessCount + mountingCount + unknownCount;

    return {
      overview: {
        lastUpdated: lastTs,
        selectedGroup: group,
        totalMonitoredCows: 166,
        dbConnected: !!pool,
        checkpointRow: checkpoint.lastSyncedRow,
        totalSyncedRows: totalRecordsInDb,
        syncStatus: checkpoint.lastSyncStatus,
        syncMessage: checkpoint.lastSyncMessage || "Checkpoint verified",
        spreadsheetId: checkpoint.spreadsheetId,
        sheetName: checkpoint.sheetName,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${checkpoint.spreadsheetId}/edit`,
        dateRangeStr,
      },
      timeframeInfo,
      kpis: {
        totalRecords: totalInTimeframe,
        avgMotion,
        alertRows,
        peakMotion: maxMotion,
        peakTimestamp,
        p95,
        p99,
      },
      statusSplit,
      importantReading,
      abnormalEvents,
      highestMotion,
      dailyView,
      recentTelemetry,
      verdictHistory,
      currentReading,
      summary: {
        totalRecords: totalInTimeframe,
        currentStatus: latest?.status || "--",
        statusCounts: {
          normal: normalCount,
          restless: alertRows,
        },
        latestReading: latest,
        motionMetrics: {
          latest: latest?.motion || 0,
          avg: avgMotion || 0,
          max: maxMotion || 0,
          min: minMotion || 0,
        },
        xyzMetrics: {
          countX: latest?.countX || 0,
          countY: latest?.countY || 0,
          countZ: latest?.countZ || 0,
        },
        vitals: {
          spo2: latest?.spo2 || null,
          heartRate: latest?.heartRate || null,
          temp: latest?.temp || null,
        },
      },
    };
  }

  /**
   * Get paginated records list with search, filter, and optional timeframe
   */
  public async getRecords(options: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    timeframe?: string;
    startDate?: string;
    endDate?: string;
  }) {
    if (!pool) return { records: [], total: 0, page: 1, totalPages: 1 };

    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 25));
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM cattle_sensor_records WHERE 1=1";
    let countQuery = "SELECT COUNT(*) as total FROM cattle_sensor_records WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    // Timeframe filtering for table
    if (options.timeframe && options.timeframe !== "all") {
      const boundsRes = await pool.query("SELECT MAX(recorded_at) as max_d FROM cattle_sensor_records");
      const maxDate = boundsRes.rows[0]?.max_d ? new Date(boundsRes.rows[0].max_d) : null;
      const range = resolveDateRange(options.timeframe, options.startDate, options.endDate, maxDate);

      if (range.effectiveStart) {
        query += ` AND recorded_at >= $${paramIndex}`;
        countQuery += ` AND recorded_at >= $${paramIndex}`;
        params.push(range.effectiveStart);
        paramIndex++;
      }
      if (range.effectiveEnd) {
        query += ` AND recorded_at <= $${paramIndex}`;
        countQuery += ` AND recorded_at <= $${paramIndex}`;
        params.push(range.effectiveEnd);
        paramIndex++;
      }
    }

    if (options.status && options.status !== "all") {
      if (options.status.toLowerCase() === "mounting!") {
        query += ` AND (LOWER(status) = 'mounting!' OR motion >= 80000)`;
        countQuery += ` AND (LOWER(status) = 'mounting!' OR motion >= 80000)`;
      } else if (options.status.toLowerCase() === "restless") {
        query += ` AND ((LOWER(status) = 'restless' OR motion >= 60000) AND motion < 80000)`;
        countQuery += ` AND ((LOWER(status) = 'restless' OR motion >= 60000) AND motion < 80000)`;
      } else {
        query += ` AND LOWER(status) = LOWER($${paramIndex})`;
        countQuery += ` AND LOWER(status) = LOWER($${paramIndex})`;
        params.push(options.status);
        paramIndex++;
      }
    }

    if (options.search) {
      query += ` AND (cow_id ILIKE $${paramIndex} OR raw_timestamp ILIKE $${paramIndex} OR status ILIKE $${paramIndex} OR CAST(motion AS TEXT) ILIKE $${paramIndex} OR CAST(row_number AS TEXT) ILIKE $${paramIndex})`;
      countQuery += ` AND (cow_id ILIKE $${paramIndex} OR raw_timestamp ILIKE $${paramIndex} OR status ILIKE $${paramIndex} OR CAST(motion AS TEXT) ILIKE $${paramIndex} OR CAST(row_number AS TEXT) ILIKE $${paramIndex})`;
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].total, 10);

    query += ` ORDER BY row_number DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const recordsRes = await pool.query(query, [...params, limit, offset]);

    return {
      records: recordsRes.rows.map((r: any) => {
        const vitals = computeRowVitals({
          rowNumber: Number(r.row_number),
          motion: Number(r.motion),
          status: r.status,
          heartRate: r.heart_rate != null ? Number(r.heart_rate) : null,
          spo2: r.spo2 != null ? Number(r.spo2) : null,
        });

        return {
          id: r.id,
          spreadsheetId: r.spreadsheet_id,
          sheetName: r.sheet_name,
          rowNumber: Number(r.row_number),
          cowId: r.cow_id,
          timestamp: formatToIST(r.recorded_at || r.raw_timestamp),
          motion: Number(r.motion),
          countX: Number(r.count_x),
          countY: Number(r.count_y),
          countZ: Number(r.count_z),
          spo2: vitals.spo2,
          heartRate: vitals.heartRate,
          temp: vitals.temp,
          status: vitals.status,
          verdict: vitals.verdict,
        };
      }),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const cattleDashboardService = new CattleDashboardService();
