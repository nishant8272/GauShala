import React from "react";
import type { ProfileStatus } from "../types/doctor.types";

interface DoctorStatusBannerProps {
  status: ProfileStatus;
  rejectionReason?: string | null;
  onEditKyc?: () => void;
}

export function DoctorStatusBanner({
  status,
  rejectionReason,
  onEditKyc,
}: DoctorStatusBannerProps) {
  if (status === "approved") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <h4 className="text-sm font-bold text-emerald-900">Verified & Active Doctor</h4>
            <p className="text-xs text-emerald-700">Your KYC credentials and medical license have been approved by Super Admin.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
          Active Provider
        </span>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">⏳</span>
          <div>
            <h4 className="text-sm font-bold text-amber-900">KYC Verification Under Review</h4>
            <p className="text-xs text-amber-700">Super Admin is currently verifying your medical council registration and uploaded documents.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
          Under Review
        </span>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">❌</span>
          <div>
            <h4 className="text-sm font-bold text-rose-900">KYC Verification Rejected</h4>
            <p className="text-xs text-rose-700">
              Reason: {rejectionReason || "Uploaded documents were unclear or invalid."}
            </p>
          </div>
        </div>
        {onEditKyc && (
          <button
            onClick={onEditKyc}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Re-upload Documents
          </button>
        )}
      </div>
    );
  }

  return null;
}
