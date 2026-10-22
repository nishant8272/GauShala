import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { 
  Calendar, Clock, MapPin, User, Stethoscope, Phone, ShieldCheck, 
  RefreshCw, CheckCircle2, AlertCircle, XCircle, PlusCircle, ArrowLeft,
  CreditCard, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { teleconsultApi } from "@/features/teleconsult/api/teleconsult.api";
import { openRazorpayCheckout } from "@/lib/razorpay";

export interface UserAppointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialization?: string;
  scheduledAt: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  consultationType: "clinic_visit" | "home_visit" | "chat" | string;
  symptoms?: string;
  fee?: string | number;
  paymentStatus?: "unpaid" | "paid" | "refunded";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  doctorPhone?: string;
  doctorLocation?: string;
}

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<UserAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history" | "all">("upcoming");
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await teleconsultApi.getUserAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Could not fetch appointments from database:", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handlePayAppointment = async (appt: UserAppointment) => {
    setPayingId(appt.id);
    try {
      // 1. Generate Razorpay order for this appointment
      const order = await teleconsultApi.createPaymentOrder(appt.id);

      // 2. Open Razorpay Checkout modal
      const payRes = await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        name: `Consultation with ${appt.doctorName || "Doctor"}`,
        description: `Consultation Fee Payment`,
        prefill: {
          name: appt.patientName,
        },
        isSimulation: order.isSimulation,
      });

      // 3. Cryptographically verify signature on server
      await teleconsultApi.verifyPayment({
        appointmentId: appt.id,
        razorpayOrderId: payRes.razorpay_order_id,
        razorpayPaymentId: payRes.razorpay_payment_id,
        razorpaySignature: payRes.razorpay_signature,
      });

      // 4. Update state to paid & confirmed
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appt.id
            ? { ...a, paymentStatus: "paid", status: "confirmed" }
            : a
        )
      );
    } catch (err: any) {
      if (err.message !== "Payment cancelled by user") {
        alert(`Payment error: ${err.message || "Failed to process payment"}`);
      }
    } finally {
      setPayingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await teleconsultApi.cancelAppointment(id);
    } catch (err) {
      console.error("Failed to cancel appointment on server", err);
    }
    setAppointments((prev) =>
      prev.map((appt) => (appt.id === id ? { ...appt, status: "cancelled" } : appt))
    );
  };

  const isUpcoming = (appt: UserAppointment) => {
    const apptDate = new Date(appt.scheduledAt).getTime();
    const now = Date.now();
    return (apptDate >= now || appt.status === "pending" || appt.status === "confirmed") && appt.status !== "cancelled" && appt.status !== "completed";
  };

  const filteredAppointments = appointments.filter((appt) => {
    if (activeTab === "upcoming") return isUpcoming(appt);
    if (activeTab === "history") return !isUpcoming(appt);
    return true;
  });

  const upcomingCount = appointments.filter(isUpcoming).length;
  const historyCount = appointments.length - upcomingCount;

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      <Navbar />
      <main className="pt-20 sm:pt-24 pb-16 container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-2 sm:mb-3">
                <Calendar className="w-4 h-4" /> MY SCHEDULED APPOINTMENTS
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground">My Vet Visits & Consultations</h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                Track your upcoming doctor appointments, clinic visits, home visits, and medical consultation history.
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link href="/features/find-vet" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md flex items-center justify-center gap-2">
                  <PlusCircle className="w-4 h-4" /> Schedule New Visit
                </Button>
              </Link>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between bg-card p-1 sm:p-1.5 rounded-2xl border border-border/80 shadow-sm w-full max-w-md">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "upcoming"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Upcoming</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "upcoming" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                {upcomingCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>History</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "history" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                {historyCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>All ({appointments.length})</span>
            </button>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span className="font-semibold text-sm">Loading your appointments...</span>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <Card className="border-border/80 shadow-md p-8 sm:p-12 text-center bg-card rounded-3xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">No {activeTab} appointments found</h3>
              <p className="text-muted-foreground text-xs max-w-md mx-auto mb-6">
                {activeTab === "upcoming"
                  ? "You don't have any upcoming vet appointments scheduled. Book a visit with a verified veterinarian today."
                  : "No past appointment history available."}
              </p>
              <Link href="/features/find-vet">
                <Button className="rounded-xl font-bold bg-primary text-primary-foreground text-xs sm:text-sm">
                  Book Doctor Visit Now →
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appt) => {
                const isConfirmed = appt.status === "confirmed";
                const isPending = appt.status === "pending";
                const isCompleted = appt.status === "completed";
                const isCancelled = appt.status === "cancelled";

                return (
                  <Card 
                    key={appt.id} 
                    className="border-border/80 shadow-md hover:shadow-lg transition-all bg-card rounded-2xl sm:rounded-3xl overflow-hidden"
                  >
                    <CardContent className="p-4 sm:p-6 md:p-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-border">
                        {/* Doctor info */}
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg sm:text-xl border border-primary/20 shrink-0">
                            <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                              <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Verified
                              </span>
                              <span className="text-[10px] sm:text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                                {appt.consultationType === "clinic_visit" 
                                  ? "🏥 Clinic Visit" 
                                  : appt.consultationType === "home_visit" 
                                  ? "🏡 Home Visit" 
                                  : appt.consultationType}
                              </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-serif font-bold text-foreground">
                              {(appt as any).doctor?.name || appt.doctorName || "Dr. Sandeep Singh"}
                            </h3>
                            <p className="text-xs font-semibold text-primary">
                              {(appt as any).doctor?.specialization || appt.doctorSpecialization || "Senior Veterinary Specialist"}
                            </p>
                            {((appt as any).doctor?.location || appt.doctorLocation) && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary shrink-0" /> <span className="truncate max-w-[220px] sm:max-w-none">{(appt as any).doctor?.location || appt.doctorLocation}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status & Fee Badge */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                          <div className="text-left md:text-right">
                            <span className="text-[11px] sm:text-xs text-muted-foreground block font-medium">Consultation Fee</span>
                            <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{appt.fee || 350}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {appt.paymentStatus === "paid" ? (
                              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-xs">
                                <CheckCircle2 className="w-3 h-3" /> Paid (Razorpay)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Unpaid
                              </span>
                            )}

                            {isConfirmed && (
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Confirmed
                              </span>
                            )}
                            {isPending && (
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Pending Visit
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Completed
                              </span>
                            )}
                            {isCancelled && (
                              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Cancelled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Appointment Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-4 sm:my-6 p-3 sm:p-4 bg-muted/40 rounded-2xl border border-border">
                        <div className="space-y-1.5 sm:space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-bold text-foreground truncate">
                              {new Date(appt.scheduledAt).toLocaleDateString("en-IN", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                            <span className="text-muted-foreground">Time:</span>
                            <span className="font-bold text-foreground">
                              {new Date(appt.scheduledAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 sm:space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                            <span className="text-muted-foreground">Patient / Animal:</span>
                            <span className="font-bold text-foreground truncate">{appt.patientName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Symptoms */}
                      {appt.symptoms && (
                        <div className="mb-4 sm:mb-6 p-3 bg-background rounded-xl border border-border text-xs">
                          <span className="font-bold text-primary block mb-1">Cattle Symptoms / Problem Details:</span>
                          <p className="text-muted-foreground leading-relaxed">{appt.symptoms}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <a href={`tel:${(appt as any).doctor?.phone || appt.doctorPhone || "+919876543210"}`} className="w-full sm:w-auto">
                            <Button 
                              variant="outline" 
                              className="w-full sm:w-auto rounded-xl text-xs font-bold border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <Phone className="w-3.5 h-3.5 mr-1.5" /> Call Vet Clinic
                            </Button>
                          </a>

                          {appt.paymentStatus !== "paid" && appt.status !== "cancelled" && (
                            <Button
                              onClick={() => handlePayAppointment(appt)}
                              disabled={payingId === appt.id}
                              className="w-full sm:w-auto rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-1.5"
                            >
                              {payingId === appt.id ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing Payment...
                                </>
                              ) : (
                                <>
                                  <CreditCard className="w-3.5 h-3.5" /> Pay Now (₹{appt.fee || 350}) →
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {(isPending || isConfirmed) && (
                          <Button 
                            variant="ghost" 
                            onClick={() => handleCancel(appt.id)}
                            className="w-full sm:w-auto rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            Cancel Appointment
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
