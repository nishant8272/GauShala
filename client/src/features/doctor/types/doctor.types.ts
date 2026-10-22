export type UserRole = "user" | "doctor" | "super_admin";
export type ProfileStatus = "pending" | "approved" | "rejected" | "suspended";
export type DocType = "medical_license" | "medical_certificate" | "id_proof" | "profile_photo";

export interface DoctorDocument {
  id: string;
  doctorProfileId: string;
  documentType: DocType;
  fileName: string;
  mimeType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  status: ProfileStatus;
  isAvailable: boolean;
  onboardingStep: number;
  licenseNumber: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  hospitalAffiliation?: string | null;
  languages: string[];
  bio?: string | null;
  city?: string | null;
  rating: number;
  totalConsultations: number;
  totalEarnings: number;
  rejectionReason?: string | null;
  subscriptionStatus?: "unpaid" | "active" | "expired";
  subscriptionExpiresAt?: string | null;
  subscriptionOrderId?: string | null;
  subscriptionPaymentId?: string | null;
  subscribedAt?: string | null;
  documents?: DoctorDocument[];
  missingDocuments?: Array<{ type: DocType; label: string; description: string }>;
  isKycComplete?: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  scheduledAt: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  consultationType: "clinic_visit" | "home_visit" | "chat";
  symptoms?: string | null;
  prescription?: string | null;
  meetingLink?: string | null;
  roomId?: string | null;
  fee: number;
  paymentStatus?: "unpaid" | "paid" | "refunded";
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  paidAt?: string | null;
}

