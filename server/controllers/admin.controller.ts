import type { Request, Response, NextFunction } from "express";
import { adminService, AdminService } from "../services/admin.service";

export class AdminController {
  constructor(private admService: AdminService = adminService) {}

  listDoctors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string | undefined;
      const list = await this.admService.listDoctors(status);
      res.json(list);
    } catch (err) {
      next(err);
    }
  };

  getDoctorDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const details = await this.admService.getDoctorDetail(id);
      res.json(details);
    } catch (err) {
      next(err);
    }
  };

  viewDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const docType = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;

      const doc = await this.admService.getDocument(profileId, docType);
      if (!doc) {
        return res.status(404).send("Document not found");
      }

      // 1. If Base64 is stored, stream it directly as binary
      if (doc.dataBase64) {
        const base64Data = doc.dataBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        res.setHeader("Content-Type", doc.mimeType || "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${encodeURIComponent(doc.fileName || `${docType}.pdf`)}"`
        );
        return res.send(buffer);
      }

      // 2. If Cloudinary URL is stored, proxy or redirect
      if (doc.fileUrl && doc.fileUrl.startsWith("http")) {
        try {
          const fetchRes = await fetch(doc.fileUrl);
          if (fetchRes.ok) {
            const arrayBuffer = await fetchRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.setHeader("Content-Type", doc.mimeType || "application/pdf");
            res.setHeader(
              "Content-Disposition",
              `inline; filename="${encodeURIComponent(doc.fileName || `${docType}.pdf`)}"`
            );
            return res.send(buffer);
          }
        } catch {
          // Fall through to redirect
        }
        return res.redirect(doc.fileUrl);
      }

      res.status(404).send("Document content unavailable");
    } catch (err) {
      next(err);
    }
  };

  approveDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const profile = await this.admService.approveDoctor(id);
      res.json({ message: "Doctor approved successfully", profile });
    } catch (err) {
      next(err);
    }
  };

  rejectDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { reason } = req.body;
      const profile = await this.admService.rejectDoctor(id, reason || "Documents failed verification");
      res.json({ message: "Doctor onboarding rejected", profile });
    } catch (err) {
      next(err);
    }
  };

  createAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const newAdmin = await this.admService.createAdmin(email, password);
      res.status(201).json({ message: "Administrator account created successfully", admin: newAdmin });
    } catch (err) {
      next(err);
    }
  };
}

export const adminController = new AdminController();
