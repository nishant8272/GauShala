import { getWhatsAppConfig } from "./whatsapp.config";
import type { SendMessageResponse } from "./whatsapp.types";

export class WhatsAppService {
  /**
   * Send a text message to a WhatsApp user via Meta Cloud API or simulation mode.
   *
   * @param phoneNumber Recipient's phone number with country code (e.g., 919876543210 or +91 98765 43210)
   * @param message Text body to send
   */
  async sendTextMessage(phoneNumber: string, message: string): Promise<SendMessageResponse> {
    const config = getWhatsAppConfig();
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    if (config.isSimulationMode) {
      console.log(`\n======================================================`);
      console.log(`[WhatsApp Simulation Mode] Outbound Message`);
      console.log(`To: ${cleanPhone}`);
      console.log(`Message: "${message}"`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log(`======================================================\n`);

      return {
        messaging_product: "whatsapp",
        contacts: [
          {
            input: cleanPhone,
            wa_id: cleanPhone,
          },
        ],
        messages: [
          {
            id: `sim_msg_${Date.now()}`,
          },
        ],
      };
    }

    const endpointUrl = `https://graph.facebook.com/${config.graphApiVersion}/${config.metaPhoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    };

    try {
      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.metaAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = (await response.json()) as any;

      if (!response.ok) {
        console.error(
          `[WhatsApp] ❌ Meta Cloud API returned ${response.status}:`,
          responseData
        );
        throw new Error(
          responseData?.error?.message ||
            `Meta WhatsApp Cloud API error: HTTP ${response.status}`
        );
      }

      console.log(
        `[WhatsApp] ✅ Message sent to ${cleanPhone}. Message ID: ${responseData?.messages?.[0]?.id}`
      );
      return responseData as SendMessageResponse;
    } catch (error) {
      console.error(`[WhatsApp] Failed to send message to ${cleanPhone}:`, error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();
