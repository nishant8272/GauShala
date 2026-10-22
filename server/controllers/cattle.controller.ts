import type { Request, Response, NextFunction } from "express";
import { cattleDashboardService } from "../services/cattle-dashboard.service";
import { googleSheetsService } from "../services/google-sheets.service";

export class CattleController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const group = (req.query.group as string) || "All Cows";
      const timeframe = (req.query.timeframe as string) || "all";
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const data = await cattleDashboardService.getDashboardData({
        group,
        timeframe,
        startDate,
        endDate,
      });
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async getRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const timeframe = req.query.timeframe as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const data = await cattleDashboardService.getRecords({
        page,
        limit,
        status,
        search,
        timeframe,
        startDate,
        endDate,
      });
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async getCheckpoint(req: Request, res: Response, next: NextFunction) {
    try {
      const checkpoint = await googleSheetsService.getOrCreateCheckpoint();
      const config = await googleSheetsService.getConfig();
      res.json({
        checkpoint,
        config: {
          spreadsheetId: config.spreadsheetId,
          sheetName: config.sheetName,
          hasCredentials: Boolean(config.clientEmail && config.privateKey) || Boolean(config.credentialsPath),
          clientEmail: config.clientEmail ? `${config.clientEmail.slice(0, 4)}...${config.clientEmail.slice(-15)}` : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async syncNow(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await googleSheetsService.syncWithCheckpoint();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async saveConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { spreadsheetId, sheetName, clientEmail, privateKey, credentialsJson } = req.body;
      
      let finalClientEmail = clientEmail;
      let finalPrivateKey = privateKey;

      // Handle raw JSON service account credentials if pasted
      if (credentialsJson) {
        try {
          const parsed = typeof credentialsJson === "string" ? JSON.parse(credentialsJson) : credentialsJson;
          if (parsed.client_email) finalClientEmail = parsed.client_email;
          if (parsed.private_key) finalPrivateKey = parsed.private_key;
        } catch (e) {
          return res.status(400).json({ error: "Invalid credentials JSON format" });
        }
      }

      const updatedCheckpoint = await googleSheetsService.saveConfig({
        spreadsheetId,
        sheetName: sheetName || "Sheet1",
        clientEmail: finalClientEmail,
        privateKey: finalPrivateKey,
      });

      res.json({
        success: true,
        message: "Google Sheets connection configuration updated successfully!",
        checkpoint: updatedCheckpoint,
      });
    } catch (error) {
      next(error);
    }
  }

  async simulateRow(req: Request, res: Response, next: NextFunction) {
    try {
      const newRecord = await googleSheetsService.simulateNewRecord();
      res.json({
        success: true,
        message: "New sensor reading simulated! Checkpoint advanced by 1 row.",
        record: newRecord,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetData(req: Request, res: Response, next: NextFunction) {
    try {
      await googleSheetsService.resetAndReseed();
      res.json({
        success: true,
        message: "Data reset and re-seeded from Google Sheet reference template.",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cattleController = new CattleController();
