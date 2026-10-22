import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "wouter";
import type { UserRole } from "../types/auth.types";

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalDefaultTab,
    authModalInitialRole,
    login,
    register,
  } = useAuth();

  const [, navigate] = useLocation();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setTab(authModalDefaultTab);
      // Ensure admin cannot be selected on public register
      setRole(authModalInitialRole === "super_admin" ? "user" : authModalInitialRole || "user");
      setError(null);
    }
  }, [isAuthModalOpen, authModalDefaultTab, authModalInitialRole]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase();

    if (tab === "register") {
      if (!cleanUsername.includes("@") || !cleanUsername.includes(".")) {
        setError("Please enter a valid Gmail / Email address (e.g. name@gmail.com).");
        setLoading(false);
        return;
      }
      if (role === "super_admin") {
        setError("Administrator accounts cannot be registered publicly. They must be created by an existing Admin.");
        setLoading(false);
        return;
      }
    }

    try {
      if (tab === "login") {
        const loggedInUser = await login({ username: cleanUsername, password });
        if (loggedInUser.role === "doctor") {
          navigate("/doctor/dashboard");
        } else if (loggedInUser.role === "super_admin") {
          navigate("/super-admin");
        } else {
          navigate("/features/records");
        }
        closeAuthModal();
      } else {
        const registeredUser = await register({ username: cleanUsername, password, role });
        if (registeredUser.role === "doctor") {
          navigate("/doctor/onboard");
        } else {
          navigate("/features/records");
        }
        closeAuthModal();
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoRole: "user" | "doctor" | "super_admin") => {
    if (demoRole === "doctor") {
      setUsername("doctor@gaushala.in");
      setPassword("password123");
    } else {
      setUsername("farmer@gaushala.in");
      setPassword("password123");
    }
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b flex items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              {tab === "login" ? "Welcome Back 👋" : "Create an Account 🚀"}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
              {tab === "login"
                ? "Sign in with your Gmail to access your portal, consultations & records."
                : "Join the platform as a Farmer / User or registered Veterinarian."}
            </p>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition text-base sm:text-lg leading-none shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 mx-4 sm:mx-6 mt-4 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => { setTab("login"); setError(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              tab === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setError(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              tab === "register"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Register / Sign Up
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {tab === "register" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registering Account Type:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                    role === "user"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-500/20"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 bg-slate-50/50"
                  }`}
                >
                  <span className="text-xl">👨‍🌾</span>
                  <span className="text-xs font-semibold">Farmer / User</span>
                  <span className="text-[10px] text-slate-500">Cattle records & care</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("doctor")}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                    role === "doctor"
                      ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold ring-2 ring-blue-500/20"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 bg-slate-50/50"
                  }`}
                >
                  <span className="text-xl">🩺</span>
                  <span className="text-xs font-semibold">Doctor / Vet</span>
                  <span className="text-[10px] text-slate-500">Practice & teleconsult</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gmail / Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. kisan@gmail.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm"
            />
            {tab === "register" && (
              <p className="text-[11px] text-slate-400 mt-1">
                Your Gmail acts as your unique identifier to access your animals & records.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700 px-1 py-0.5"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : tab === "login" ? (
              <span>Sign In to Account →</span>
            ) : (
              <span>Create Account →</span>
            )}
          </button>

          {tab === "login" && (
            <div className="pt-3 border-t">
              <p className="text-[11px] text-slate-400 text-center mb-2">
                Quick Demo Accounts (1-Click Fill):
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={() => handleFillDemo("user")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition"
                >
                  👤 User
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo("doctor")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition"
                >
                  🩺 Doctor
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
