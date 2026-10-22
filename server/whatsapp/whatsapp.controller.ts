import type { Request, Response } from "express";
import { getWhatsAppConfig } from "./whatsapp.config";
import { whatsAppConversationService } from "./whatsapp.conversation";
import type { WhatsAppWebhookPayload } from "./whatsapp.types";

export class WhatsAppController {
  /**
   * Meta Webhook Verification Handshake (GET /webhook)
   * Meta sends hub.mode, hub.verify_token, and hub.challenge
   */
  verifyWebhook(req: Request, res: Response): void {
    const config = getWhatsAppConfig();
    const mode = req.query["hub.mode"] as string | undefined;
    const token = req.query["hub.verify_token"] as string | undefined;
    const challenge = req.query["hub.challenge"] as string | undefined;

    console.log(`[WhatsApp Webhook] Verification attempt received: mode=${mode}, token=${token}`);

    if (mode === "subscribe" && token === config.metaVerifyToken) {
      console.log(`[WhatsApp Webhook] Verification SUCCESS. Responding with challenge.`);
      // Meta expects the plain challenge string in HTTP 200 response body
      res.status(200).send(challenge || "");
    } else {
      console.warn(`[WhatsApp Webhook] Verification FAILED. Token mismatch or invalid mode.`);
      res.status(403).send("Forbidden: Invalid verification token");
    }
  }

  /**
   * Inbound Message & Event Handler (POST /webhook)
   * Receives notifications from Meta Graph API
   */
  handleWebhook(req: Request, res: Response): void {
    // ALWAYS acknowledge receipt immediately with 200 OK to prevent Meta retry loops
    res.status(200).send("EVENT_RECEIVED");

    const payload = req.body as WhatsAppWebhookPayload;

    if (!payload || payload.object !== "whatsapp_business_account" || !Array.isArray(payload.entry)) {
      return;
    }

    for (const entry of payload.entry) {
      if (!entry.changes || !Array.isArray(entry.changes)) continue;

      for (const change of entry.changes) {
        const value = change.value;
        if (!value) continue;

        // Process status receipts (e.g., sent, delivered, read)
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const status of value.statuses) {
            console.log(
              `[WhatsApp Webhook] Status update: Message ${status.id} -> ${status.status} for ${status.recipient_id}`
            );
          }
        }

        // Process incoming user messages
        if (value.messages && Array.isArray(value.messages)) {
          for (const message of value.messages) {
            const senderPhone = message.from;
            const messageId = message.id;
            const timestamp = message.timestamp;
            const messageType = message.type;

            // Extract contact profile name if provided by Meta
            const senderContact = value.contacts?.find((c) => c.wa_id === senderPhone);
            const senderName = senderContact?.profile?.name;

            let messageBody = "";
            if (message.text?.body) {
              messageBody = message.text.body;
            } else if (message.interactive?.button_reply?.title) {
              messageBody = message.interactive.button_reply.title;
            } else if (message.interactive?.list_reply?.title) {
              messageBody = message.interactive.list_reply.title;
            } else {
              messageBody = `[${messageType} message]`;
            }

            console.log(`\n======================================================`);
            console.log(`[WhatsApp Webhook] Inbound Message Received`);
            console.log(`Sender Phone: ${senderPhone} ${senderName ? `(${senderName})` : ""}`);
            console.log(`Message ID: ${messageId}`);
            console.log(`Timestamp: ${timestamp}`);
            console.log(`Message Body: "${messageBody}"`);
            console.log(`======================================================\n`);

            // Asynchronously dispatch intelligent response via conversational pipeline
            whatsAppConversationService
              .processInboundMessage(senderPhone, messageBody, senderName)
              .catch((err) => {
                console.error(`[WhatsApp] Failed to process message from ${senderPhone}:`, err);
              });
          }
        }
      }
    }
  }
}

export const whatsappController = new WhatsAppController();

