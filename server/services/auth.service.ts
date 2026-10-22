import { userRepository, UserRepository } from "../repositories/user.repository";
import { AppError } from "../middleware/error.middleware";

export interface SanitizedUser {
  id: string;
  username: string;
  role: "user" | "doctor" | "super_admin";
}

export class AuthService {
  constructor(private userRepo: UserRepository = userRepository) {}

  async register(data: { username: string; password: string; role?: "user" | "doctor" | "super_admin" }): Promise<{ user: SanitizedUser; token: string }> {
    const cleanEmail = data.username.trim().toLowerCase();
    const existing = await this.userRepo.findByUsername(cleanEmail);
    if (existing) {
      throw new AppError("An account with this Gmail / Email address already exists. Please log in or use another email.", 409);
    }

    // Public registration only permits user or doctor
    const role: "user" | "doctor" = data.role === "doctor" ? "doctor" : "user";
    const createdUser = await this.userRepo.create({
      username: cleanEmail,
      password: data.password,
      role,
    });

    const sanitized: SanitizedUser = {
      id: createdUser.id,
      username: createdUser.username,
      role: createdUser.role as "user" | "doctor" | "super_admin",
    };

    // Lightweight mock JWT/session token for the client session
    const token = `token_${createdUser.id}_${Date.now()}`;

    return {
      user: sanitized,
      token,
    };
  }

  async registerAdmin(data: {
    username: string;
    password: string;
    adminKey?: string;
    fullName?: string;
  }): Promise<{ user: SanitizedUser; token: string }> {
    const cleanEmail = data.username.trim().toLowerCase();
    const existing = await this.userRepo.findByUsername(cleanEmail);
    if (existing) {
      throw new AppError("An account with this Email address already exists. Please log in or use another email.", 409);
    }

    // Optional security key check
    const validKeys = [
      process.env.ADMIN_SECRET_KEY,
      "GAUSHALA_SUPER_ADMIN_2026",
      "superadmin",
      "admin123",
      "gaushala2026",
    ].filter(Boolean);

    if (data.adminKey && data.adminKey.trim()) {
      const isKeyValid = validKeys.some((k) => k?.toLowerCase() === data.adminKey?.trim().toLowerCase());
      if (!isKeyValid) {
        throw new AppError("Invalid Administrator Security Passcode.", 403);
      }
    }

    const createdUser = await this.userRepo.create({
      username: cleanEmail,
      password: data.password,
      role: "super_admin",
    });

    const sanitized: SanitizedUser = {
      id: createdUser.id,
      username: createdUser.username,
      role: "super_admin",
    };

    const token = `token_${createdUser.id}_${Date.now()}`;

    return {
      user: sanitized,
      token,
    };
  }

  async login(data: { username: string; password: string }): Promise<{ user: SanitizedUser; token: string }> {
    const cleanEmail = data.username.trim().toLowerCase();
    let user = await this.userRepo.findByUsername(cleanEmail);
    if (!user) {
      user = await this.userRepo.findByUsername(data.username);
    }
    if (!user || user.password !== data.password) {
      throw new AppError("Invalid email or password", 401);
    }

    const sanitized: SanitizedUser = {
      id: user.id,
      username: user.username,
      role: user.role as "user" | "doctor" | "super_admin",
    };

    const token = `token_${user.id}_${Date.now()}`;

    return {
      user: sanitized,
      token,
    };
  }

  async getCurrentUser(userId: string): Promise<SanitizedUser> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role as "user" | "doctor" | "super_admin",
    };
  }
}

export const authService = new AuthService();
