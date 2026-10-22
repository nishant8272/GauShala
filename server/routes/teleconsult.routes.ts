import { Router } from "express";
import { teleconsultController } from "../controllers/teleconsult.controller";

export const teleconsultRouter = Router();

// Public Doctor Directory
teleconsultRouter.get("/doctors", teleconsultController.getPublicDoctors);
teleconsultRouter.get("/doctors/:id", teleconsultController.getPublicDoctorById);

// Appointment Scheduling for Users
teleconsultRouter.post("/appointments", teleconsultController.bookAppointment);
teleconsultRouter.get("/appointments/my", teleconsultController.getUserAppointments);
teleconsultRouter.patch("/appointments/:id/cancel", teleconsultController.cancelAppointment);

// Razorpay Payment Verification & Retry Order
teleconsultRouter.post("/appointments/:id/pay-order", teleconsultController.createPaymentOrder);
teleconsultRouter.post("/appointments/verify-payment", teleconsultController.verifyPayment);

