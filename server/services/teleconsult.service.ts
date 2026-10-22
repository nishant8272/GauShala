import { doctorRepository, DoctorRepository } from "../repositories/doctor.repository";
import { appointmentService, AppointmentService } from "./appointment.service";
import { AppError } from "../middleware/error.middleware";

export class TeleconsultService {
  constructor(
    private doctorRepo: DoctorRepository = doctorRepository,
    private apptService: AppointmentService = appointmentService
  ) {}

  async getPublicDoctors(specialization?: string, search?: string) {
    return this.doctorRepo.findPublicDoctors(specialization);
  }

  async getPublicDoctorById(id: string) {
    const doc = await this.doctorRepo.findPublicDoctorById(id);
    if (!doc) {
      throw new AppError("Doctor not found in database", 404);
    }
    return doc;
  }

  async scheduleAppointment(data: any) {
    return this.apptService.scheduleAppointment(data);
  }

  async createAppointmentPaymentOrder(appointmentId: string) {
    return this.apptService.createAppointmentPaymentOrder(appointmentId);
  }

  async verifyAppointmentPayment(data: {
    appointmentId?: string;
    appointment_id?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  }) {
    return this.apptService.verifyAppointmentPayment(data);
  }

  async getUserAppointments(patientId: string) {
    return this.apptService.getUserAppointments(patientId);
  }

  async cancelAppointment(id: string) {
    return this.apptService.updateAppointmentStatus(id, "cancelled");
  }
}

export const teleconsultService = new TeleconsultService();

