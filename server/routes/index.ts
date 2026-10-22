import { Router, type Express } from "express";
import { createServer, type Server } from "http";
import { authRouter } from "./auth.routes";
import { doctorRouter } from "./doctor.routes";
import { adminRouter } from "./admin.routes";
import { teleconsultRouter } from "./teleconsult.routes";
import { cattleRouter } from "./cattle.routes";
import { animalRouter } from "./animal.routes";
import { extractUser } from "../middleware/auth.middleware";

import { registerWhatsAppRoutes } from "../whatsapp";

export const apiRouter = Router();

// Public configuration endpoint (accessible before auth extraction or via direct /api/config)
apiRouter.get("/config", (_req, res) => {
  res.json({
    businessPhoneNumber: process.env.BUSINESS_PHONE_NUMBER || "15551980995",
  });
});

// Apply auth/user extraction context to all API endpoints
apiRouter.use(extractUser);

// Mount domain routes
apiRouter.use("/auth", authRouter);
apiRouter.use("/doctor", doctorRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/teleconsult", teleconsultRouter);
apiRouter.use("/cattle", cattleRouter);
apiRouter.use("/animals", animalRouter);

// Health check endpoint
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Public config endpoint directly on app as well
  app.get("/api/config", (_req, res) => {
    res.json({
      businessPhoneNumber: process.env.BUSINESS_PHONE_NUMBER || "15551980995",
    });
  });

  // Mount WhatsApp webhook and API routes
  registerWhatsAppRoutes(app);

  // Mount API router on both /api and root for Vercel serverless functions compatibility
  app.use("/api", apiRouter);
  app.use("/", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}

