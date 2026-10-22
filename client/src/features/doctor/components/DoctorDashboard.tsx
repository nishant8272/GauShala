import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { doctorApi } from "../api/doctor.api";
import { DoctorStatusBanner } from "./DoctorStatusBanner";
import { openRazorpayCheckout } from "@/lib/razorpay";
import type { DoctorProfile, Appointment } from "../types/doctor.types";
import { 
  ArrowLeft, Stethoscope, RefreshCw, BrainCircuit, Activity, 
  Video, CheckCircle, XCircle, Calendar, UserCheck, Sparkles,
  ShieldCheck, CreditCard, Lock, AlertTriangle, Clock
} from "lucide-react";

export function DoctorDashboard() {
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [payingSubscription, setPayingSubscription] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);

  const isSubscribed =
    profile?.subscriptionStatus === "active" &&
    (!profile?.subscriptionExpiresAt || new Date(profile.subscriptionExpiresAt) > new Date());

  const loadDashboard = async () => {
    try {
      const profileData = await doctorApi.getProfile();
      if (profileData) {
        setProfile(profileData);
        // Fetch real doctor appointments booked by farmers (no fake seed data)
        const appts = await doctorApi.getAppointments();
        setAppointments(Array.isArray(appts) ? appts : []);
      }
    } catch (err: any) {
      console.warn("Could not fetch doctor profile:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handlePaySubscription = async () => {
    setPayingSubscription(true);
    setSubscriptionMessage(null);

    try {
      // 1. Create locked ₹100 Razorpay order on backend
      const order = await doctorApi.createMembershipOrder();

      // 2. Open Razorpay Checkout modal
      const paymentResponse = await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        name: "MedSevaSetu Doctor Platform",
        description: "1-Year Doctor Platform License (₹100/yr)",
        isSimulation: order.isSimulation,
      });

      // 3. Cryptographically verify signature on backend
      const verifyResult = await doctorApi.verifyMembership({
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      if (verifyResult.success) {
        setSubscriptionMessage("🎉 1-Year Doctor Platform License Activated Successfully!");
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                subscriptionStatus: "active",
                isAvailable: true,
                subscriptionExpiresAt: verifyResult.profile.subscriptionExpiresAt,
              }
            : null
        );
        loadDashboard();
      }
    } catch (err: any) {
      if (err.message !== "Payment cancelled by user") {
        setSubscriptionMessage(`Payment notice: ${err.message || "Failed to process payment."}`);
      }
    } finally {
      setPayingSubscription(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;

    if (profile.status !== "approved") {
      setSubscriptionMessage("⚠️ KYC Verification Required: Your medical documents must be verified and approved by Super Admin before going online.");
      return;
    }

    if (!isSubscribed) {
      setSubscriptionMessage("⚠️ Platform license required: Please pay ₹100 for your 1-year doctor license to go online.");
      handlePaySubscription();
      return;
    }

    setToggling(true);
    try {
      await doctorApi.toggleAvailability(!profile.isAvailable);
      setProfile({ ...profile, isAvailable: !profile.isAvailable });
    } catch (err: any) {
      setSubscriptionMessage(err.message || "Failed to update availability");
    } finally {
      setToggling(false);
    }
  };

  const handleUpdateAppt = async (id: string, status: "confirmed" | "cancelled") => {
    try {
      await doctorApi.updateAppointmentStatus(id, status);
    } catch (err) {
      console.error("Failed to update status on server", err);
    }
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span>Loading Doctor Workspace...</span>
        </div>
      </div>
    );
  }

  const isApproved = profile?.status === "approved";

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Nav */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition bg-card px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-border shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Site</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/features/prediction")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-primary/30 transition shadow-sm"
            >
              <BrainCircuit className="w-3.5 h-3.5" /> ML Model
            </button>
            <Link
              href="/doctor/onboard"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground bg-card px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-border shadow-sm transition"
            >
              📄 KYC
            </Link>
          </div>
        </div>

        {/* Doctor Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-border shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border border-primary/20 shrink-0">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full mb-1">
                <UserCheck className="w-3.5 h-3.5" /> Doctor Workspace
              </div>
              <h1 className="text-2xl font-serif font-bold text-foreground">
                {(profile as any)?.user?.username ? `Dr. ${(profile as any).user.username}` : profile?.qualification || "Veterinary Doctor"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{profile?.specialization || "General Veterinarian"}</span>
                {profile?.licenseNumber && (
                  <> · License: <span className="font-mono text-primary">{profile.licenseNumber}</span></>
                )}
              </p>
            </div>
          </div>

          {profile && (
            <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-2.5 rounded-2xl border border-border">
              {profile.status !== "approved" ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>KYC Under Review</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-foreground pl-2 flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${profile.isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  {profile.isAvailable ? "Available for Visits" : "Offline"}
                </span>
              )}

              <button
                onClick={handleToggleAvailability}
                disabled={toggling || payingSubscription || profile.status !== "approved"}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition ${
                  profile.isAvailable
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : profile.status !== "approved"
                    ? "bg-slate-400 cursor-not-allowed opacity-75"
                    : isSubscribed
                    ? "bg-slate-700 hover:bg-slate-800"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {toggling
                  ? "Saving..."
                  : profile.isAvailable
                  ? "Set Offline"
                  : profile.status !== "approved"
                  ? "Awaiting KYC Approval"
                  : isSubscribed
                  ? "Set Available"
                  : "Pay ₹100 to Go Live"}
              </button>
            </div>
          )}
        </div>

        {/* 1-Year Doctor Platform License Status / Payment Banner */}
        {subscriptionMessage && (
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 text-xs font-semibold text-foreground flex items-center justify-between gap-3 shadow-sm">
            <span>{subscriptionMessage}</span>
            <button onClick={() => setSubscriptionMessage(null)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
        )}

        {!isSubscribed ? (
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Doctor License Required
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Activate 1-Year Full Platform Access · ₹100 / Year
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                  To accept farmer appointment requests, toggle your live clinic/farm availability, and consult patients, activate your annual verified veterinary license.
                </p>
              </div>
            </div>
            <button
              onClick={handlePaySubscription}
              disabled={payingSubscription}
              className="w-full md:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {payingSubscription ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Pay ₹100 & Activate (1 Year) →
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  1-Year Platform License Active ✓
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Valid until {profile?.subscriptionExpiresAt ? new Date(profile.subscriptionExpiresAt).toLocaleDateString() : "1 Year from activation"} · Full doctor workspace enabled
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase bg-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">
              ₹100 Paid · Verified
            </span>
          </div>
        )}

        {/* Feature Highlight: Disease ML Model Link for Vets */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-primary/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md">
              <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                AI Clinical Chatbot Assistant for Vets <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Consult real-time clinical guidance, differential diagnosis assistance, and livestock care protocol recommendations.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/features/chatbot")}
            className="w-full md:w-auto px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition shadow-md flex items-center justify-center cursor-pointer"
          >
            Launch AI Assistant →
          </button>
        </div>

        {/* Status Banner */}
        {profile && (
          <DoctorStatusBanner
            status={profile.status}
            rejectionReason={profile.rejectionReason}
            onEditKyc={() => navigate("/doctor/onboard")}
          />
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Consultations</p>
            <p className="text-2xl font-bold text-foreground mt-1">{profile?.totalConsultations}</p>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Earnings</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{profile?.totalEarnings}</p>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Consultation Fee</p>
            <p className="text-2xl font-bold text-foreground mt-1">₹{profile?.consultationFee}</p>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Farmer Rating</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">★ {profile?.rating || "5.0"}</p>
          </div>
        </div>

        {/* Appointment List */}
        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Upcoming Farmer Appointments</h3>
              <p className="text-xs text-muted-foreground">Manage active clinic visits and home/farm visit requests from farmers.</p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {appointments.length} Appointments
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-border rounded-2xl bg-muted/20 space-y-2">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <p className="text-sm font-semibold text-foreground">No Upcoming Appointments</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {profile?.status !== "approved" || !isSubscribed
                  ? "Complete your KYC verification and ₹100 platform license to start receiving appointment bookings from farmers."
                  : "You are online and ready! Farmer appointment bookings will appear here in real time."}
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-2xl gap-4 bg-muted/30 hover:bg-muted/60 transition"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {appt.patientName || (appt as any).patient?.username || "Farmer / Patient"}
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase">
                        {appt.consultationType === "clinic_visit" ? "🏥 Clinic Visit" : appt.consultationType === "home_visit" ? "🏡 Home / Farm Visit" : appt.consultationType}
                      </span>
                      {appt.paymentStatus === "paid" ? (
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-xs">
                          <CheckCircle className="w-3 h-3" /> PAID ₹{appt.fee}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Unpaid (₹{appt.fee})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Scheduled: {new Date(appt.scheduledAt).toLocaleString()} · Fee: ₹{appt.fee}
                    </p>
                    {appt.symptoms && (
                      <p className="text-xs text-foreground/90 mt-1 bg-background p-2 rounded-xl border border-border/50">
                        <span className="font-bold text-primary">Symptoms:</span> {appt.symptoms}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                    {appt.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleUpdateAppt(appt.id, "confirmed")}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                        >
                          Confirm Visit
                        </button>
                        <button
                          onClick={() => handleUpdateAppt(appt.id, "cancelled")}
                          className="px-3.5 py-1.5 border border-border text-muted-foreground hover:bg-muted rounded-xl text-xs font-bold transition"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {appt.status === "confirmed" && (
                      <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500" /> Visit Confirmed
                      </span>
                    )}

                    <span className="text-xs font-bold text-muted-foreground capitalize px-2.5 py-1 bg-muted rounded-lg border border-border">
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
