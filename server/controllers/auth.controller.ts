import type { Request, Response, NextFunction } from "express";
import { authService, AuthService } from "../services/auth.service";

export class AuthController {
  constructor(private authSvc: AuthService = authService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authSvc.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  registerAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authSvc.registerAdmin(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authSvc.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.currentUser?.id || (req.query.userId as string) || "user-1";
      const user = await this.authSvc.getCurrentUser(userId);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  };

  logout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
