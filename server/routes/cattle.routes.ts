import { Router } from "express";
import { cattleController } from "../controllers/cattle.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

export const cattleRouter = Router();

// Strict security: all cattle monitor endpoints require authenticated super_admin role
cattleRouter.use(requireAuth, requireRole("super_admin"));

cattleRouter.get("/dashboard", (req, res, next) => cattleController.getDashboard(req, res, next));
cattleRouter.get("/records", (req, res, next) => cattleController.getRecords(req, res, next));
cattleRouter.get("/checkpoint", (req, res, next) => cattleController.getCheckpoint(req, res, next));
cattleRouter.post("/sync", (req, res, next) => cattleController.syncNow(req, res, next));
cattleRouter.post("/config", (req, res, next) => cattleController.saveConfig(req, res, next));
cattleRouter.post("/simulate", (req, res, next) => cattleController.simulateRow(req, res, next));
cattleRouter.post("/reset", (req, res, next) => cattleController.resetData(req, res, next));
