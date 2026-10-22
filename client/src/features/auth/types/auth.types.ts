export type UserRole = "user" | "doctor" | "super_admin";

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}
