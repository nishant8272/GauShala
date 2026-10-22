import { apiClient } from "@/lib/api-client";
import type { AdminDoctorListItem, AdminDoctorDetail } from "../types/admin.types";
import type { DoctorProfile, DocType } from "../../doctor/types/doctor.types";

export const adminApi = {
  listDoctors: (status?: string) =>
    apiClient<AdminDoctorListItem[]>(`/admin/doctors${status ? `?status=${encodeURIComponent(status)}` : ""}`),

  getDoctorDetail: (id: string) =>
    apiClient<AdminDoctorDetail>(`/admin/doctors/${id}`),

  approveDoctor: (id: string) =>
    apiClient<{ message: string; profile: DoctorProfile }>(`/admin/doctors/${id}/approve`, {
      method: "PATCH",
    }),

  rejectDoctor: (id: string, reason: string) =>
    apiClient<{ message: string; profile: DoctorProfile }>(`/admin/doctors/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  openDocumentPreview: (profileId: string, docType: DocType) => {
    const url = `/api/admin/doctors/${encodeURIComponent(profileId)}/documents/${encodeURIComponent(docType)}/view`;
    window.open(url, "_blank", "noopener,noreferrer");
  },

  createAdmin: (payload: { email: string; password: string }) =>
    apiClient<{ message: string; admin: any }>("/admin/create-admin", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
