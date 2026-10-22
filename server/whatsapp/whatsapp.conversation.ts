import { whatsAppRagService } from "./whatsapp.rag.service";
import { whatsAppFormatter } from "./whatsapp.formatter";
import { whatsappService } from "./whatsapp.service";

const GREETING_REGEX =
  /^(hi|hello|hey|namaste|namaskar|pranam|ram\s*ram|radhe\s*radhe|help|madad|start|shuru|menu|namashkar|नमस्ते|नमस्कार|प्रणाम|राम\s*राम|मदद|शुरू|हैलो|हाय)[\s!.,?]*$/i;

const EMERGENCY_MAP: Array<{ regex: RegExp; name: string }> = [
  {
    regex: /(bloat|tympanites|afara|pet\s*phool|stomach\s*swell|पेट\s*फूल|अफारा)/i,
    name: "पेट फूलना / अफारा (Bloat / Tympanites)",
  },
  {
    regex: /(poison|poisoning|jahar|zahar|जहर|विषाक्तता)/i,
    name: "विषाक्तता / जहरीला पदार्थ (Poisoning)",
  },
  {
    regex: /(anthrax|black\s*quarter|galghontu|गलघोंटू|एंथ्रेक्स)/i,
    name: "गलघोंटू / तीव्र संक्रमण (Acute Infection)",
  },
  {
    regex: /(chok|gale\s*me\s*fans|food\s*pipe\s*block|गले\s*में\s*फंस)/i,
    name: "गले में रुकावट (Choking)",
  },
  {
    regex: /(snake\s*bite|saanp|सांप)/i,
    name: "सर्पदंश (Snake Bite)",
  },
];

export class WhatsAppConversationService {
  /**
   * Main entry point to process an incoming WhatsApp message and dispatch an intelligent reply
   *
   * @param fromPhone Sender's WhatsApp number
   * @param incomingMessage Body of text received
   * @param senderName Optional profile name of the WhatsApp user
   */
  async processInboundMessage(
    fromPhone: string,
    incomingMessage: string,
    senderName?: string
  ): Promise<void> {
    const text = incomingMessage.trim();
    if (!text) return;

    const cleanPhone = fromPhone.replace(/\D/g, "");
    // Stable per-farmer thread ID so multi-turn conversations persist
    const threadId = `wa-${cleanPhone}`;

    console.log(`[WhatsApp Conversation] Processing message from ${cleanPhone} ("${text.slice(0, 50)}...")`);

    let finalReply = "";

    // 1. Check for simple Greetings / Menus
    if (GREETING_REGEX.test(text)) {
      console.log(`[WhatsApp Conversation] Matched Greeting intent for ${cleanPhone}`);
      finalReply = whatsAppFormatter.formatGreeting(senderName);
    }
    // 2. Check for Immediate Life-Threatening Emergencies
    else {
      const emergencyMatch = EMERGENCY_MAP.find((e) => e.regex.test(text));
      if (emergencyMatch) {
        console.log(`[WhatsApp Conversation] Matched Emergency intent: ${emergencyMatch.name}`);
        finalReply = whatsAppFormatter.formatEmergency(emergencyMatch.name);
      }
      // 3. Clinical Bovine Health Query -> Bovine Disease RAG Knowledge Base
      else {
        console.log(`[WhatsApp Conversation] Forwarding query to Bovine Disease RAG engine...`);
        const ragRes = await whatsAppRagService.queryRag(text, threadId);
        finalReply = whatsAppFormatter.formatRagResponse(ragRes);
      }
    }

    // 4. Send the structured response back via WhatsApp
    await this.deliverResponse(cleanPhone, finalReply);
  }

  /**
   * Deliver message to WhatsApp, splitting cleanly if message is extra long
   */
  private async deliverResponse(toPhone: string, fullMessage: string): Promise<void> {
    const MAX_CHUNK_LENGTH = 1500;

    if (fullMessage.length <= MAX_CHUNK_LENGTH) {
      await whatsappService.sendTextMessage(toPhone, fullMessage);
      return;
    }

    // Split on double newlines to preserve paragraphs
    const paragraphs = fullMessage.split(/\n\n+/);
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      if ((currentChunk + "\n\n" + paragraph).length > MAX_CHUNK_LENGTH && currentChunk.length > 0) {
        await whatsappService.sendTextMessage(toPhone, currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
      }
    }

    if (currentChunk.trim().length > 0) {
      await whatsappService.sendTextMessage(toPhone, currentChunk.trim());
    }
  }
}

export const whatsAppConversationService = new WhatsAppConversationService();
