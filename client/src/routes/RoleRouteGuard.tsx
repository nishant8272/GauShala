import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/features/auth";
import { ShieldAlert, RefreshCw, LogIn, ArrowLeft } from "lucide-react";
import type { UserRole } from "@/features/auth/types/auth.types";

interface RoleRouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  currentUserRole?: UserRole;
  fallbackPath?: string;
  moduleName?: string;
}

export function RoleRouteGuard({
  children,
  allowedRoles,
  currentUserRole,
  fallbackPath = "/",
  moduleName = "Super Admin Portal",
}: RoleRouteGuardProps) {
  const { user, isLoading, openAuthModal } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span>Verifying security permissions...</span>
        </div>
      </div>
    );
  }

  const effectiveRole = currentUserRole || user?.role;

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission =
      effectiveRole === "super_admin" || (effectiveRole && allowedRoles.includes(effectiveRole));

    if (!hasPermission) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-amber-50/20 py-16 px-4 flex items-center justify-center font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200/80 shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                Restricted Access
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-2">Access Denied</h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                The {moduleName} is strictly restricted to platform administrators. Your current account ({user?.username || "Guest"} — role: <span className="font-semibold text-slate-700">{user?.role || "unauthenticated"}</span>) does not have administrative clearance.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              {!user ? (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Login as Administrator
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Switch Account
                </button>
              )}

              <Link
                href={fallbackPath}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
