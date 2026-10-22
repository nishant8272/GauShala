import { prisma } from "../config/prisma";

export class DoctorRepository {
  async findProfileById(id: string) {
    if (!id || id === "undefined" || id === "null") return null;
    return prisma.doctorProfile.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      include: { documents: true, doctor: true, user: true },
    });
  }

  async findProfileByUserId(userId: string) {
    return prisma.doctorProfile.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
      include: { documents: true, doctor: true, user: true },
    });
  }

  async createProfile(userId: string, data: any) {
    return prisma.doctorProfile.upsert({
      where: { userId },
      create: {
        userId,
        licenseNumber: data.licenseNumber,
        specialization: data.specialization,
        qualification: data.qualification,
        experienceYears: Number(data.experienceYears) || 1,
        consultationFee: data.consultationFee || 500.0,
        hospitalAffiliation: data.hospitalAffiliation,
        languages: data.languages || ["English", "Hindi"],
        bio: data.bio,
        city: data.city,
        status: "pending",
        isAvailable: false,
        onboardingStep: 2,
      },
      update: {
        licenseNumber: data.licenseNumber,
        specialization: data.specialization,
        qualification: data.qualification,
        experienceYears: Number(data.experienceYears) || 1,
        consultationFee: data.consultationFee || 500.0,
        hospitalAffiliation: data.hospitalAffiliation,
        languages: data.languages || ["English", "Hindi"],
        bio: data.bio,
        city: data.city,
        onboardingStep: 2,
      },
      include: { documents: true, doctor: true, user: true },
    });
  }

  async saveDocument(profileId: string, docType: string, fileData: any) {
    // Clear previous document of this type to prevent stale duplicates
    await prisma.doctorDocument.deleteMany({
      where: { doctorProfileId: profileId, documentType: docType },
    }).catch(() => null);

    return prisma.doctorDocument.create({
      data: {
        doctorProfileId: profileId,
        documentType: docType,
        fileName: fileData.fileName || `${docType}.pdf`,
        mimeType: fileData.mimeType || "application/pdf",
        fileUrl: fileData.fileUrl || fileData.url || "",
        dataBase64: fileData.dataBase64,
      },
    });
  }

  async findDocumentsByProfileId(profileId: string) {
    return prisma.doctorDocument.findMany({
      where: { doctorProfileId: profileId },
    });
  }

  async deleteDocument(profileId: string, docType: string) {
    await prisma.doctorDocument.deleteMany({
      where: { doctorProfileId: profileId, documentType: docType },
    });
    return { success: true };
  }

  async completeOnboarding(profileId: string) {
    return prisma.doctorProfile.update({
      where: { id: profileId },
      data: { onboardingStep: 4, status: "pending" },
    });
  }

  async updateAvailability(profileId: string, isAvailable: boolean) {
    const updated = await prisma.doctorProfile.update({
      where: { id: profileId },
      data: { isAvailable },
    });
    await prisma.doctor.updateMany({
      where: { doctorProfileId: profileId },
      data: { isAvailable },
    });
    return updated;
  }

  async listDoctors(status?: string) {
    return prisma.doctorProfile.findMany({
      where: status ? { status } : undefined,
      include: { documents: true, user: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async approveDoctor(profileId: string) {
    const existing = await prisma.doctorProfile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });
    if (!existing) throw new Error("Doctor profile not found");

    const isSubscribed =
      existing.subscriptionStatus === "active" &&
      (!existing.subscriptionExpiresAt || new Date(existing.subscriptionExpiresAt) > new Date());

    const profile = await prisma.doctorProfile.update({
      where: { id: profileId },
      data: {
        status: "approved",
        isAvailable: isSubscribed, // Only available if license is already active
      },
      include: { user: true },
    });

    const existingDoctor = await prisma.doctor.findFirst({
      where: {
        OR: [{ doctorProfileId: profileId }, { userId: profile.userId }],
      },
    });

    if (existingDoctor) {
      await prisma.doctor.update({
        where: { id: existingDoctor.id },
        data: {
          doctorProfileId: profileId,
          isAvailable: isSubscribed,
          specialization: profile.specialization,
          qualification: profile.qualification,
          consultationFee: profile.consultationFee,
        },
      });
    } else {
      await prisma.doctor.create({
        data: {
          doctorProfileId: profileId,
          userId: profile.userId,
          name: profile.user?.username || "Dr. Specialist",
          specialization: profile.specialization,
          qualification: profile.qualification,
          experienceYears: profile.experienceYears,
          consultationFee: profile.consultationFee,
          languages: profile.languages,
          bio: profile.bio,
          isAvailable: isSubscribed,
        },
      });
    }

    return prisma.doctorProfile.findUnique({
      where: { id: profileId },
      include: { user: true, documents: true, doctor: true },
    });
  }

  async rejectDoctor(profileId: string, reason: string) {
    const profile = await prisma.doctorProfile.findFirst({
      where: { OR: [{ id: profileId }, { userId: profileId }] },
    });
    if (!profile) {
      throw new Error(`Doctor profile not found for identifier ${profileId}`);
    }

    await prisma.doctor.updateMany({
      where: {
        OR: [{ doctorProfileId: profile.id }, { userId: profile.userId }],
      },
      data: { isAvailable: false },
    });

    return prisma.doctorProfile.update({
      where: { id: profile.id },
      data: { status: "rejected", rejectionReason: reason, isAvailable: false },
    });
  }

  async updateSubscriptionOrder(profileId: string, orderId: string) {
    const profile = await prisma.doctorProfile.findFirst({
      where: { OR: [{ id: profileId }, { userId: profileId }] },
    });
    if (!profile) {
      throw new Error(`Doctor profile not found for identifier ${profileId}`);
    }

    return prisma.doctorProfile.update({
      where: { id: profile.id },
      data: {
        subscriptionOrderId: orderId,
      },
    });
  }

  async activateSubscription(profileId: string, paymentId: string, days: number = 365) {
    const existing = await prisma.doctorProfile.findFirst({
      where: { OR: [{ id: profileId }, { userId: profileId }] },
      include: { user: true },
    });

    if (!existing) {
      throw new Error(`Doctor profile not found for identifier ${profileId}`);
    }

    // Cumulative renewal: if already active in future, extend from current expiry date
    const currentExpiry = existing.subscriptionExpiresAt;
    const baseDate = currentExpiry && new Date(currentExpiry) > new Date()
      ? new Date(currentExpiry)
      : new Date();
    baseDate.setDate(baseDate.getDate() + days);

    // Doctor can only go live/available if their KYC documents have ALSO been approved!
    const isDocApproved = existing.status === "approved";

    await prisma.doctorProfile.update({
      where: { id: existing.id },
      data: {
        subscriptionStatus: "active",
        subscriptionExpiresAt: baseDate,
        subscriptionPaymentId: paymentId,
        subscribedAt: new Date(),
        isAvailable: isDocApproved,
        onboardingStep: 4,
      },
    });

    // Upsert Doctor record safely to prevent unique constraint collision on userId
    const existingDoctor = await prisma.doctor.findFirst({
      where: {
        OR: [{ doctorProfileId: existing.id }, { userId: existing.userId }],
      },
    });

    if (existingDoctor) {
      await prisma.doctor.update({
        where: { id: existingDoctor.id },
        data: {
          doctorProfileId: existing.id,
          isAvailable: isDocApproved,
          specialization: existing.specialization,
          qualification: existing.qualification,
          consultationFee: existing.consultationFee,
        },
      });
    } else {
      await prisma.doctor.create({
        data: {
          doctorProfileId: existing.id,
          userId: existing.userId,
          name: existing.user?.username || "Dr. Specialist",
          specialization: existing.specialization,
          qualification: existing.qualification,
          experienceYears: existing.experienceYears,
          consultationFee: existing.consultationFee,
          languages: existing.languages,
          bio: existing.bio,
          isAvailable: isDocApproved,
        },
      });
    }

    return prisma.doctorProfile.findUnique({
      where: { id: existing.id },
      include: { user: true, documents: true, doctor: true },
    });
  }


  async findPublicDoctors(specialization?: string) {
    return prisma.doctor.findMany({
      where: {
        isAvailable: true,
        ...(specialization && specialization !== "all"
          ? { specialization: { contains: specialization, mode: "insensitive" } }
          : {}),
      },
      orderBy: { rating: "desc" },
    });
  }

  async findPublicDoctorById(id: string) {
    return prisma.doctor.findUnique({
      where: { id },
    });
  }
}

export const doctorRepository = new DoctorRepository();
