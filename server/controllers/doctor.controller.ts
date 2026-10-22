import type { Request, Response, NextFunction } from "express";
import { doctorService, DoctorService } from "../services/doctor.service";
import { appointmentService, AppointmentService } from "../services/appointment.service";

export class DoctorController {
  constructor(
    private docService: DoctorService = doctorService,
    private apptService: AppointmentService = appointmentService,
  ) {}

  onboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.currentUser?.id || req.body.userId || "user-1";
      const profile = await this.docService.onboard(userId, req.body);
      res.status(201).json({ profile });
    } catch (err) {
      next(err);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.currentUser?.id || (req.query.userId as string) || "user-1";
      const profile = await this.docService.getProfile(userId);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  };

  uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.currentUser?.id || req.body.userId || "user-1";
      const { documentType, fileBase64, fileName, mimeType } = req.body;
      const doc = await this.docService.uploadDocument(userId, documentType, {
        fileName,
        mimeType,
        fileBase64,
      });
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  };

  getDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.currentUser?.id || (req.query.userId as string) || "user-1";
      const docs = await this.docService.getDocuments(userId);
      res.json(docs);
    } catch (err) {
      next(err);
    }
  };

  deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.currentUser?.id || "user-1";
      const docType = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;
      const result = await this.docService.deleteDocument(userId, docType);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  completeOnboarding = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.currentUser?.id || req.body.userId || "user-1";
      const updated = await this.docService.completeOnboarding(userId);
      res.json({ message: "Submitted for admin review", profile: updated });
    } catch (err) {
      next(err);
    }
  };

  toggleAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.currentUser?.id || req.body.userId || "user-1";
      const { isAvailable } = req.body;
      const result = await this.docService.toggleAvailability(userId, isAvailable);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getAppointments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = (req.query.doctorId as string) || req.currentUser?.id || "user-1";
      const appointments = await this.apptService.getDoctorAppointments(doctorId);
      res.json(appointments);
    } catch (err) {
      next(err);
    }
  };

  updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, prescription } = req.body;
      const updated = await this.apptService.updateAppointmentStatus(id, status, prescription);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  createMembershipOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.currentUser?.id || req.body.userId || "user-1";
      const order = await this.docService.createSubscriptionOrder(userId);
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  };

  verifyMembership = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.currentUser?.id || req.body.userId || "user-1";
      const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;
      const result = await this.docService.verifySubscription(userId, {
        razorpayOrderId: razorpayOrderId || razorpay_order_id,
        razorpayPaymentId: razorpayPaymentId || razorpay_payment_id,
        razorpaySignature: razorpaySignature || razorpay_signature,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const doctorController = new DoctorController();
