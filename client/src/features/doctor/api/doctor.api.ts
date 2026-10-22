import { apiClient } from "@/lib/api-client";
import type { DoctorProfile, DoctorDocument, Appointment, DocType } from "../types/doctor.types";

export const doctorApi = {
  onboard: (payload: any) =>
    apiClient<{ profile: DoctorProfile }>("/doctor/onboard", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getProfile: (userId?: string) =>
    apiClient<DoctorProfile & { documents: DoctorDocument[]; missingDocuments: any[]; isKycComplete: boolean }>(
      `/doctor/me${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`
    ),

  uploadDocument: (documentType: DocType, fileData: { fileName: string; mimeType: string; fileBase64: string }) =>
    apiClient<DoctorDocument>("/doctor/documents", {
      method: "POST",
      body: JSON.stringify({
        documentType,
        ...fileData,
      }),
    }),

  getDocuments: (userId?: string) =>
    apiClient<{
      documents: DoctorDocument[];
      required: { type: DocType; label: string; description: string }[];
      missing: { type: DocType; label: string; description: string }[];
      isComplete: boolean;
    }>(`/doctor/documents${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`),

  deleteDocument: (documentType: DocType) =>
    apiClient<{ success: boolean }>(`/doctor/documents/${documentType}`, {
      method: "DELETE",
    }),

  completeOnboarding: () =>
    apiClient<{ message: string; profile: DoctorProfile }>("/doctor/complete-onboarding", {
      method: "POST",
    }),

  toggleAvailability: (isAvailable: boolean) =>
    apiClient<{ isAvailable: boolean }>("/doctor/me/availability", {
      method: "PATCH",
      body: JSON.stringify({ isAvailable }),
    }),

  getAppointments: (doctorId?: string) =>
    apiClient<Appointment[]>(`/doctor/appointments${doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : ""}`),

  updateAppointmentStatus: (id: string, status: "confirmed" | "cancelled" | "completed", prescription?: string) =>
    apiClient<Appointment>(`/doctor/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, prescription }),
    }),

  createMembershipOrder: () =>
    apiClient<{
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      feeInRupees: number;
      isSimulation: boolean;
    }>("/doctor/membership/create-order", {
      method: "POST",
    }),

  verifyMembership: (payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) =>
    apiClient<{
      success: boolean;
      message: string;
      profile: DoctorProfile;
    }>("/doctor/membership/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

