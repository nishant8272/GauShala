import { prisma } from "./prisma";

export async function seedPrismaData() {
  try {
    // 1. Seed admin & sample user
    await prisma.user.upsert({
      where: { id: "admin-1" },
      update: {},
      create: {
        id: "admin-1",
        username: "admin",
        password: "password123",
        role: "super_admin",
      },
    });

    await prisma.user.upsert({
      where: { id: "user-1" },
      update: {},
      create: {
        id: "user-1",
        username: "john_doe",
        password: "password123",
        role: "user",
      },
    });

    // 2. Seed verified doctors
    const doctorsData = [
      {
        id: "vet-1",
        profileId: "prof-1",
        userId: "user-vet-1",
        username: "dr_sandeep",
        name: "Dr. Sandeep Singh",
        specialization: "Senior Livestock & Surgery Specialist",
        qualification: "B.V.Sc & A.H, M.V.Sc (Veterinary Surgery)",
        experienceYears: 14,
        consultationFee: 350.0,
        languages: ["English", "Hindi", "Punjabi"],
        bio: "Specializing in large animal surgery, cattle fertility, mastitis prevention, and 24/7 mobile emergency response.",
        location: "Kisan Care Vet Clinic, Ludhiana",
        avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop",
        rating: 4.9,
        reviewsCount: 128,
        nextAvailable: "Today 4:00 PM",
      },
      {
        id: "vet-2",
        profileId: "prof-2",
        userId: "user-vet-2",
        username: "dr_priya",
        name: "Dr. Priya Sharma",
        specialization: "Veterinary Cattle Health & Nutritionist",
        qualification: "B.V.Sc & A.H, Ph.D in Animal Nutrition",
        experienceYears: 9,
        consultationFee: 300.0,
        languages: ["English", "Hindi"],
        bio: "Specialist in cattle feed optimization, milk yield enhancement, metabolic disease control, and teleconsultations.",
        location: "Gaushala Care Center, Karnal",
        avatarUrl: "https://images.unsplash.com/photo-1594824813566-88855ce75907?q=80&w=800&auto=format&fit=crop",
        rating: 4.8,
        reviewsCount: 95,
        nextAvailable: "Tomorrow 10:00 AM",
      },
      {
        id: "vet-3",
        profileId: "prof-3",
        userId: "user-vet-3",
        username: "dr_rajesh",
        name: "Dr. Rajesh Kumar",
        specialization: "Bovine Fertility & Artificial Insemination",
        qualification: "M.V.Sc (Theriogenology)",
        experienceYears: 11,
        consultationFee: 400.0,
        languages: ["English", "Hindi", "Punjabi"],
        bio: "Expert in cattle breeding, high-yield bovine genetics, pregnancy diagnosis, and reproductive health.",
        location: "Regional Bovine Health Center, Amritsar",
        avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=800&auto=format&fit=crop",
        rating: 4.75,
        reviewsCount: 84,
        nextAvailable: "Today 6:00 PM",
      },
      {
        id: "vet-4",
        profileId: "prof-4",
        userId: "user-vet-4",
        username: "dr_ananya",
        name: "Dr. Ananya Verma",
        specialization: "Epidemic Diagnostics & Vaccine Specialist",
        qualification: "B.V.Sc & A.H, Diploma in Disease Surveillance",
        experienceYears: 8,
        consultationFee: 350.0,
        languages: ["English", "Hindi", "Gujarati"],
        bio: "Expert in viral epidemic control (Lumpy Skin Disease, FMD), herd vaccination programs, and early disease detection.",
        location: "Livestock Diagnostics Center, Patiala",
        avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop",
        rating: 4.85,
        reviewsCount: 62,
        nextAvailable: "Today 3:00 PM",
      },
    ];

    for (const doc of doctorsData) {
      // Create user account for doctor
      await prisma.user.upsert({
        where: { id: doc.userId },
        update: {},
        create: {
          id: doc.userId,
          username: doc.username,
          password: "password123",
          role: "doctor",
        },
      });

      // Create doctor profile
      await prisma.doctorProfile.upsert({
        where: { id: doc.profileId },
        update: {},
        create: {
          id: doc.profileId,
          userId: doc.userId,
          licenseNumber: `VET-LIC-${doc.id.toUpperCase()}`,
          specialization: doc.specialization,
          qualification: doc.qualification,
          experienceYears: doc.experienceYears,
          consultationFee: doc.consultationFee,
          status: "approved",
          isAvailable: true,
          rating: 0,
          totalConsultations: 0,
          totalEarnings: 0,
          languages: doc.languages,
          bio: doc.bio,
        },
      });

      // Create public doctor record
      await prisma.doctor.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          doctorProfileId: doc.profileId,
          userId: doc.userId,
          name: doc.name,
          specialization: doc.specialization,
          qualification: doc.qualification,
          experienceYears: doc.experienceYears,
          consultationFee: doc.consultationFee,
          isAvailable: true,
          languages: doc.languages,
          bio: doc.bio,
          avatarUrl: doc.avatarUrl,
          rating: 0,
          nextAvailable: doc.nextAvailable,
        },
      });
    }

    // Ensure no fake seeded appointment exists in database
    await prisma.appointment.deleteMany({
      where: { id: "appt-seed-1" },
    }).catch(() => null);

    console.log("✅ Prisma database ready (no fake appointments or seeded stats)!");
  } catch (error) {
    console.error("⚠️ Failed to seed Prisma database:", error);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("seed-prisma.ts")) {
  seedPrismaData().then(() => prisma.$disconnect());
}
