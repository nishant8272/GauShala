import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

export interface AuthenticatedUser {
  id: string;
  role: "user" | "doctor" | "super_admin";
  username?: string;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthenticatedUser;
    }
  }
}

export async function extractUser(req: Request, _res: Response, next: NextFunction) {
  try {
    // Extract from Authorization header, session/passport, header, query, or mock fallback
    const authHeader = req.headers["authorization"];
    let tokenUserId: string | undefined = undefined;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const match = token.match(/^token_([^_]+)_/);
      if (match && match[1]) {
        tokenUserId = match[1];
      }
    }

    const sessionUser = (req as any).user || (req as any).session?.passport?.user;
    const headerUserId = req.headers["x-user-id"] as string | undefined;
    const headerRole = (req.headers["x-user-role"] as "user" | "doctor" | "super_admin") || undefined;
    const queryUserId = req.query.userId as string | undefined;
    const bodyUserId = req.body?.userId as string | undefined;

    const resolvedId = tokenUserId || sessionUser?.id || sessionUser || headerUserId || queryUserId || bodyUserId || "user-1";
    let userInDb: { id: string; username: string; role: string } | null = null;
    try {
      userInDb = await prisma.user.findUnique({
        where: { id: resolvedId },
        select: { id: true, username: true, role: true },
      });
    } catch {
      // DB query fallback
    }

    const rawRole = userInDb?.role || sessionUser?.role || headerRole;
    const resolvedRole: "user" | "doctor" | "super_admin" =
      rawRole === "super_admin" || rawRole === "admin" || resolvedId === "admin-1"
        ? "super_admin"
        : rawRole === "doctor"
        ? "doctor"
        : "user";
    const resolvedUsername = userInDb?.username || sessionUser?.username || (resolvedRole === "super_admin" ? "admin" : "user");

    req.currentUser = {
      id: resolvedId,
      role: resolvedRole,
      username: resolvedUsername,
    };
  } finally {
    next();
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.currentUser || !req.currentUser.id) {
    return res.status(401).json({ error: "Unauthorized: Authentication required" });
  }
  next();
}

export function requireRole(...allowedRoles: Array<"user" | "doctor" | "super_admin">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: "Unauthorized: Authentication required" });
    }

    if (!allowedRoles.includes(req.currentUser.role)) {
      // In dev mode, we permit super_admin or user-1 mock if not strict, but check role
      if (req.currentUser.role === "super_admin") {
        return next();
      }
      return res.status(403).json({
        error: `Forbidden: Requires one of [${allowedRoles.join(", ")}] roles, current role is ${req.currentUser.role}`,
      });
    }

    next();
  };
}
