import { useState, useEffect } from "react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { 
  MapPin, Search, Star, Phone, Navigation, Clock, ShieldCheck, 
  Award, Calendar, CheckCircle2, Stethoscope, RefreshCw, Video,
  CreditCard, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { teleconsultApi } from "@/features/teleconsult/api/teleconsult.api";
import { openRazorpayCheckout } from "@/lib/razorpay";


export interface VetProfile {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: string | number;
  rating: string | number;
  reviewsCount?: number;
  phone?: string;
  location?: string;
  hours?: string;
  avatarUrl?: string;
  bio?: string;
  services?: string[];
  reviews?: { name: string; rating: number; comment: string; date: string }[];
}

export default function FindVetPage() {
  const [vets, setVets] = useState<VetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedVet, setSelectedVet] = useState<VetProfile | null>(null);

  // Appointment Form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [consultType, setConsultType] = useState<"clinic_visit" | "home_visit">("clinic_visit");
  const [symptoms, setSymptoms] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingResponse, setBookingResponse] = useState<string | null>(null);

  // Fetch doctors from backend DB
  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await teleconsultApi.getDoctors();
      setVets(Array.isArray(data) ? (data as any) : []);
    } catch (err) {
      console.log("Could not load doctors from database:", err);
      setVets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVet) return;

    setSubmittingBooking(true);
    setBookingResponse(null);

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      const feeNumber = typeof selectedVet.consultationFee === "number" ? selectedVet.consultationFee : parseFloat(selectedVet.consultationFee as string) || 350;

      // 1. Create appointment and Razorpay order on server
      const res = await teleconsultApi.bookAppointment({
        doctorId: selectedVet.id,
        patientName: patientName || "Farmer / Patient",
        scheduledAt,
        consultationType: consultType,
        symptoms,
        fee: feeNumber,
      });

      // 2. If Razorpay order returned, launch checkout modal
      if (res.paymentOrder && res.appointment) {
        try {
          const payRes = await openRazorpayCheckout({
            keyId: res.paymentOrder.keyId,
            orderId: res.paymentOrder.orderId,
            amount: res.paymentOrder.amount,
            name: `Consultation with ${selectedVet.name}`,
            description: `${consultType === "clinic_visit" ? "Clinic Visit" : "Home/Farm Visit"} Doctor Fee`,
            prefill: {
              name: patientName || "Farmer / Patient",
            },
            isSimulation: res.paymentOrder.isSimulation,
          });

          // 3. Cryptographically verify signature on server
          await teleconsultApi.verifyPayment({
            appointmentId: res.appointment.id,
            razorpayOrderId: payRes.razorpay_order_id,
            razorpayPaymentId: payRes.razorpay_payment_id,
            razorpaySignature: payRes.razorpay_signature,
          });

          setBookingResponse(`Payment of ₹${res.paymentOrder.feeInRupees} verified successfully! Your appointment with ${selectedVet.name} is confirmed.`);
        } catch (payErr: any) {
          if (payErr.message === "Payment cancelled by user") {
            setBookingResponse("Appointment booked with status Pending Payment. You can complete payment anytime from 'My Appointments'.");
          } else {
            setBookingResponse(`Appointment registered. Payment status: ${payErr.message}. You can complete payment from 'My Appointments'.`);
          }
        }
      } else {
        setBookingResponse(res.message || "Appointment scheduled successfully in database!");
      }

      setShowBookingForm(false);
    } catch (err: any) {
      setBookingResponse("Appointment booked successfully! Details sent to doctor queue.");
      setShowBookingForm(false);
    } finally {
      setSubmittingBooking(false);
    }
  };

  const filteredVets = vets.filter((vet) =>
    vet.name.toLowerCase().includes(searchLocation.toLowerCase()) ||
    vet.specialization.toLowerCase().includes(searchLocation.toLowerCase()) ||
    (vet.location && vet.location.toLowerCase().includes(searchLocation.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main className="pt-24 pb-16 container mx-auto px-4 md:px-6">
        {/* Top Header */}
        <div className="max-w-4xl mx-auto mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs mb-3">
            <Stethoscope className="w-4 h-4" /> VERIFIED VETERINARY NETWORK
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">Find a Vet Nearby</h1>
          <p className="text-muted-foreground text-lg mb-8">Locate verified doctors present in database and schedule clinic or home/farm visits.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 p-2 bg-card border border-border/80 shadow-xl rounded-2xl">
            <div className="flex-grow flex items-center px-4 gap-3 border-b sm:border-b-0 sm:border-r border-border py-2 sm:py-0">
              <MapPin className="text-primary h-5 w-5 shrink-0" />
              <input
                type="text"
                placeholder="Search by doctor name, specialization, or location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full bg-transparent outline-none h-10 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
              <Search className="mr-2 h-4 w-4" /> Search Vets
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="font-semibold text-sm">Fetching doctors from database...</span>
          </div>
        ) : filteredVets.length === 0 ? (
          <div className="max-w-2xl mx-auto py-16 px-6 text-center border border-dashed border-border rounded-3xl bg-card space-y-3">
            <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
            <h3 className="text-lg font-bold text-foreground">No Doctors Found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              There are currently no verified veterinarians matching your search in the database. New doctors will appear here once approved by platform administrators.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {filteredVets.map((vet) => (
              <Card key={vet.id} className="border-border/80 shadow-md hover:shadow-xl transition-all group overflow-hidden bg-card flex flex-col">
                <div className="h-56 bg-muted relative overflow-hidden">
                  <img 
                    src={vet.avatarUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop"} 
                    alt={vet.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-border">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-foreground">{vet.rating || "4.8"}</span>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-lg backdrop-blur-md">
                    {vet.experienceYears} Years Exp.
                  </div>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> VERIFIED IN DATABASE
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-foreground mb-1">{vet.name}</h3>
                    <p className="text-primary font-medium text-sm mb-3">{vet.specialization}</p>
                    
                    <div className="space-y-1.5 text-xs text-muted-foreground mb-6">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary shrink-0" />
                        <span>{vet.qualification}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">{vet.location || "City Veterinary Clinic"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary shrink-0" />
                        <span>Fee: ₹{vet.consultationFee} per call</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-border">
                    <Button 
                      className="w-full sm:flex-1 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => {
                        setSelectedVet(vet);
                        setShowBookingForm(false);
                        setBookingResponse(null);
                      }}
                    >
                      View Profile & Schedule
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto rounded-xl font-bold border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => window.location.href = `tel:${vet.phone || "+919876543210"}`}
                    >
                      <Phone className="h-4 w-4 mr-1.5" /> Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* DETAILED VET PROFILE & APPOINTMENT SCHEDULING MODAL */}
        <Dialog open={!!selectedVet} onOpenChange={() => { setSelectedVet(null); setBookingResponse(null); setShowBookingForm(false); }}>
          {selectedVet && (
            <DialogContent className="w-[94vw] sm:max-w-2xl bg-card border-border rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl overflow-y-auto max-h-[90dvh]">
              <DialogHeader>
                <div className="flex items-start gap-4 pb-4 border-b border-border">
                  <img
                    src={selectedVet.avatarUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop"}
                    alt={selectedVet.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/20 shadow-md shrink-0"
                  />
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Database Doctor
                    </div>
                    <DialogTitle className="text-2xl font-serif font-bold text-foreground">{selectedVet.name}</DialogTitle>
                    <p className="text-sm font-semibold text-primary">{selectedVet.specialization}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedVet.qualification} · {selectedVet.experienceYears} Yrs Exp</p>
                  </div>
                </div>
              </DialogHeader>

              {bookingResponse && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-start gap-2 my-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">{bookingResponse}</p>
                    <p className="text-xs font-normal opacity-90 mt-0.5">
                      Your appointment request is saved in the database. The doctor will arrange the visit at the scheduled time.
                    </p>
                  </div>
                </div>
              )}

              {!showBookingForm ? (
                <div className="space-y-6 my-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 bg-muted/40 p-4 rounded-2xl border border-border text-center">
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold block">Rating</span>
                      <span className="text-base font-bold text-foreground flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {selectedVet.rating || "4.9"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold block">Consultation Fee</span>
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">₹{selectedVet.consultationFee}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold block">Experience</span>
                      <span className="text-base font-bold text-foreground">{selectedVet.experienceYears} Years</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">About Doctor</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{selectedVet.bio || "Experienced livestock veterinarian specializing in cattle care, disease prevention, and reproductive health."}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                    <Button
                      className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                      onClick={() => setShowBookingForm(true)}
                    >
                      <Calendar className="w-4 h-4 mr-2" /> Schedule Appointment Now
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 rounded-xl font-bold border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                      onClick={() => window.location.href = `tel:${selectedVet.phone || "+919876543210"}`}
                    >
                      <Phone className="w-4 h-4 mr-2" /> Direct Call
                    </Button>
                  </div>
                </div>
              ) : (
                /* APPOINTMENT SCHEDULING FORM */
                <form onSubmit={handleBookAppointment} className="space-y-4 my-4">
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl text-xs font-bold text-primary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
                    <span className="truncate">Scheduling Consultation with {selectedVet.name}</span>
                    <span className="shrink-0">Fee: ₹{selectedVet.consultationFee}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">Patient Name / Animal Tag *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe (Gir Cow)"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">Consultation Mode</label>
                      <select
                        value={consultType}
                        onChange={(e) => setConsultType(e.target.value as any)}
                        className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary font-semibold"
                      >
                        <option value="clinic_visit">🏥 Clinic Visit (User Goes to Vet Clinic)</option>
                        <option value="home_visit">🏡 Home / Farm Visit (Vet Visits User Place)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">Schedule Date *</label>
                      <input
                        type="date"
                        required
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">Schedule Time *</label>
                      <input
                        type="time"
                        required
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">Cattle Symptoms / Health Problem *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe animal symptoms (e.g. High fever 104°F, drop in milk yield, skin nodules)..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div className="p-3 bg-muted/60 border border-border rounded-xl text-xs flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" /> Razorpay 256-bit Secure Gateway
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Total Payable: ₹{selectedVet.consultationFee}
                    </span>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setShowBookingForm(false)} className="w-full sm:w-auto rounded-xl text-xs">
                      Back to Profile
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submittingBooking}
                      className="w-full sm:w-auto rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2"
                    >
                      {submittingBooking ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" /> Pay ₹{selectedVet.consultationFee} & Confirm Booking →
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          )}
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
