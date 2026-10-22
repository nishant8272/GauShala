export interface PublicDoctor {
  id: string;
  name: string;
  specialization: string;
  qualification?: string | null;
  experienceYears: number;
  consultationFee: number;
  isAvailable: boolean;
  languages?: string[];
  bio?: string | null;
  avatarUrl?: string | null;
  rating: number;
  nextAvailable?: string;
}

export interface BookingPayload {
  doctorId: string;
  patientName?: string;
  scheduledAt: string;
  consultationType: "clinic_visit" | "home_visit" | "chat";
  symptoms?: string;
  fee?: number;
}
