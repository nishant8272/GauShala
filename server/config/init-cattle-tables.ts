import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export async function initCattleTables() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL configured, skipping table creation.");
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cattle_sensor_records (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        spreadsheet_id TEXT NOT NULL,
        sheet_name TEXT NOT NULL DEFAULT 'Sheet1',
        row_number INTEGER NOT NULL,
        cow_id TEXT NOT NULL DEFAULT 'COW-01',
        recorded_at TIMESTAMP WITH TIME ZONE,
        raw_timestamp TEXT NOT NULL,
        motion INTEGER NOT NULL DEFAULT 0,
        count_x INTEGER NOT NULL DEFAULT 0,
        count_y INTEGER NOT NULL DEFAULT 0,
        count_z INTEGER NOT NULL DEFAULT 0,
        spo2 NUMERIC(5, 2),
        heart_rate NUMERIC(5, 2),
        status TEXT NOT NULL DEFAULT 'Normal',
        aux_data TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sync_checkpoints (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        source_key TEXT NOT NULL UNIQUE,
        spreadsheet_id TEXT NOT NULL,
        sheet_name TEXT NOT NULL DEFAULT 'Sheet1',
        last_synced_row INTEGER NOT NULL DEFAULT 1,
        last_synced_timestamp TEXT,
        total_rows_synced INTEGER NOT NULL DEFAULT 0,
        last_sync_status TEXT NOT NULL DEFAULT 'idle',
        last_sync_message TEXT,
        last_synced_at TIMESTAMP WITH TIME ZONE,
        config_json TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      ALTER TABLE sync_checkpoints ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE cattle_sensor_records ALTER COLUMN id SET DEFAULT gen_random_uuid();
    `);
    console.log("✅ Cattle sensor records & Sync checkpoints tables verified in PostgreSQL!");
  } catch (err: any) {
    console.error("⚠️ Failed to initialize cattle tables in DB:", err?.message || err);
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("init-cattle-tables.ts")) {
  initCattleTables();
}
