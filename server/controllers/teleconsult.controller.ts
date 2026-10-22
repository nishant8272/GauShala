import type { Request, Response, NextFunction } from "express";
import { teleconsultService, TeleconsultService } from "../services/teleconsult.service";

export class TeleconsultController {
  constructor(private teleService: TeleconsultService = teleconsultService) {}

  getPublicDoctors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const specialization = req.query.specialization as string | undefined;
      const search = req.query.search as string | undefined;
      const list = await this.teleService.getPublicDoctors(specialization, search);
      res.json(list);
    } catch (err) {
      next(err);
    }
  };

  getPublicDoctorById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const doc = await this.teleService.getPublicDoctorById(id);
      res.json(doc);
    } catch (err) {
      next(err);
    }
  };

  bookAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).currentUser?.id || (req as any).user?.id || (req as any).session?.passport?.user || req.body.patientId || "user-1";
      const { doctorId, scheduledAt, consultationType, symptoms, patientName, fee } = req.body;

      const result = await this.teleService.scheduleAppointment({
        patientId: userId,
        patientName: patientName || "Farmer / Patient",
        doctorId,
        scheduledAt,
        consultationType,
        symptoms,
        fee,
      });

      res.status(201).json({
        message: "Appointment booking created. Proceed to payment to confirm visit.",
        appointment: result.appointment,
        paymentOrder: result.paymentOrder,
      });
    } catch (err) {
      next(err);
    }
  };

  createPaymentOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await this.teleService.createAppointmentPaymentOrder(id);
      res.json(order);
    } catch (err) {
      next(err);
    }
  };

  verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        appointmentId,
        appointment_id,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;
      const result = await this.teleService.verifyAppointmentPayment({
        appointmentId: appointmentId || appointment_id,
        razorpayOrderId: razorpayOrderId || razorpay_order_id,
        razorpayPaymentId: razorpayPaymentId || razorpay_payment_id,
        razorpaySignature: razorpaySignature || razorpay_signature,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getUserAppointments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).currentUser?.id || (req as any).user?.id || (req as any).session?.passport?.user || (req.query.userId as string) || "user-1";
      const appts = await this.teleService.getUserAppointments(userId);
      res.json(appts);
    } catch (err) {
      next(err);
    }
  };

  cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await this.teleService.cancelAppointment(id);
      res.json({ message: "Appointment cancelled successfully", appointment: result });
    } catch (err) {
      next(err);
    }
  };
}

export const teleconsultController = new TeleconsultController();
