import { doctorRepository, DoctorRepository } from "../repositories/doctor.repository";
import { userRepository, UserRepository } from "../repositories/user.repository";
import { REQUIRED_DOCUMENTS } from "./doctor.service";
import { AppError } from "../middleware/error.middleware";

export class AdminService {
  constructor(
    private doctorRepo: DoctorRepository = doctorRepository,
    private userRepo: UserRepository = userRepository,
  ) {}

  async listDoctors(status?: string) {
    const profiles = await this.doctorRepo.listDoctors(status);
    return profiles.map((p: any) => ({
      id: p.id,
      profile_id: p.id,
      user_id: p.userId,
      status: p.status,
      license_number: p.licenseNumber || "—",
      licenseNumber: p.licenseNumber || "—",
      specialization: p.specialization || "General Veterinarian",
      qualification: p.qualification || "",
      doctor_name: p.user?.username ? `Dr. ${p.user.username}` : p.qualification || "Dr. Specialist",
      doctorName: p.user?.username ? `Dr. ${p.user.username}` : p.qualification || "Dr. Specialist",
      doctor_email: p.user?.username ? `${p.user.username}@medsevasetu.in` : "",
      uploaded_documents_count: p.documents?.length || 0,
      is_ready_for_review: (p.documents?.length || 0) >= 4,
      createdAt: p.createdAt,
    }));
  }

  async getDoctorDetail(profileId: string) {
    const profile = await this.doctorRepo.findProfileById(profileId);
    if (!profile) {
      throw new AppError("Doctor profile not found", 404);
    }

    const documents = await this.doctorRepo.findDocumentsByProfileId(profile.id);
    const uploadedTypes = new Set(documents.map((d: any) => d.documentType));
    const missingDocuments = REQUIRED_DOCUMENTS.filter((req) => !uploadedTypes.has(req.type));

    return {
      profile,
      documents,
      missingDocuments,
      canApprove: missingDocuments.length === 0,
    };
  }

  async getDocument(profileId: string, docType: string) {
    const profile = await this.doctorRepo.findProfileById(profileId);
    const targetId = profile ? profile.id : profileId;
    const documents = await this.doctorRepo.findDocumentsByProfileId(targetId);
    return documents.find((d: any) => d.documentType === docType);
  }

  async approveDoctor(profileId: string) {
    const profile = await this.doctorRepo.findProfileById(profileId);
    if (!profile) {
      throw new AppError("Doctor profile not found", 404);
    }

    const approvedProfile = await this.doctorRepo.approveDoctor(profile.id);
    await this.userRepo.updateUserRole(profile.userId, "doctor");
    return approvedProfile;
  }

  async rejectDoctor(profileId: string, reason: string) {
    const profile = await this.doctorRepo.findProfileById(profileId);
    if (!profile) {
      throw new AppError("Doctor profile not found", 404);
    }

    return this.doctorRepo.rejectDoctor(profile.id, reason || "Documents failed verification");
  }

  async createAdmin(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await this.userRepo.findByUsername(cleanEmail);
    if (existing) {
      throw new AppError("An account with this Gmail / Email address already exists.", 409);
    }

    const newAdmin = await this.userRepo.create({
      username: cleanEmail,
      password,
      role: "super_admin",
    });

    return {
      id: newAdmin.id,
      username: newAdmin.username,
      role: newAdmin.role,
    };
  }
}

export const adminService = new AdminService();
