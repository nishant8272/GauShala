import "dotenv/config";
import { createApp, log } from "./app";
import { initCattleTables } from "./config/init-cattle-tables";
import { seedPrismaData } from "./config/seed-prisma";

// The bundled server never ships the vite dev middleware, so anything that is
// not explicitly a development run must serve the pre-built client instead.
const isProduction = process.env.NODE_ENV !== "development";

(async () => {
  await initCattleTables();
  await seedPrismaData();
  const app = await createApp();

  const port = parseInt(process.env.PORT || "5000", 10);
  const server = app.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });

  // Vite dev middleware and the static handler both register a catch-all
  // route, so they must come after every other route has been registered.
  if (isProduction) {
    const { serveStatic } = await import("./static");
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(server, app);
  }

  // Automated keep-alive pinger for Render free tier deployment using HEAD method
  const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
  if (externalUrl) {
    const pingUrl = externalUrl.replace(/\/$/, "") + "/health";
    const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (Render spins down after 15 min)
    setInterval(async () => {
      try {
        await fetch(pingUrl, { method: "HEAD" });
        log(`[keep-alive] HEAD ping sent to ${pingUrl}`);
      } catch (err: any) {
        log(`[keep-alive] HEAD ping warning: ${err?.message || err}`);
      }
    }, PING_INTERVAL_MS);
    log(`[keep-alive] Automated HEAD keep-alive scheduled for ${pingUrl} (every 10 min)`);
  }
})();
