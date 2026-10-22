import crypto from "crypto";
import { env } from "../config/env";
import { AppError } from "../middleware/error.middleware";

export interface CreateOrderOptions {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export class RazorpayService {
  private keyId: string;
  private keySecret: string;
  private isLiveCredentials: boolean;

  constructor() {
    this.keyId = env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_51MockGatewayKey";
    this.keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || "mock_razorpay_secret_key_demo";
    // Check if user set non-dummy credentials
    this.isLiveCredentials =
      Boolean(this.keyId) &&
      Boolean(this.keySecret) &&
      !this.keyId.includes("MockGatewayKey") &&
      !this.keySecret.includes("mock_razorpay_secret");
  }

  public getKeyId(): string {
    return this.keyId;
  }

  /**
   * Create an official Razorpay Order server-to-server.
   * Locked amount is calculated strictly on the backend in paise.
   */
  async createOrder(options: CreateOrderOptions): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    isSimulation: boolean;
  }> {
    const { amountInPaise, currency = "INR", receipt, notes = {} } = options;

    if (!amountInPaise || amountInPaise <= 0) {
      throw new AppError("Invalid payment amount: amount must be greater than zero", 400);
    }

    if (this.isLiveCredentials) {
      try {
        const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount: Math.round(amountInPaise),
            currency,
            receipt: receipt.slice(0, 40), // Razorpay limits receipt to 40 chars
            notes,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error("Razorpay API Order Error:", errData);
          throw new AppError(
            errData.error?.description || "Failed to create Razorpay payment order",
            response.status
          );
        }

        const order = (await response.json()) as RazorpayOrderResponse;
        return {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: this.keyId,
          isSimulation: false,
        };
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        console.warn("⚠️ Razorpay network order call failed, using sandbox fallback:", err.message);
      }
    }

    // Test Sandbox / Development Simulation Order
    const mockOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      orderId: mockOrderId,
      amount: Math.round(amountInPaise),
      currency,
      keyId: this.keyId,
      isSimulation: true,
    };
  }

  /**
   * Cryptographically verify payment signature sent by Razorpay Checkout.
   * HMAC-SHA256 signature must match: hmac_sha256(order_id + "|" + payment_id, secret)
   */
  verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    const { orderId, paymentId, signature } = params;

    if (!orderId || !paymentId) {
      return false;
    }

    // In sandbox simulation mode (demo or dev keys)
    if (!this.isLiveCredentials) {
      if (
        signature === "mock_signature_approved" ||
        signature.startsWith("sig_test_") ||
        orderId.startsWith("order_test_") ||
        paymentId.startsWith("pay_test_")
      ) {
        return true;
      }
    }

    if (!signature) {
      return false;
    }

    try {
      const generatedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const generatedBuffer = Buffer.from(generatedSignature, "utf8");
      const signatureBuffer = Buffer.from(signature, "utf8");

      if (generatedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(generatedBuffer, signatureBuffer);
    } catch (err) {
      console.error("Cryptographic signature check failed:", err);
      return false;
    }
  }
}

export const razorpayService = new RazorpayService();
