import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/auth.api";
import type { AuthUser, LoginCredentials, RegisterCredentials, UserRole } from "../types/auth.types";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (credentials: RegisterCredentials) => Promise<AuthUser>;
  registerAdmin: (credentials: { username: string; password: string; adminKey?: string; fullName?: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalDefaultTab: "login" | "register";
  authModalInitialRole: UserRole;
  openAuthModal: (tab?: "login" | "register", role?: UserRole) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "medsevasetu_auth_user";
const LOCAL_STORAGE_TOKEN_KEY = "medsevasetu_auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalDefaultTab, setAuthModalDefaultTab] = useState<"login" | "register">("login");
  const [authModalInitialRole, setAuthModalInitialRole] = useState<UserRole>("user");

  useEffect(() => {
    // Check saved session on initialization
    try {
      const savedUserJson = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (savedUserJson) {
        const parsed = JSON.parse(savedUserJson) as AuthUser;
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openAuthModal = (tab: "login" | "register" = "login", role: UserRole = "user") => {
    setAuthModalDefaultTab(tab);
    setAuthModalInitialRole(role);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
    const res = await authApi.login(credentials);
    setUser(res.user);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(res.user));
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, res.token);
    closeAuthModal();
    return res.user;
  };

  const register = async (credentials: RegisterCredentials): Promise<AuthUser> => {
    const res = await authApi.register(credentials);
    setUser(res.user);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(res.user));
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, res.token);
    closeAuthModal();
    return res.user;
  };

  const registerAdmin = async (credentials: { username: string; password: string; adminKey?: string; fullName?: string }): Promise<AuthUser> => {
    const res = await authApi.registerAdmin(credentials);
    setUser(res.user);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(res.user));
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, res.token);
    closeAuthModal();
    return res.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      setUser(null);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        registerAdmin,
        logout,
        isAuthModalOpen,
        authModalDefaultTab,
        authModalInitialRole,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
