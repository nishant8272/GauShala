import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { doctorApi } from "../api/doctor.api";
import { KycDocumentUploadCard } from "./KycDocumentUploadCard";
import { openRazorpayCheckout } from "@/lib/razorpay";
import type { DoctorDocument, DocType } from "../types/doctor.types";
import { ArrowLeft, Stethoscope, ShieldCheck, CheckCircle2, CreditCard, RefreshCw, Sparkles } from "lucide-react";

const MANDATORY_DOCS: { type: DocType; label: string; description: string }[] = [
  {
    type: "medical_license",
    label: "Medical Council License",
    description: "State or National Medical Commission registration certificate",
  },
  {
    type: "medical_certificate",
    label: "Medical Degree / Certificate",
    description: "MBBS, MD, MS or equivalent graduation degree certificate",
  },
  {
    type: "id_proof",
    label: "Government ID Proof",
    description: "Aadhaar Card, Passport, or PAN Card",
  },
  {
    type: "profile_photo",
    label: "Professional Profile Photo",
    description: "Clear headshot displayed to patients in the teleconsult catalog",
  },
];

export function DoctorOnboardWizard() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payingLicense, setPayingLicense] = useState(false);
  const [licenseActivated, setLicenseActivated] = useState(false);

  const [formData, setFormData] = useState({
    licenseNumber: "",
    specialization: "General Physician",
    qualification: "MBBS",
    experienceYears: 3,
    consultationFee: 500,
    hospitalAffiliation: "",
    languages: "English, Hindi",
    bio: "",
    city: "",
  });

  const [uploadedDocs, setUploadedDocs] = useState<DoctorDocument[]>([]);

  const loadExistingProfile = async () => {
    try {
      const res = await doctorApi.getProfile();
      setUploadedDocs(res.documents || []);
      if (res.subscriptionStatus === "active") {
        setLicenseActivated(true);
      }
      if (res.onboardingStep >= 3) {
        setStep(3);
      } else if (res.onboardingStep >= 2) {
        setStep(2);
      }
    } catch {
      // Stay at step 1
    }
  };

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await doctorApi.onboard({
        ...formData,
        experienceYears: Number(formData.experienceYears),
        consultationFee: Number(formData.consultationFee),
        languages: formData.languages.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to save clinical details");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshDocs = async () => {
    try {
      const res = await doctorApi.getDocuments();
      setUploadedDocs(res.documents);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await doctorApi.completeOnboarding();
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  const handlePayLicense = async () => {
    setPayingLicense(true);
    setError(null);
    try {
      const order = await doctorApi.createMembershipOrder();
      const paymentResponse = await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        name: "MedSevaSetu Doctor Platform",
        description: "1-Year Doctor Platform License (₹100/yr)",
        isSimulation: order.isSimulation,
      });

      const verifyResult = await doctorApi.verifyMembership({
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      if (verifyResult.success) {
        setLicenseActivated(true);
      }
    } catch (err: any) {
      if (err.message !== "Payment cancelled by user") {
        setError(err.message || "Failed to complete license payment");
      }
    } finally {
      setPayingLicense(false);
    }
  };

  const isKycComplete = MANDATORY_DOCS.every((req) =>
    uploadedDocs.some((d) => d.documentType === req.type)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-emerald-50/20 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex items-center justify-between pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition bg-white px-3 py-1.5 rounded-lg border shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            <Stethoscope className="w-4 h-4" />
            <span>Doctor Verification Portal</span>
          </div>
        </div>

        {/* Stepper Header */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[280px]">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition ${
                  step >= 1
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                1
              </span>
              <span
                className={`font-semibold text-xs sm:text-sm ${
                  step >= 1 ? "text-slate-900" : "text-slate-400"
                }`}
              >
                Profile
              </span>
            </div>

            <div className="h-0.5 w-4 sm:w-16 bg-slate-200"></div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <span
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition ${
                  step >= 2
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                2
              </span>
              <span
                className={`font-semibold text-xs sm:text-sm ${
                  step >= 2 ? "text-slate-900" : "text-slate-400"
                }`}
              >
                KYC Docs
              </span>
            </div>

            <div className="h-0.5 w-4 sm:w-16 bg-slate-200"></div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <span
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition ${
                  step >= 3
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                3
              </span>
              <span
                className={`font-semibold text-xs sm:text-sm ${
                  step >= 3 ? "text-emerald-700" : "text-slate-400"
                }`}
              >
                Review
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <span className="font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1 Form */}
        {step === 1 && (
          <form
            onSubmit={handleStep1Submit}
            className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-md space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Doctor Professional Details
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Please provide your medical credentials, specialization, and consultation preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medical Registration / License # *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MCI-2024-8899"
                  className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm"
                  value={formData.licenseNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseNumber: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specialization *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiologist, Dermatologist"
                  className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm"
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qualification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MBBS, MD, MS"
                  className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm"
                  value={formData.qualification}
                  onChange={(e) =>
                    setFormData({ ...formData, qualification: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Experience (Years) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm"
                  value={formData.experienceYears}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experienceYears: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consultation Fee (₹) *
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm"
                  value={formData.consultationFee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consultationFee: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital / Clinic Affiliation
              </label>
              <input
                type="text"
                placeholder="e.g. Apollo Hospital, Max Healthcare"
                className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm"
                value={formData.hospitalAffiliation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hospitalAffiliation: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Languages (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. English, Hindi, Marathi"
                className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm"
                value={formData.languages}
                onChange={(e) =>
                  setFormData({ ...formData, languages: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Bio
              </label>
              <textarea
                rows={3}
                placeholder="Brief summary of your clinical expertise and background..."
                className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition"
              >
                {loading ? "Saving Details..." : "Continue to KYC Uploads →"}
              </button>
            </div>
          </form>
        )}

        {/* Step 2 KYC Uploads */}
        {step === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-md space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Upload Mandatory Verification Documents
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                All 4 documents below are securely uploaded to Cloudinary for Super Admin KYC verification.
              </p>
            </div>

            <div className="space-y-3">
              {MANDATORY_DOCS.map((doc) => {
                const uploaded = uploadedDocs.find(
                  (d) => d.documentType === doc.type
                );
                return (
                  <KycDocumentUploadCard
                    key={doc.type}
                    docType={doc.type}
                    label={doc.label}
                    description={doc.description}
                    uploadedDoc={uploaded}
                    onRefresh={handleRefreshDocs}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-xs text-slate-600 font-medium">
                {uploadedDocs.length} of {MANDATORY_DOCS.length} documents uploaded
              </span>

              <button
                type="button"
                disabled={!isKycComplete || loading}
                onClick={handleFinalSubmit}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md transition ${
                  isKycComplete
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {loading ? "Submitting..." : "Submit Application for Review ✓"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 Submitted Confirmation & License Activation */}
        {step === 3 && (
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200/80 shadow-md text-center space-y-6 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Application & KYC Submitted!
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Your medical credentials and KYC proofs have been securely uploaded for Super Admin verification.
              </p>
            </div>

            {/* 1-Year Platform License Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" /> Doctor Platform License
                </span>
                <span className="text-xs font-bold text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
                  ₹100 / Year
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-normal">
                To accept farmer appointments, toggle your consultation availability, and use the full clinical workspace, activate your 1-year verified doctor membership.
              </p>

              {licenseActivated ? (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  1-Year Platform License Activated! Full features unlocked.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handlePayLicense}
                  disabled={payingLicense}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
                >
                  {payingLicense ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" /> Pay ₹100 & Activate Annual License →
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              onClick={() => navigate("/doctor/dashboard")}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md transition"
            >
              Continue to Doctor Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

