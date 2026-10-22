import { Router } from "express";
import { doctorController } from "../controllers/doctor.controller";
import { validateBody } from "../middleware/validate.middleware";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { z } from "zod";

export const doctorOnboardSchema = z.object({
  name: z.string().optional(),
  licenseNumber: z.string().min(3, "License number is required"),
  specialization: z.string().min(2, "Specialization is required"),
  qualification: z.string().min(2, "Qualification is required"),
  experienceYears: z.coerce.number().int().min(0),
  consultationFee: z.coerce.number().positive(),
  hospitalAffiliation: z.string().optional(),
  languages: z.array(z.string()).optional().default(["English", "Hindi"]),
  bio: z.string().optional(),
  city: z.string().optional(),
});

export const doctorRouter = Router();

// Strict security: all doctor portal routes require authenticated doctor or super_admin role
doctorRouter.use(requireAuth, requireRole("doctor"));

// Onboarding & Profile
doctorRouter.post("/onboard", validateBody(doctorOnboardSchema), doctorController.onboard);
doctorRouter.get("/me", doctorController.getProfile);

// KYC Documents
doctorRouter.post("/documents", doctorController.uploadDocument);
doctorRouter.get("/documents", doctorController.getDocuments);
doctorRouter.delete("/documents/:type", doctorController.deleteDocument);
doctorRouter.post("/complete-onboarding", doctorController.completeOnboarding);

// Availability & Schedule
doctorRouter.patch("/me/availability", doctorController.toggleAvailability);

// Annual Membership Subscription (₹100/year platform access)
doctorRouter.post("/membership/create-order", doctorController.createMembershipOrder);
doctorRouter.post("/membership/verify", doctorController.verifyMembership);

// Appointments
doctorRouter.get("/appointments", doctorController.getAppointments);
doctorRouter.patch("/appointments/:id", doctorController.updateAppointmentStatus);

