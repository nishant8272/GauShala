import { apiClient } from "@/lib/api-client";
import type { LoginCredentials, RegisterCredentials, AuthResponse, AuthUser } from "../types/auth.types";

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (credentials: RegisterCredentials) =>
    apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  registerAdmin: (credentials: { username: string; password: string; adminKey?: string; fullName?: string }) =>
    apiClient<AuthResponse>("/auth/admin-register", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  me: (userId?: string) =>
    apiClient<{ user: AuthUser }>(`/auth/me${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`),

  logout: () =>
    apiClient<{ message: string }>("/auth/logout", {
      method: "POST",
    }),
};
