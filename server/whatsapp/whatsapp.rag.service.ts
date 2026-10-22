export type CareLevel = "home_care" | "vet_soon" | "vet_now" | "info";

export interface RagSource {
  content: string;
  source: string;
  page_label?: string;
  score?: number;
  citation?: string;
}

export interface RagResponse {
  answer: string;
  sources: RagSource[];
  careLevel: CareLevel | null;
  followUpQuestions: string[];
  blocked: boolean;
  blockReason: string | null;
  threadId: string;
  language?: string;
  isFallback?: boolean;
}

const REQUEST_TIMEOUT_MS = 25000;

export class WhatsAppRagService {
  private getBaseUrl(): string {
    const raw =
      process.env.VITE_RAG_API_URL ||
      process.env.RAG_API_URL ||
      "http://localhost:8000";
    return raw.trim().replace(/\/+$/, "");
  }

  /**
   * Query the Bovine Disease RAG API (FastAPI backend)
   *
   * @param question Farmer's message / inquiry
   * @param threadId Stable per-phone conversation ID to maintain memory context
   */
  async queryRag(question: string, threadId: string): Promise<RagResponse> {
    const baseUrl = this.getBaseUrl();
    const endpoint = `${baseUrl}/query`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      console.log(`[WhatsApp RAG] Querying backend at ${endpoint} (thread: ${threadId})...`);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: question, thread_id: threadId }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`RAG backend responded with HTTP ${res.status}`);
      }

      const data = (await res.json()) as any;

      if (!data || typeof data.answer !== "string") {
        throw new Error("Invalid RAG response: missing answer string");
      }

      return {
        answer: data.answer,
        sources: Array.isArray(data.sources) ? data.sources : [],
        careLevel: data.care_level || data.careLevel || null,
        followUpQuestions: Array.isArray(data.follow_up_questions)
          ? data.follow_up_questions
          : Array.isArray(data.followUpQuestions)
          ? data.followUpQuestions
          : [],
        blocked: Boolean(data.blocked),
        blockReason: data.block_reason || data.blockReason || null,
        threadId: data.thread_id || threadId,
        language: data.language || "hi",
        isFallback: false,
      };
    } catch (err: any) {
      console.warn(`[WhatsApp RAG] Backend query failed (${err.message}). Using intelligent clinical fallback.`);
      return this.generateFallbackResponse(question, threadId);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Intelligent fallback response if the RAG server is offline or starting up
   */
  private generateFallbackResponse(question: string, threadId: string): RagResponse {
    const isHindi = /[\u0900-\u097F]/.test(question);

    let answer = "";
    if (isHindi) {
      answer =
        `आपकी गाय/भैंस के संबंध में आपका प्रश्न प्राप्त हुआ है।\n\n` +
        `हमारी पशु चिकित्सा ज्ञान प्रणाली (Knowledge Base) अभी पुनः कनेक्ट हो रही है।\n\n` +
        `• यदि पशु को तेज बुखार, सुस्ती या खाना छोड़ने की समस्या है, तो उसे छायादार व हवादार जगह पर रखें और ताजा पानी दें।\n` +
        `• किसी भी गंभीर लक्षण पर कृपया बिना देरी किए नजदीकी पशु चिकित्सालय (Veterinary Doctor) से संपर्क करें।`;
    } else {
      answer =
        `We have received your cattle health inquiry.\n\n` +
        `Our Veterinary Knowledge Base is currently reconnecting.\n\n` +
        `• If the animal has high fever, lethargy, or loss of appetite, provide plenty of fresh water and keep in a cool, ventilated shelter.\n` +
        `• For acute or persistent symptoms, please consult your nearest licensed veterinarian without delay.`;
    }

    return {
      answer,
      sources: [],
      careLevel: "vet_soon",
      followUpQuestions: [
        "पशु कब से बीमार है? (How many days has the animal been sick?)",
        "क्या पशु ने चारा-पानी छोड़ दिया है? (Has it stopped eating/drinking?)",
      ],
      blocked: false,
      blockReason: null,
      threadId,
      isFallback: true,
    };
  }
}

export const whatsAppRagService = new WhatsAppRagService();
