import type { DoctorProfile, DoctorDocument, ProfileStatus, DocType } from "../../doctor/types/doctor.types";

export interface AdminDoctorListItem {
  profile_id: string;
  user_id: string;
  status: ProfileStatus;
  license_number: string;
  specialization: string;
  doctor_name: string;
  doctor_email: string;
  uploaded_documents_count: number;
  is_ready_for_review: boolean;
}

export interface AdminDoctorDetail {
  profile: DoctorProfile;
  documents: DoctorDocument[];
  missingDocuments: Array<{ type: DocType; label: string; description: string }>;
  canApprove: boolean;
}
