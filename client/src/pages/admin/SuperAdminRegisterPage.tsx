import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/features/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Activity, 
  Check, 
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export function SuperAdminRegisterPage() {
  const [, setLocation] = useLocation();
  const { registerAdmin, openAuthModal, isAuthenticated, user } = useAuth();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already logged in as super_admin, offer redirect to dashboard
  const isSuperAdmin = user?.role === "super_admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = username.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid work or official Gmail / Email address.");
      return;
    }

    if (password.length < 4) {
      setErrorMsg("Password must be at least 4 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);
    try {
      const createdUser = await registerAdmin({
        username: cleanEmail,
        password,
        adminKey: adminKey.trim(),
        fullName: fullName.trim() || undefined,
      });

      toast.success(
        `Super Admin account created for ${createdUser.username}! Redirecting to control panel...`
      );
      setLocation("/super-admin");
    } catch (err: any) {
      const msg = err.message || "Failed to register Super Admin account. Please verify credentials.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Gaushala Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1.5 px-2.5 py-0.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official Admin Gateway</span>
          </Badge>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-[480px] space-y-4">
          {/* Status banner if already signed in */}
          {isAuthenticated && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>
                  Signed in as <strong className="text-white">{user?.username}</strong> ({user?.role})
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setLocation(isSuperAdmin ? "/super-admin" : "/buffalo-monitor")}
                className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-700/60"
              >
                Go to Dashboard →
              </Button>
            </div>
          )}

          {/* Registration Card */}
          <Card className="bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Header */}
            <CardHeader className="p-6 sm:p-7 pb-4 text-center border-b border-slate-800/70 bg-gradient-to-b from-slate-800/50 to-transparent">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 shadow-inner">
                <ShieldCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Super Admin Registration
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Create a high-privilege executive administrator account for Gaushala telemetry and cattle health management.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 sm:p-7 space-y-4 text-xs">
                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="admin-email" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Administrator Work Email:</span>
                  </Label>
                  <Input
                    id="admin-email"
                    type="email"
                    required
                    placeholder="admin@gaushala.gov.in"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-10 text-xs bg-slate-800/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    This email will serve as your login username for subsequent sign-ins.
                  </p>
                </div>

                {/* Full Name / Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="admin-name" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Full Name / Designation (Optional):</span>
                  </Label>
                  <Input
                    id="admin-name"
                    type="text"
                    placeholder="e.g. Dr. Nishant Sharma (Chief Administrator)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 text-xs bg-slate-800/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-pwd" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Password:</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="admin-pwd"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 text-xs pr-8 bg-slate-800/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-pwd-confirm" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Confirm:</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="admin-pwd-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-10 text-xs pr-8 bg-slate-800/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Authorization Security Key */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="admin-key" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                      <span>Admin Security Key:</span>
                    </Label>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Authorized
                    </span>
                  </div>
                  <Input
                    id="admin-key"
                    type="text"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="h-10 text-xs font-mono bg-slate-800/70 border-slate-700 text-blue-300 focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Master key verifying authorization for <code className="text-slate-300 font-mono">super_admin</code> privilege allocation.
                  </p>
                </div>

                {/* Super Admin Privileges Checklist */}
                <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 space-y-1.5 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] block">
                    Granted Super Admin Privileges:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Multi-Cattle Monitor</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Estrus & Kinematics Control</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Google Sheet Live Sync</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Doctor KYC Approvals</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Card Footer & Submit Button */}
              <CardFooter className="p-6 sm:p-7 pt-0 flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all rounded-xl flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isLoading ? "Creating Admin Account..." : "Register Super Administrator"}</span>
                </Button>

                <div className="text-center text-xs text-slate-400 pt-1">
                  <span>Already have an administrator account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      openAuthModal("login", "super_admin");
                    }}
                    className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4"
                  >
                    Sign in here
                  </button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-3 text-center text-xs text-slate-400 bg-slate-900/40">
        <p>© 2026 Gaushala Animal Care & Cattle Fertility Intelligence System • Super Admin Security Tier</p>
      </footer>
    </div>
  );
}
export default SuperAdminRegisterPage;
