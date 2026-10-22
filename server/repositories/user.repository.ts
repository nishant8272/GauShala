import { prisma } from "../config/prisma";
import type { User } from "@prisma/client";

export interface InsertUser {
  username: string;
  password: string;
  role?: string;
}

export class UserRepository {
  async findById(id: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return (user as User) || undefined;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    return (user as User) || undefined;
  }

  async create(userData: InsertUser & { role?: string }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        password: userData.password,
        role: userData.role || "user",
      },
    });
    return user as User;
  }

  async updateUserRole(userId: string, role: "user" | "doctor" | "super_admin"): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}

export const userRepository = new UserRepository();
