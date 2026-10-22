import { doctorRepository, DoctorRepository } from "../repositories/doctor.repository";
import { userRepository, UserRepository } from "../repositories/user.repository";
import { cloudinaryService, CloudinaryService } from "./cloudinary.service";
import { razorpayService, RazorpayService } from "./razorpay.service";
import { AppError } from "../middleware/error.middleware";

export const REQUIRED_DOCUMENTS = [
  { type: "medical_license", label: "Medical Practice License", description: "State Medical Council registration certificate" },
  { type: "medical_certificate", label: "Degree / Qualification Certificate", description: "MBBS / MD / MS or equivalent degree certificate" },
  { type: "id_proof", label: "Government ID Proof", description: "Aadhaar Card, Passport, or Voter ID" },
  { type: "profile_photo", label: "Doctor Profile Photo", description: "Professional headshot with white/plain background" },
];

export const ANNUAL_DOCTOR_LICENSE_FEE_INR = 100;
export const ANNUAL_DOCTOR_LICENSE_FEE_PAISE = 10000;

export class DoctorService {
  constructor(
    private doctorRepo: DoctorRepository = doctorRepository,
    private userRepo: UserRepository = userRepository,
    private cloudService: CloudinaryService = cloudinaryService,
    private rzpService: RazorpayService = razorpayService,
  ) {}

  async onboard(userId: string, data: any) {
    if (!userId) {
      throw new AppError("User ID is required for onboarding", 400);
    }
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError("User account not found", 404);
    }
    if (user.role === "user") {
      throw new AppError("Regular user accounts cannot register or practice as a doctor. Please sign up with a dedicated Doctor / Vet account.", 403);
    }
    const profile = await this.doctorRepo.createProfile(userId, data);
    return profile;
  }

  async getProfile(userId: string) {
    const profile = await this.doctorRepo.findProfileByUserId(userId);
    if (!profile) {
      throw new AppError("Doctor profile not found", 404);
    }

    const documents = await this.doctorRepo.findDocumentsByProfileId(profile.id);
    const uploadedTypes = new Set(documents.map((d: any) => d.documentType));
    const missingDocuments = REQUIRED_DOCUMENTS.filter((req) => !uploadedTypes.has(req.type));

    return {
      ...profile,
      documents,
      missingDocuments,
      isKycComplete: missingDocuments.length === 0,
    };
  }

  async uploadDocument(
    userId: string,
    docType: string,
    fileData: { fileName?: string; mimeType?: string; fileBase64?: string; fileUrl?: string }
  ) {
    let profile = await this.doctorRepo.findProfileByUserId(userId);
    if (!profile) {
      profile = await this.doctorRepo.createProfile(userId, {
        licenseNumber: "TEMP-LICENSE",
        specialization: "General Physician",
        qualification: "MBBS",
      });
    }

    if (!profile) {
      throw new AppError("Failed to create doctor profile", 500);
    }

    const fileName = fileData.fileName || `${docType}.pdf`;
    let fileUrl = fileData.fileUrl || `/uploads/doctors/${userId}/${fileName}`;
    let cloudinaryPublicId: string | undefined = undefined;

    // Upload to Cloudinary if Base64 content is provided, with graceful fallback to DB base64
    if (fileData.fileBase64) {
      try {
        const cloudRes = await this.cloudService.uploadDoctorKycDocument(
          userId,
          docType,
          fileData.fileBase64,
          fileName,
          fileData.mimeType || "application/pdf"
        );
        fileUrl = cloudRes.secureUrl;
        cloudinaryPublicId = cloudRes.publicId;
      } catch (cloudErr) {
        console.warn("⚠️ Cloudinary upload skipped or failed, storing base64 directly in database:", (cloudErr as any)?.message);
        fileUrl = fileData.fileUrl || `/uploads/doctors/${userId}/${fileName}`;
      }
    }

    const doc = await this.doctorRepo.saveDocument(profile.id, docType, {
      fileName,
      mimeType: fileData.mimeType || "application/pdf",
      fileUrl,
      dataBase64: fileData.fileBase64 || null,
      cloudinaryPublicId,
    });

    return doc;
  }

  async getDocuments(userId: string) {
    const profile = await this.doctorRepo.findProfileByUserId(userId);
    if (!profile) {
      return {
        documents: [],
        required: REQUIRED_DOCUMENTS,
        missing: REQUIRED_DOCUMENTS,
        isComplete: false,
      };
    }

    const documents = await this.doctorRepo.findDocumentsByProfileId(profile.id);
    const uploadedTypes = new Set(documents.map((d: any) => d.documentType));
    const missing = REQUIRED_DOCUMENTS.filter((req) => !uploadedTypes.has(req.type));

    return {
      documents,
      required: REQUIRED_DOCUMENTS,
      missing,
      isComplete: missing.length === 0,
    };
  }

  async deleteDocument(userId: string, docType: string) {
    const profile = await this.doctorRepo.findProfileByUserId(userId);
    if (!profile) {
      throw new AppError("Doctor profile not found", 404);
    }
    return this.doctorRepo.deleteDocument(profile.id, docType);
  }

  async completeOnboarding(userId: string) {
    const profile = await this.doctorRepo.findProfileByUserId(userId);
    if (!profile) {
      throw new AppError("Doctor profile not found", 404);
    }

    const documents = await this.doctorRepo.findDocumentsByProfileId(profile.id);
    if (documents.length === 0) {
      throw new AppError("Please upload at least your Medical License before submitting for review", 400);
    }

    return this.doctorRepo.completeOnboarding(profile.id);
  }

  async toggleAvailability(userId: string, isAvailable: boolean) {
    const profile = await this.doctorRepo.findProfileByUserId(userId);
    if (!profile) {
      throw new AppError("Doctor profile not found", 404);
    }

    if (isAvailable) {
      // 1. Enforce KYC Document Verification by Super Admin
      if (profile.status !== "approved") {
        throw new AppError(
          "Your medical credentials and KYC documents must be verified and approved by Super Admin before going online.",
          403
        );
      }

      // 2. Enforce active 1-year platform subscription payment
      const isSubscribed =
        profile.subscriptionStatus === "active" &&
        profile.subscriptionExpiresAt &&
        new Date(profile.subscriptionExpiresAt) > new Date();

      if (!isSubscribed) {
        throw new AppError(
          "Active 1-year doctor platform membership (₹100/yr) is required to become available for visits",
          403
        );
      }
    }

    return this.doctorRepo.updateAvailability(profile.id, isAvailable);
  }

  /**
   * Create an annual ₹100 platform subscription order.
   * Locked fee: 100 INR / 10,000 paise.
   */
  async createSubscriptionOrder(userId: string) {
    let profile = await this.doctorRepo.findProfileByUserId(userId);
    if (!profile) {
      profile = await this.doctorRepo.createProfile(userId, {
        licenseNumber: "TEMP-REG",
        specialization: "General Physician",
        qualification: "B.V.Sc / MBBS",
      });
    }

    const receipt = `doc_sub_${profile.id.slice(0, 8)}_${Date.now()}`;
    const order = await this.rzpService.createOrder({
      amountInPaise: ANNUAL_DOCTOR_LICENSE_FEE_PAISE,
      currency: "INR",
      receipt,
      notes: {
        userId,
        doctorProfileId: profile.id,
        plan: "1_year_doctor_platform_license",
      },
    });

    await this.doctorRepo.updateSubscriptionOrder(profile.id, order.orderId);

    return {
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
      feeInRupees: ANNUAL_DOCTOR_LICENSE_FEE_INR,
      isSimulation: order.isSimulation,
      profileId: profile.id,
    };
  }

  /**
   * Cryptographically verify payment and activate 1-year license.
   */
  async verifySubscription(
    userId: string,
    params: {
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    }
  ) {
    const razorpayOrderId = params.razorpayOrderId || params.razorpay_order_id;
    const razorpayPaymentId = params.razorpayPaymentId || params.razorpay_payment_id;
    const razorpaySignature = params.razorpaySignature || params.razorpay_signature;

    if (!razorpayPaymentId) {
      throw new AppError("Payment ID is required for subscription verification", 400);
    }

    const profile = await this.doctorRepo.findProfileByUserId(userId);
    if (!profile) {
      throw new AppError("Doctor profile not found", 404);
    }

    // Idempotent return if already active with this paymentId
    if (
      profile.subscriptionPaymentId === razorpayPaymentId &&
      profile.subscriptionStatus === "active"
    ) {
      return {
        success: true,
        message: "1-Year Doctor Platform License is already active!",
        profile,
      };
    }

    // Validate that order ID matches what was created for this doctor profile (only when both are present)
    if (profile.subscriptionOrderId && razorpayOrderId && profile.subscriptionOrderId !== razorpayOrderId) {
      throw new AppError("Order ID mismatch for doctor subscription", 400);
    }

    const effectiveOrderId = razorpayOrderId || profile.subscriptionOrderId || "";

    const isValid = this.rzpService.verifyPaymentSignature({
      orderId: effectiveOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature || "",
    });

    if (!isValid) {
      throw new AppError("Cryptographic payment verification failed. Unauthorized signature.", 400);
    }

    const updatedProfile = await this.doctorRepo.activateSubscription(profile.id, razorpayPaymentId, 365);

    return {
      success: true,
      message: "1-Year Doctor Platform License activated successfully!",
      profile: updatedProfile,
    };
  }
}

export const doctorService = new DoctorService();

