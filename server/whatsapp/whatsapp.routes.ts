import { Router, type Express } from "express";
import { whatsappController } from "./whatsapp.controller";

export const whatsappRouter = Router();

// Standard WhatsApp Cloud API Webhook routes
whatsappRouter.get("/webhook", (req, res) => {
  whatsappController.verifyWebhook(req, res);
});

whatsappRouter.post("/webhook", (req, res) => {
  whatsappController.handleWebhook(req, res);
});

// Also support /api/webhook alias if routing requires /api prefix
whatsappRouter.get("/api/webhook", (req, res) => {
  whatsappController.verifyWebhook(req, res);
});

whatsappRouter.post("/api/webhook", (req, res) => {
  whatsappController.handleWebhook(req, res);
});

export function registerWhatsAppRoutes(app: Express): void {
  app.use(whatsappRouter);
}
