import express, { type Express } from "express";
import cors from "cors";
import { registerRoutes } from "./routes/index";
import { errorMiddleware } from "./middleware/error.middleware";

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );

  app.use(
    express.json({
      limit: "50mb",
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false, limit: "50mb" }));

  // Request logger
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          const serialized = JSON.stringify(capturedJsonResponse);
          logLine += ` :: ${serialized.length > 200 ? serialized.slice(0, 200) + "... [truncated]" : serialized}`;
        }

        log(logLine);
      }
    });

    next();
  });

  // Register modular API routes
  await registerRoutes(app);

  // Centralized error handler
  app.use(errorMiddleware);

  return app;
}
