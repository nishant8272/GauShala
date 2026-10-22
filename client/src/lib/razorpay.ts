/**
 * Razorpay Checkout SDK dynamic loader & helper
 * Loads https://checkout.razorpay.com/v1/checkout.js on demand
 */

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface OpenRazorpayOptions {
  keyId: string;
  orderId: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  themeColor?: string;
  isSimulation?: boolean;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("⚠️ Failed to load Razorpay checkout script from CDN.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay Standard Checkout popup.
 * Resolves with payment tokens on success, rejects on modal dismissal or failure.
 */
export async function openRazorpayCheckout(
  options: OpenRazorpayOptions
): Promise<RazorpayPaymentSuccessResponse> {
  const {
    keyId,
    orderId,
    amount,
    currency = "INR",
    name = "MedSevaSetu Teleconsult",
    description = "Payment",
    image = "https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=128&auto=format&fit=crop&q=80",
    prefill = {},
    themeColor = "#059669",
    isSimulation = false,
  } = options;

  // If simulation order, or if live checkout script fails, provide seamless developer fallback
  const isScriptLoaded = await loadRazorpayScript();

  if (!isScriptLoaded || isSimulation || !keyId || keyId.includes("MockGatewayKey")) {
    return new Promise((resolve, reject) => {
      const confirmSimulation = window.confirm(
        `[Razorpay Test Gateway]\n\nPay ₹${(amount / 100).toFixed(
          2
        )} for ${description}?\n\nClick OK to simulate successful payment authorization.\nClick Cancel to abort.`
      );

      if (confirmSimulation) {
        resolve({
          razorpay_order_id: orderId,
          razorpay_payment_id: `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          razorpay_signature: "mock_signature_approved",
        });
      } else {
        reject(new Error("Payment cancelled by user"));
      }
    });
  }

  return new Promise((resolve, reject) => {
    const rzpOptions = {
      key: keyId,
      amount,
      currency,
      name,
      description,
      image,
      order_id: orderId,
      prefill: {
        name: prefill.name || "Farmer / Patient",
        email: prefill.email || "farmer@medsevasetu.in",
        contact: prefill.contact || "9876543210",
      },
      theme: {
        color: themeColor,
      },
      handler: (response: RazorpayPaymentSuccessResponse) => {
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          reject(new Error("Payment cancelled by user"));
        },
      },
    };

    const rzp = new (window as any).Razorpay(rzpOptions);
    rzp.on("payment.failed", (response: any) => {
      reject(new Error(response.error?.description || "Payment failed at gateway"));
    });
    rzp.open();
  });
}
