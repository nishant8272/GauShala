import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate.middleware";
import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().email("Please enter a valid Gmail / Email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  role: z.enum(["user", "doctor"]).default("user"),
});

export const adminRegisterSchema = z.object({
  username: z.string().email("Please enter a valid Gmail / Work Email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  adminKey: z.string().optional(),
  fullName: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(3, "Email or Username is required"),
  password: z.string().min(4, "Password is required"),
});

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), authController.register);
authRouter.post("/admin-register", validateBody(adminRegisterSchema), authController.registerAdmin);
authRouter.post("/login", validateBody(loginSchema), authController.login);
authRouter.get("/me", authController.me);
authRouter.post("/logout", authController.logout);

