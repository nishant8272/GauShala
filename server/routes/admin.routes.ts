import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { z } from "zod";

export const createAdminSchema = z.object({
  email: z.string().email("Please provide a valid Gmail / Email address for the new administrator"),
  password: z.string().min(6, "Admin password must be at least 6 characters"),
});

export const adminRouter = Router();

// Strict security: all admin routes require uthenticated super_admin role
adminRouter.use(requireAuth, requireRole("super_admin"));

adminRouter.get("/doctors", adminController.listDoctors);
adminRouter.get("/doctors/:id", adminController.getDoctorDetail);
adminRouter.get("/doctors/:id/documents/:type/view", adminController.viewDocument);
adminRouter.patch("/doctors/:id/approve", adminController.approveDoctor);
adminRouter.patch("/doctors/:id/reject", adminController.rejectDoctor);
adminRouter.post("/create-admin", validateBody(createAdminSchema), adminController.createAdmin);
