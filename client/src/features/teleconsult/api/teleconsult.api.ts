import { apiClient } from "@/lib/api-client";
import type { PublicDoctor } from "../types/teleconsult.types";

export const teleconsultApi = {
  getDoctors: (specialization?: string, search?: string) => {
    const params = new URLSearchParams();
    if (specialization) params.append("specialization", specialization);
    if (search) params.append("search", search);
    const queryString = params.toString();
    return apiClient<PublicDoctor[]>(`/teleconsult/doctors${queryString ? `?${queryString}` : ""}`);
  },

  getDoctorById: (id: string) =>
    apiClient<PublicDoctor>(`/teleconsult/doctors/${id}`),

  bookAppointment: (data: {
    doctorId: string;
    patientName?: string;
    scheduledAt?: string;
    consultationType?: string;
    symptoms?: string;
    fee?: number;
  }) =>
    apiClient<{ message: string; appointment: any; paymentOrder?: any }>("/teleconsult/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createPaymentOrder: (appointmentId: string) =>
    apiClient<{
      appointmentId: string;
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      feeInRupees: number;
      isSimulation: boolean;
    }>(`/teleconsult/appointments/${appointmentId}/pay-order`, {
      method: "POST",
    }),

  verifyPayment: (payload: {
    appointmentId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) =>
    apiClient<{ message: string; success: boolean; appointment: any }>(
      "/teleconsult/appointments/verify-payment",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),

  getUserAppointments: () =>
    apiClient<any[]>("/teleconsult/appointments/my"),

  cancelAppointment: (id: string) =>
    apiClient<{ message: string; appointment: any }>(`/teleconsult/appointments/${id}/cancel`, {
      method: "PATCH",
    }),
};

