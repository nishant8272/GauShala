import "dotenv/config";
import { createApp, log } from "../server/app";
import { initCattleTables } from "../server/config/init-cattle-tables";
import { seedPrismaData } from "../server/config/seed-prisma";

let appPromise: Promise<any> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      try {
        await initCattleTables();
        await seedPrismaData();
      } catch (err) {
        log(`Database initialization warning: ${err}`, "vercel-serverless");
      }
      return createApp();
    })();
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Serverless Function Error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal Server Error in Serverless Function",
        message: error?.message || "Unknown error occurred",
      });
    }
  }
}
