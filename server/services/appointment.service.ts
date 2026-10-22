import { appointmentRepository, AppointmentRepository } from "../repositories/appointment.repository";
import { razorpayService, RazorpayService } from "./razorpay.service";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/error.middleware";

export class AppointmentService {
  constructor(
    private apptRepo: AppointmentRepository = appointmentRepository,
    private rzpService: RazorpayService = razorpayService
  ) {}

  async scheduleAppointment(data: {
    doctorId: string;
    patientId?: string;
    patientName?: string;
    scheduledAt?: string;
    consultationType?: string;
    symptoms?: string;
    fee?: number;
  }) {
    if (!data.doctorId) {
      throw new AppError("Doctor ID is required to schedule an appointment", 400);
    }

    // Server-side fee locking: fetch doctor's set fee from database
    let serverFee = 500;
    try {
      const doc = await prisma.doctor.findFirst({
        where: {
          OR: [
            { id: data.doctorId },
            { userId: data.doctorId },
            { doctorProfileId: data.doctorId },
          ],
        },
      });
      if (doc && doc.consultationFee) {
        serverFee = Number(doc.consultationFee);
      } else if (data.fee && data.fee > 0) {
        serverFee = Number(data.fee);
      }
    } catch {
      if (data.fee && data.fee > 0) serverFee = Number(data.fee);
    }

    const appointment = await this.apptRepo.create({
      ...data,
      fee: serverFee,
      status: "pending",
      paymentStatus: "unpaid",
    });

    // Create Razorpay order server-to-server for this consultation fee
    const receipt = `appt_${appointment.id.slice(0, 8)}_${Date.now()}`;
    const amountInPaise = Math.round(serverFee * 100);

    const rzpOrder = await this.rzpService.createOrder({
      amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        consultationType: appointment.consultationType,
      },
    });

    await this.apptRepo.updatePaymentOrder(appointment.id, rzpOrder.orderId);
    (appointment as any).razorpayOrderId = rzpOrder.orderId;

    return {
      appointment,
      paymentOrder: {
        orderId: rzpOrder.orderId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: rzpOrder.keyId,
        feeInRupees: serverFee,
        isSimulation: rzpOrder.isSimulation,
      },
    };
  }

  async createAppointmentPaymentOrder(appointmentId: string) {
    const appointment = await this.apptRepo.findById(appointmentId);
    if (!appointment) {
      throw new AppError("Appointment not found", 404);
    }

    if (appointment.paymentStatus === "paid") {
      throw new AppError("Appointment has already been paid and confirmed", 400);
    }

    const feeInRupees = Number(appointment.fee) || 500;
    const amountInPaise = Math.round(feeInRupees * 100);
    const receipt = `appt_retry_${appointment.id.slice(0, 8)}_${Date.now()}`;

    const rzpOrder = await this.rzpService.createOrder({
      amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
      },
    });

    await this.apptRepo.updatePaymentOrder(appointment.id, rzpOrder.orderId);

    return {
      appointmentId: appointment.id,
      orderId: rzpOrder.orderId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: rzpOrder.keyId,
      feeInRupees,
      isSimulation: rzpOrder.isSimulation,
    };
  }

  async verifyAppointmentPayment(params: {
    appointmentId?: string;
    appointment_id?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  }) {
    const appointmentId = params.appointmentId || params.appointment_id;
    const razorpayOrderId = params.razorpayOrderId || params.razorpay_order_id;
    const razorpayPaymentId = params.razorpayPaymentId || params.razorpay_payment_id;
    const razorpaySignature = params.razorpaySignature || params.razorpay_signature;

    if (!appointmentId) {
      throw new AppError("Appointment ID is required for payment verification", 400);
    }

    if (!razorpayPaymentId) {
      throw new AppError("Payment ID is required for verification", 400);
    }

    const appointment = await this.apptRepo.findById(appointmentId);
    if (!appointment) {
      throw new AppError("Appointment not found", 404);
    }

    // Idempotent return if already marked paid
    if (appointment.paymentStatus === "paid") {
      return {
        success: true,
        message: "Payment already verified! Appointment is confirmed.",
        appointment,
      };
    }

    // Order ID validation to prevent cross-order tampering (only when both are present)
    if (appointment.razorpayOrderId && razorpayOrderId && appointment.razorpayOrderId !== razorpayOrderId) {
      throw new AppError("Order ID mismatch for this appointment payment", 400);
    }

    const effectiveOrderId = razorpayOrderId || appointment.razorpayOrderId || "";

    const isValid = this.rzpService.verifyPaymentSignature({
      orderId: effectiveOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature || "",
    });

    if (!isValid) {
      throw new AppError("Cryptographic payment verification failed. Unauthorized signature.", 400);
    }

    const updated = await this.apptRepo.markAppointmentPaid(appointmentId, razorpayPaymentId);

    return {
      success: true,
      message: "Payment verified successfully! Appointment confirmed.",
      appointment: updated,
    };
  }

  async getDoctorAppointments(doctorId: string) {
    if (!doctorId) {
      throw new AppError("Doctor ID is required", 400);
    }
    return this.apptRepo.findByDoctorId(doctorId);
  }

  async getUserAppointments(patientId: string) {
    return this.apptRepo.findByPatientId(patientId || "user-1");
  }

  async updateAppointmentStatus(id: string, status: string, prescription?: string) {
    if (!id) {
      throw new AppError("Appointment ID is required", 400);
    }
    const updated = await this.apptRepo.updateStatus(id, status, prescription);
    if (!updated) {
      throw new AppError("Appointment not found", 404);
    }
    return updated;
  }
}

export const appointmentService = new AppointmentService();

