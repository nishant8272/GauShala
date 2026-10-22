import { prisma } from "../config/prisma";

export class AppointmentRepository {
  async create(data: any) {
    let patientId = data.patientId || "user-1";
    // Check if patient exists, if not fallback to user-1
    const patientExists = await prisma.user.findUnique({ where: { id: patientId } }).catch(() => null);
    if (!patientExists) {
      patientId = "user-1";
    }

    // Resolve doctorId: could be Doctor.id, DoctorProfile.id, or User.id
    let doctorId = data.doctorId;
    const doctorExists = await prisma.doctor.findUnique({ where: { id: doctorId } }).catch(() => null);
    if (!doctorExists) {
      const foundDoctor = await prisma.doctor.findFirst({
        where: {
          OR: [{ userId: doctorId }, { doctorProfileId: doctorId }],
        },
      }).catch(() => null);

      if (foundDoctor) {
        doctorId = foundDoctor.id;
      } else {
        const fallbackDoctor = await prisma.doctor.findFirst().catch(() => null);
        if (fallbackDoctor) doctorId = fallbackDoctor.id;
      }
    }

    const appt = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        scheduledAt: new Date(data.scheduledAt || Date.now()),
        status: data.status || "pending",
        consultationType: data.consultationType || "clinic_visit",
        symptoms: data.symptoms || (data.patientName ? `Patient: ${data.patientName}` : undefined),
        prescription: data.prescription,
        meetingLink: data.meetingLink,
        roomId: data.roomId,
        fee: data.fee || 500.0,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    return this.formatAppointment(appt, data.patientName);
  }

  private formatAppointment(appt: any, fallbackPatientName?: string) {
    return {
      ...appt,
      patientName: fallbackPatientName || appt.patient?.username || "Farmer / Patient",
      doctorName: appt.doctor?.name || "Dr. Specialist",
      doctorSpecialization: appt.doctor?.specialization || "Veterinary Specialist",
      doctorPhone: (appt.doctor as any)?.phone || "+919876543210",
      doctorLocation: (appt.doctor as any)?.location || "Kisan Care Clinic",
    };
  }

  async findByDoctorId(doctorIdentifier: string) {
    // doctorIdentifier can be Doctor.id, User.id, or DoctorProfile.id
    const doctorRecord = await prisma.doctor.findFirst({
      where: {
        OR: [
          { id: doctorIdentifier },
          { userId: doctorIdentifier },
          { doctorProfileId: doctorIdentifier },
        ],
      },
    }).catch(() => null);

    const targetDoctorId = doctorRecord?.id || doctorIdentifier;

    const list = await prisma.appointment.findMany({
      where: {
        OR: [
          { doctorId: targetDoctorId },
          { doctor: { userId: doctorIdentifier } },
        ],
      },
      include: { patient: true, doctor: true },
      orderBy: { scheduledAt: "asc" },
    });

    return list.map((appt: any) => this.formatAppointment(appt));
  }

  async findByPatientId(patientId: string) {
    const list = await prisma.appointment.findMany({
      where: { patientId },
      include: { doctor: true, patient: true },
      orderBy: { scheduledAt: "asc" },
    });

    return list.map((appt: any) => this.formatAppointment(appt));
  }

  async findById(id: string) {
    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: true },
    });
    if (!appt) return null;
    return this.formatAppointment(appt);
  }

  async updatePaymentOrder(id: string, razorpayOrderId: string) {
    return prisma.appointment.update({
      where: { id },
      data: { razorpayOrderId },
    });
  }

  async markAppointmentPaid(id: string, paymentId: string) {
    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true, patient: true },
    });

    if (!existing) {
      throw new Error(`Appointment with ID ${id} not found`);
    }

    const appt = await prisma.appointment.update({
      where: { id },
      data: {
        paymentStatus: "paid",
        status: "confirmed",
        razorpayPaymentId: paymentId,
        paidAt: new Date(),
        roomId: id,
        meetingLink: `/doctor/call/${id}`,
      },
      include: { patient: true, doctor: true },
    });

    // Credit doctor metrics: increment totalConsultations and add fee to totalEarnings if newly paid
    if (existing.paymentStatus !== "paid") {
      const profileId = appt.doctor?.doctorProfileId;
      const feeIncrement = Number(appt.fee) || 0;
      if (profileId) {
        await prisma.doctorProfile.update({
          where: { id: profileId },
          data: {
            totalConsultations: { increment: 1 },
            totalEarnings: { increment: feeIncrement },
          },
        }).catch((err: any) => {
          console.warn("⚠️ Could not update doctor profile earnings metric:", err.message);
        });
      } else if (appt.doctor?.userId) {
        await prisma.doctorProfile.updateMany({
          where: { userId: appt.doctor.userId },
          data: {
            totalConsultations: { increment: 1 },
            totalEarnings: { increment: feeIncrement },
          },
        }).catch((err: any) => {
          console.warn("⚠️ Could not update doctor profile earnings metric:", err.message);
        });
      }
    }

    return this.formatAppointment(appt);
  }

  async updateStatus(id: string, status: string, prescription?: string) {
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...(prescription ? { prescription } : {}),
        ...(status === "confirmed" ? { roomId: id, meetingLink: `/doctor/call/${id}` } : {}),
      },
      include: { patient: true, doctor: true },
    });
    return this.formatAppointment(updated);
  }
}

export const appointmentRepository = new AppointmentRepository();

