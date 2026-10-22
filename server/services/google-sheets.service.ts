import { google } from "googleapis";
import { pool } from "../config/database";
import type { CattleSensorRecord, SyncCheckpoint } from "@prisma/client";
import fs from "fs";
import { randomUUID } from "crypto";

export const DEFAULT_SPREADSHEET_ID = "1f1PUwft6W6PWx1z19JLwzKjwdKdGkf04bmPINPAGAaw";
export const DEFAULT_SHEET_NAME = "Sheet1";

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  clientEmail?: string;
  privateKey?: string;
  credentialsPath?: string;
}

/**
 * Robust CSV Line parser handling quoted strings and commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map((col) => col.replace(/^"(.*)"$/, "$1").trim());
}

export class GoogleSheetsService {
  private static SOURCE_KEY = "cattle_tracker_main";

  public extractSpreadsheetId(input: string): string {
    if (!input) return DEFAULT_SPREADSHEET_ID;
    const trimmed = input.trim();
    const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    return trimmed;
  }

  public async getConfig(): Promise<GoogleSheetsConfig> {
    let config: GoogleSheetsConfig = {
      spreadsheetId: DEFAULT_SPREADSHEET_ID,
      sheetName: DEFAULT_SHEET_NAME,
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    };

    if (pool) {
      try {
        const res = await pool.query(
          "SELECT spreadsheet_id, sheet_name, config_json FROM sync_checkpoints WHERE source_key = $1",
          [GoogleSheetsService.SOURCE_KEY]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          // Always pin to user's specified sheet
          config.spreadsheetId = DEFAULT_SPREADSHEET_ID;
          if (row.sheet_name) config.sheetName = row.sheet_name;
          if (row.config_json) {
            try {
              const parsed = JSON.parse(row.config_json);
              config = { ...config, ...parsed, spreadsheetId: DEFAULT_SPREADSHEET_ID };
            } catch (e) {
              // ignore parse error
            }
          }
        }
      } catch (err) {
        console.error("Error reading config from DB:", err);
      }
    }

    return config;
  }

  public async getCheckpoint(): Promise<SyncCheckpoint | null> {
    if (!pool) return null;
    const res = await pool.query(
      "SELECT * FROM sync_checkpoints WHERE source_key = $1",
      [GoogleSheetsService.SOURCE_KEY]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      sourceKey: r.source_key,
      spreadsheetId: r.spreadsheet_id,
      sheetName: r.sheet_name,
      lastSyncedRow: r.last_synced_row,
      lastSyncedTimestamp: r.last_synced_timestamp,
      totalRowsSynced: r.total_rows_synced,
      lastSyncStatus: r.last_sync_status,
      lastSyncMessage: r.last_sync_message,
      lastSyncedAt: r.last_synced_at,
      configJson: r.config_json,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  public async getOrCreateCheckpoint(): Promise<SyncCheckpoint> {
    const existing = await this.getCheckpoint();
    if (existing) {
      // Ensure the spreadsheet ID matches user's specified sheet
      if (existing.spreadsheetId !== DEFAULT_SPREADSHEET_ID && pool) {
        await pool.query(
          "UPDATE sync_checkpoints SET spreadsheet_id = $1 WHERE source_key = $2",
          [DEFAULT_SPREADSHEET_ID, GoogleSheetsService.SOURCE_KEY]
        );
        existing.spreadsheetId = DEFAULT_SPREADSHEET_ID;
      }

      // If database has been cleared, automatically reset checkpoint to 0 / row 1
      if (pool) {
        try {
          const countRes = await pool.query("SELECT COUNT(*) as cnt FROM cattle_sensor_records");
          const actualCount = parseInt(countRes.rows[0]?.cnt || "0", 10);
          if (actualCount === 0 && (existing.totalRowsSynced > 0 || existing.lastSyncedRow > 1)) {
            await pool.query(
              "UPDATE sync_checkpoints SET last_synced_row = 1, total_rows_synced = 0, last_synced_timestamp = NULL, last_sync_message = 'Database is empty' WHERE source_key = $1",
              [GoogleSheetsService.SOURCE_KEY]
            );
            existing.lastSyncedRow = 1;
            existing.totalRowsSynced = 0;
            existing.lastSyncedTimestamp = null;
            existing.lastSyncMessage = "Database is empty";
          }
        } catch {
          // ignore
        }
      }

      return existing;
    }

    if (pool) {
      const res = await pool.query(
        `INSERT INTO sync_checkpoints (id, source_key, spreadsheet_id, sheet_name, last_synced_row, total_rows_synced, last_sync_status, last_sync_message)
         VALUES ($1, $2, $3, $4, 1, 0, 'idle', 'Initialized checkpoint (row 1 is header)')
         ON CONFLICT (source_key) DO UPDATE SET spreadsheet_id = $3, updated_at = NOW()
         RETURNING *`,
        [randomUUID(), GoogleSheetsService.SOURCE_KEY, DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_NAME]
      );
      const r = res.rows[0];
      return {
        id: r.id,
        sourceKey: r.source_key,
        spreadsheetId: r.spreadsheet_id,
        sheetName: r.sheet_name,
        lastSyncedRow: r.last_synced_row,
        lastSyncedTimestamp: r.last_synced_timestamp,
        totalRowsSynced: r.total_rows_synced,
        lastSyncStatus: r.last_sync_status,
        lastSyncMessage: r.last_sync_message,
        lastSyncedAt: r.last_synced_at,
        configJson: r.config_json,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    }

    throw new Error("Database not connected");
  }

  private async getGoogleSheetsClient(config: GoogleSheetsConfig) {
    let auth;
    if (config.credentialsPath && fs.existsSync(config.credentialsPath)) {
      auth = new google.auth.GoogleAuth({
        keyFile: config.credentialsPath,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
    } else if (config.clientEmail && config.privateKey) {
      auth = new google.auth.JWT({
        email: config.clientEmail,
        key: config.privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      auth = new google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
    }

    if (!auth) return null;
    return google.sheets({ version: "v4", auth });
  }

  /**
   * Incremental Sync Engine
   * Strictly reads rows beyond checkpoint `lastSyncedRow`
   */
  public async syncWithCheckpoint(): Promise<{
    success: boolean;
    syncedRows: number;
    newLastRow: number;
    message: string;
  }> {
    const config = await this.getConfig();
    const checkpoint = await this.getOrCreateCheckpoint();
    const startRow = checkpoint.lastSyncedRow + 1;

    if (pool) {
      await pool.query(
        "UPDATE sync_checkpoints SET last_sync_status = 'syncing', updated_at = NOW() WHERE source_key = $1",
        [GoogleSheetsService.SOURCE_KEY]
      );
    }

    try {
      // 1. Try Google Sheets API v4 with Service Account if configured
      const sheets = await this.getGoogleSheetsClient(config);
      if (sheets && config.clientEmail) {
        const range = `${config.sheetName}!A${startRow}:I`;
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: config.spreadsheetId,
          range,
        });

        const values = res.data.values || [];
        if (values.length === 0) {
          const msg = `Sheet is up-to-date at Row #${checkpoint.lastSyncedRow}. 0 new rows found.`;
          await this.updateCheckpointSuccess(checkpoint.lastSyncedRow, checkpoint.totalRowsSynced, checkpoint.lastSyncedTimestamp || "", msg);
          return { success: true, syncedRows: 0, newLastRow: checkpoint.lastSyncedRow, message: msg };
        }

        return await this.processAndInsertRows(values, startRow, config.spreadsheetId, config.sheetName, checkpoint.totalRowsSynced);
      }

      // 2. Direct Google Sheet data feed (works out-of-the-box for this sheet!)
      const feedUrl = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${DEFAULT_SHEET_NAME}`;
      const response = await fetch(feedUrl);
      if (!response.ok) {
        throw new Error(`Failed to read sheet stream: HTTP ${response.status}`);
      }

      const text = await response.text();
      const allLines = text.trim().split("\n");

      // Header is line 0 (Row 1). Data rows start at index 1 (Row 2).
      // Checkpoint lastSyncedRow starts at 1, so startRow index in allLines is:
      // index = startRow - 1. (e.g. if lastSyncedRow is 1, startRow is 2, index is 1).
      const startIndex = startRow - 1;

      if (startIndex >= allLines.length) {
        const msg = `Sheet is up-to-date at Row #${checkpoint.lastSyncedRow}. 0 new rows found.`;
        await this.updateCheckpointSuccess(checkpoint.lastSyncedRow, checkpoint.totalRowsSynced, checkpoint.lastSyncedTimestamp || "", msg);
        return { success: true, syncedRows: 0, newLastRow: checkpoint.lastSyncedRow, message: msg };
      }

      const newLines = allLines.slice(startIndex);
      const parsedRows: string[][] = [];

      for (const line of newLines) {
        if (!line.trim()) continue;
        parsedRows.push(parseCSVLine(line));
      }

      return await this.processAndInsertRows(parsedRows, startRow, DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_NAME, checkpoint.totalRowsSynced);
    } catch (err: any) {
      console.error("[GoogleSheetsSync] Sync error:", err);
      const errMsg = `Sync error: ${err?.message || "Failed to fetch from sheet"}`;
      if (pool) {
        await pool.query(
          "UPDATE sync_checkpoints SET last_sync_status = 'error', last_sync_message = $1, updated_at = NOW() WHERE source_key = $2",
          [errMsg, GoogleSheetsService.SOURCE_KEY]
        );
      }
      return {
        success: false,
        syncedRows: 0,
        newLastRow: checkpoint.lastSyncedRow,
        message: errMsg,
      };
    }
  }

  private async processAndInsertRows(
    rows: string[][],
    startRowNumber: number,
    spreadsheetId: string,
    sheetName: string,
    prevTotalSynced: number
  ) {
    if (!pool || rows.length === 0) {
      return { success: true, syncedRows: 0, newLastRow: startRowNumber - 1, message: "No rows to process" };
    }

    const recordsToInsert = [];
    let currentRowNum = startRowNumber;

    for (const row of rows) {
      const rawTimestamp = (row[0] || "").trim();
      const motion = parseInt((row[1] || "0").replace(/,/g, ""), 10) || 0;
      const countX = parseInt((row[2] || "0").replace(/,/g, ""), 10) || 0;
      const countY = parseInt((row[3] || "0").replace(/,/g, ""), 10) || 0;
      const countZ = parseInt((row[4] || "0").replace(/,/g, ""), 10) || 0;
      const spo2 = row[5] && !isNaN(parseFloat(row[5])) ? parseFloat(row[5]) : null;
      const heartRate = row[6] && !isNaN(parseFloat(row[6])) ? parseFloat(row[6]) : null;

      // Detect status (often in Col 8 or Col 5 if empty)
      let status = "Normal";
      if (row[8] && (row[8].toLowerCase() === "normal" || row[8].toLowerCase() === "restless")) {
        status = row[8].trim();
      } else if (row[5] && (row[5].toLowerCase() === "normal" || row[5].toLowerCase() === "restless")) {
        status = row[5].trim();
      } else if (row[7] && (row[7].toLowerCase() === "normal" || row[7].toLowerCase() === "restless")) {
        status = row[7].trim();
      }

      let recordedAt: Date | null = null;
      try {
        recordedAt = new Date(rawTimestamp);
        if (isNaN(recordedAt.getTime())) recordedAt = new Date();
      } catch {
        recordedAt = new Date();
      }

      const cowIndex = (currentRowNum % 25) + 1;
      const cowId = `COW-${String(cowIndex).padStart(2, "0")}`;

      recordsToInsert.push({
        spreadsheetId,
        sheetName,
        rowNumber: currentRowNum,
        cowId,
        recordedAt,
        rawTimestamp,
        motion,
        countX,
        countY,
        countZ,
        spo2,
        heartRate,
        status,
      });

      currentRowNum++;
    }

    // Insert in batches of 100 for maximum performance
    const batchSize = 100;
    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);
      const valuesSql: string[] = [];
      const params: any[] = [];
      let pIdx = 1;

      for (const rec of batch) {
        valuesSql.push(
          `($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5}, $${pIdx + 6}, $${pIdx + 7}, $${pIdx + 8}, $${pIdx + 9}, $${pIdx + 10}, $${pIdx + 11}, $${pIdx + 12}, $${pIdx + 13})`
        );
        params.push(
          randomUUID(),
          rec.spreadsheetId,
          rec.sheetName,
          rec.rowNumber,
          rec.cowId,
          rec.recordedAt,
          rec.rawTimestamp,
          rec.motion,
          rec.countX,
          rec.countY,
          rec.countZ,
          rec.spo2,
          rec.heartRate,
          rec.status
        );
        pIdx += 14;
      }

      await pool.query(
        `INSERT INTO cattle_sensor_records 
         (id, spreadsheet_id, sheet_name, row_number, cow_id, recorded_at, raw_timestamp, motion, count_x, count_y, count_z, spo2, heart_rate, status)
         VALUES ${valuesSql.join(", ")}`,
        params
      );
    }

    const newLastRow = currentRowNum - 1;
    const totalSynced = prevTotalSynced + recordsToInsert.length;
    const lastTs = recordsToInsert[recordsToInsert.length - 1]?.rawTimestamp || "";
    const successMsg = `Successfully synced ${recordsToInsert.length} records from Google Sheet! Checkpoint: Row #${newLastRow}.`;

    await this.updateCheckpointSuccess(newLastRow, totalSynced, lastTs, successMsg);

    return {
      success: true,
      syncedRows: recordsToInsert.length,
      newLastRow,
      message: successMsg,
    };
  }

  private async updateCheckpointSuccess(lastRow: number, total: number, lastTs: string, msg: string) {
    if (!pool) return;
    await pool.query(
      `UPDATE sync_checkpoints 
       SET last_synced_row = $1, total_rows_synced = $2, last_synced_timestamp = $3, 
           last_sync_status = 'success', last_sync_message = $4, last_synced_at = NOW(), updated_at = NOW() 
       WHERE source_key = $5`,
      [lastRow, total, lastTs, msg, GoogleSheetsService.SOURCE_KEY]
    );
  }

  public async resetAndReseed(): Promise<void> {
    if (!pool) return;
    await pool.query("DELETE FROM cattle_sensor_records");
    await pool.query(
      `UPDATE sync_checkpoints 
       SET last_synced_row = 1, total_rows_synced = 0, last_synced_timestamp = NULL, 
           last_sync_status = 'idle', last_sync_message = 'Reset complete - database cleared', last_synced_at = NOW(), updated_at = NOW() 
       WHERE source_key = $1`,
      [GoogleSheetsService.SOURCE_KEY]
    );
  }

  public async saveConfig(newConfig: Partial<GoogleSheetsConfig>): Promise<SyncCheckpoint> {
    const checkpoint = await this.getOrCreateCheckpoint();
    const configToStore = {
      clientEmail: newConfig.clientEmail,
      privateKey: newConfig.privateKey,
    };

    if (pool) {
      await pool.query(
        `UPDATE sync_checkpoints 
         SET spreadsheet_id = $1, sheet_name = $2, config_json = $3, updated_at = NOW() 
         WHERE source_key = $4`,
        [DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_NAME, JSON.stringify(configToStore), GoogleSheetsService.SOURCE_KEY]
      );
    }
    return (await this.getCheckpoint())!;
  }

  public async simulateNewRecord(): Promise<any> {
    const checkpoint = await this.getOrCreateCheckpoint();
    const nextRow = checkpoint.lastSyncedRow + 1;
    const now = new Date();
    const formattedDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.toLocaleTimeString()}`;

    const motionBase = Math.floor(21000 + Math.random() * 6000);
    const isRestless = Math.random() > 0.85;
    const motion = isRestless ? Math.floor(65000 + Math.random() * 15000) : motionBase;
    const spo2 = isRestless ? Math.floor(91 + Math.random() * 4) : Math.floor(96 + Math.random() * 3);
    const heartRate = isRestless ? Math.floor(88 + Math.random() * 18) : Math.floor(68 + Math.random() * 8);
    const status = isRestless ? "Restless" : "Normal";
    const cowId = `COW-${String((nextRow % 25) + 1).padStart(2, "0")}`;

    if (pool) {
      const res = await pool.query(
        `INSERT INTO cattle_sensor_records 
         (spreadsheet_id, sheet_name, row_number, cow_id, recorded_at, raw_timestamp, motion, count_x, count_y, count_z, spo2, heart_rate, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          DEFAULT_SPREADSHEET_ID,
          DEFAULT_SHEET_NAME,
          nextRow,
          cowId,
          now,
          formattedDate,
          motion,
          nextRow,
          nextRow,
          nextRow,
          spo2,
          heartRate,
          status,
        ]
      );

      const msg = `Simulated 1 new reading. Checkpoint advanced to row ${nextRow}.`;
      await pool.query(
        `UPDATE sync_checkpoints 
         SET last_synced_row = $1, total_rows_synced = total_rows_synced + 1, last_synced_timestamp = $2, 
             last_sync_status = 'success', last_sync_message = $3, last_synced_at = NOW(), updated_at = NOW() 
         WHERE source_key = $4`,
        [nextRow, formattedDate, msg, GoogleSheetsService.SOURCE_KEY]
      );

      return res.rows[0];
    }
    throw new Error("Database not connected");
  }
}

export const googleSheetsService = new GoogleSheetsService();
