import { useState, useEffect } from "react";
import { Link } from "wouter";
import { adminApi } from "../api/admin.api";
import { AdminDocumentModal } from "./AdminDocumentModal";
import { useAuth } from "@/features/auth";
import type { DoctorDocument } from "../../doctor/types/doctor.types";
import type { AdminDoctorListItem } from "../types/admin.types";
import { ArrowLeft, ShieldCheck, RefreshCw, ShieldAlert, LogIn, UserPlus, X, CheckCircle2 } from "lucide-react";

export function SuperAdminDoctorPanel() {
  const { user, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const isAdmin = user?.role === "super_admin";

  const [doctors, setDoctors] = useState<AdminDoctorListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(true);

  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string } | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<DoctorDocument[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  // Register New Admin state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminModalMsg, setAdminModalMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const loadDoctors = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await adminApi.listDoctors(statusFilter || undefined);
      setDoctors(data);
    } catch (err) {
      console.error("Admin load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDoctors();
    }
  }, [statusFilter, isAdmin]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span>Verifying administrator permissions...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-amber-50/20 py-16 px-4 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200/80 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
              Restricted Area
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">Admin Access Required</h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              The Super Admin Portal is strictly restricted to platform administrators. Your current account ({user?.username || "Guest"} — role: <span className="font-semibold text-slate-700">{user?.role || "unauthenticated"}</span>) does not have administrative permissions.
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
              href="/"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleOpenDocs = async (profileId: string, doctorName: string) => {
    try {
      const detail = await adminApi.getDoctorDetail(profileId);
      setSelectedDoctor({ id: profileId, name: doctorName });
      setSelectedDocs(detail.documents);
      setIsModalOpen(true);
    } catch (err: any) {
      alert(err.message || "Failed to load doctor documents");
    }
  };

  const handleApprove = async (profileId: string) => {
    if (!profileId || profileId === "undefined") {
      alert("Doctor profile identifier is missing.");
      return;
    }
    if (!confirm("Are you sure you want to approve this doctor and list them in the public catalog?")) return;
    setActionId(profileId);
    try {
      await adminApi.approveDoctor(profileId);
      alert("Doctor approved successfully!");
      loadDoctors();
    } catch (err: any) {
      alert(err.message || "Approval failed");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (profileId: string) => {
    if (!profileId || profileId === "undefined") {
      alert("Doctor profile identifier is missing.");
      return;
    }
    const reason = prompt("Enter the reason for rejecting this doctor application:");
    if (!reason) return;

    setActionId(profileId);
    try {
      await adminApi.rejectDoctor(profileId, reason);
      alert("Doctor application rejected.");
      loadDoctors();
    } catch (err: any) {
      alert(err.message || "Rejection failed");
    } finally {
      setActionId(null);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminModalMsg(null);
    const cleanEmail = newAdminEmail.trim().toLowerCase();
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setAdminModalMsg({ type: "error", text: "Please enter a valid Gmail / Email address." });
      return;
    }
    if (newAdminPassword.length < 6) {
      setAdminModalMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setCreatingAdmin(true);
    try {
      const res = await adminApi.createAdmin({ email: cleanEmail, password: newAdminPassword });
      setAdminModalMsg({ type: "success", text: `Admin account created successfully for ${res.admin.username}!` });
      setNewAdminEmail("");
      setNewAdminPassword("");
      setTimeout(() => {
        setIsAdminModalOpen(false);
        setAdminModalMsg(null);
      }, 2000);
    } catch (err: any) {
      setAdminModalMsg({ type: "error", text: err.message || "Failed to create administrator account." });
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-sky-50/20 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Nav */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition bg-white px-3 py-1.5 rounded-lg border shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { setIsAdminModalOpen(true); setAdminModalMsg(null); }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-3.5 py-1.5 rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New Admin</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
              <ShieldCheck className="w-4 h-4" />
              <span>Super Admin Portal</span>
            </div>
          </div>
        </div>

        {/* Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-md">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Doctor KYC Moderation</h1>
            <p className="text-xs text-slate-500 mt-1">
              Review medical qualifications, inspect Cloudinary KYC proofs, and publish provider listings.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border">
            {["pending", "approved", "rejected", ""].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {st || "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading doctor records...</span>
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-16 text-center text-sm text-slate-400">
              No doctors found matching the selected filter ({statusFilter || "all"}).
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b">
                  <tr>
                    <th className="px-6 py-4">Doctor</th>
                    <th className="px-6 py-4">License & Spec</th>
                    <th className="px-6 py-4">KYC Docs</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((doc: any) => {
                    const profileId = doc.profile_id || doc.id;
                    const doctorName = doc.doctor_name || doc.doctorName || (doc.user?.username ? `Dr. ${doc.user.username}` : doc.qualification || "Dr. Specialist");
                    const doctorEmail = doc.doctor_email || doc.doctorEmail || (doc.user?.username ? `${doc.user.username}@medsevasetu.in` : "");
                    const licenseNumber = doc.license_number || doc.licenseNumber || "—";
                    const docsCount = doc.uploaded_documents_count ?? doc.documents?.length ?? 0;

                    return (
                      <tr key={profileId} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{doctorName}</div>
                          {doctorEmail && <div className="text-xs text-slate-400">{doctorEmail}</div>}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{doc.specialization}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            Lic: {licenseNumber}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenDocs(profileId, doctorName)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
                          >
                            <span>📁 View Files ({docsCount})</span>
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                              doc.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : doc.status === "rejected"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {doc.status !== "approved" && (
                              <button
                                disabled={actionId === profileId}
                                onClick={() => handleApprove(profileId)}
                                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
                              >
                                Approve
                              </button>
                            )}

                            {doc.status !== "rejected" && (
                              <button
                                disabled={actionId === profileId}
                                onClick={() => handleReject(profileId)}
                                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 transition"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedDoctor && (
          <AdminDocumentModal
            profileId={selectedDoctor.id}
            doctorName={selectedDoctor.name}
            documents={selectedDocs}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        )}

        {/* Register New Admin Modal */}
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl border border-slate-100 p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Register New Administrator</h3>
                    <p className="text-[11px] text-slate-500">Add an administrator with full platform clearance</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {adminModalMsg && (
                <div
                  className={`p-3 rounded-xl text-xs mb-4 flex items-start gap-2 ${
                    adminModalMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {adminModalMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <span className="font-bold">⚠️</span>
                  )}
                  <span>{adminModalMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admin Gmail / Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin.new@gmail.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This Gmail will be used by the administrator for platform sign-in.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition"
                  />
                </div>

                <div className="pt-2 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingAdmin}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {creatingAdmin ? "Creating..." : "Create Admin Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
