import { useAuth } from "../context/AuthContext";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, ShieldCheck, Stethoscope, MessageSquare, FolderHeart, Calendar, Activity } from "lucide-react";

export function UserAvatarMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleLabel =
    user.role === "doctor"
      ? "Doctor / Vet"
      : user.role === "super_admin"
      ? "Super Admin"
      : "User";

  const roleBadgeClass =
    user.role === "doctor"
      ? "bg-blue-100 text-blue-800"
      : user.role === "super_admin"
      ? "bg-purple-100 text-purple-800"
      : "bg-slate-100 text-slate-700";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 font-medium rounded-full pl-2 pr-3 py-1.5 border-slate-200 hover:border-blue-300"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate">
            {user.username}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${roleBadgeClass}`}>
            {user.role === "super_admin" ? "Admin" : user.role === "doctor" ? "Doctor" : "User"}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-2">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-slate-900">{user.username}</p>
            <p className="text-xs leading-none text-slate-500">{roleLabel}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {user.role === "doctor" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/doctor/dashboard" className="cursor-pointer flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-blue-600" />
                <span>Doctor Workspace</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/doctor/onboard" className="cursor-pointer flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>KYC Profile & Docs</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {user.role === "super_admin" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/super-admin" className="cursor-pointer flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                <span>Admin Moderation</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/cattle-dashboard" className="cursor-pointer flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span>Buffalo Monitor</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuItem asChild>
          <Link href="/features/chatbot" className="cursor-pointer flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-600" />
            <span>AI Assistant</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/features/records" className="cursor-pointer flex items-center gap-2">
            <FolderHeart className="h-4 w-4 text-slate-600" />
            <span>Health Records</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/my-appointments" className="cursor-pointer flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-slate-900">My Appointments</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
