import type { CareLevel, RagResponse } from "./whatsapp.rag.service";

export class WhatsAppFormatter {
  /**
   * Convert standard Markdown to WhatsApp-native markup (*bold*, _italic_, • bullets)
   */
  markdownToWhatsApp(text: string): string {
    if (!text) return "";

    let formatted = text;

    // Convert markdown headers ### Title -> *Title*
    formatted = formatted.replace(/^#{1,4}\s+(.+)$/gm, "*$1*");

    // Convert **bold** to *bold*
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, "*$1*");

    // Convert markdown bullets (* item or - item) at line start to •
    formatted = formatted.replace(/^[\*\-]\s+(.+)$/gm, "• $1");

    // Convert numbered lists e.g. 1. item -> 1. item (safe)
    formatted = formatted.replace(/^\d+\.\s+/gm, (match) => match);

    // Clean up excessive blank lines (more than 2 consecutive)
    formatted = formatted.replace(/\n{3,}/g, "\n\n");

    return formatted.trim();
  }

  /**
   * Format a full RAG response into a structured, easily scannable WhatsApp message
   */
  formatRagResponse(rag: RagResponse): string {
    const parts: string[] = [];

    // 1. Care level header badge
    const badge = this.getCareLevelBadge(rag.careLevel);
    if (badge) {
      parts.push(badge);
    }

    // 2. Main clinical answer
    const cleanedAnswer = this.markdownToWhatsApp(rag.answer);
    parts.push(cleanedAnswer);

    // 3. Follow-up diagnostic questions
    if (rag.followUpQuestions && rag.followUpQuestions.length > 0) {
      const qBlock = [
        `\n*🔍 बेहतर जांच के लिए बताएं:*`,
        ...rag.followUpQuestions.map((q, idx) => `${this.getNumberEmoji(idx + 1)} ${q}`),
      ].join("\n");
      parts.push(qBlock);
    }

    // 4. Source citation or disclaimer
    if (rag.sources && rag.sources.length > 0) {
      const topCitation = rag.sources[0]?.citation || rag.sources[0]?.source;
      if (topCitation) {
        parts.push(`\n📚 _स्रोत: ${topCitation}_`);
      }
    }

    // 5. Official footer
    parts.push(`\n_— गौशाला AI Cattle Health Assistant 🐮_`);

    return parts.join("\n\n");
  }

  /**
   * Format a welcome / greeting message with interactive quick guide
   */
  formatGreeting(senderName?: string): string {
    const greetingHeader = senderName
      ? `🙏 नमस्ते ${senderName} जी!`
      : `🙏 नमस्ते किसान मित्र!`;

    return (
      `${greetingHeader} *गौशाला AI (Cattle Health Assistant)* में आपका स्वागत है। 🐮\n\n` +
      `मैं आपकी गाय और भैंस के स्वास्थ्य संबंधी सवालों के सटीक व वैज्ञानिक जवाब दे सकता हूँ।\n\n` +
      `*आप मुझसे क्या पूछ सकते हैं?*\n` +
      `• *लक्षण बताएं:* "मेरी गाय को 2 दिन से बुखार है और उसने खाना छोड़ दिया है"\n` +
      `• *रोग व उपचार:* "खुरपका-मुंहपका (FMD) या लंपी वायरस के लक्षण क्या हैं?"\n` +
      `• *दूध व पोषण:* "दुधारू भैंस के दूध उत्पादन बढ़ाने के लिए क्या खिलाएं?"\n` +
      `• *टीकाकरण:* "गाय के बछड़े को पहला टीका कब लगवाना चाहिए?"\n\n` +
      `🚨 *आपातकाल:* यदि पशु की स्थिति गंभीर है तो तुरंत नजदीकी पशु चिकित्सक को दिखाएं।\n\n` +
      `_कृपया अपने पशु की समस्या लिखकर भेजें!_`
    );
  }

  /**
   * Format an emergency triage response for life-threatening acute conditions
   */
  formatEmergency(conditionName: string): string {
    return (
      `🚨 *अति आवश्यक आपातकालीन चेतावनी (EMERGENCY)* 🚨\n\n` +
      `*संभावित स्थिति:* *${conditionName}*\n\n` +
      `⚠️ यह एक अत्यंत गंभीर व जानलेवा स्थिति हो सकती है!\n\n` +
      `*तुरंत क्या करें (Immediate First Aid):*\n` +
      `1. तुरंत अपने नजदीकी *पशु चिकित्सक (Veterinary Doctor)* को बुलाएं।\n` +
      `2. पशु को चलने-फिरने से रोकें और आरामदायक, समतल स्थान पर रखें।\n` +
      `3. पेट फूलने (Bloat) की स्थिति में पशु का मुंह थोड़ा ऊपर रखें ताकि सांस न रुके।\n` +
      `4. बिना डॉक्टर की सलाह के कोई भी दवा जबरन मुंह से न पिलाएं (धंसने का खतरा)।\n\n` +
      `📞 *पशुपालन हेल्पलाइन:* 1962 (टोल-फ्री पशु चिकित्सा सेवा)\n\n` +
      `_— गौशाला आपातकालीन सेवा 🚑_`
    );
  }

  private getCareLevelBadge(careLevel: CareLevel | null): string {
    switch (careLevel) {
      case "vet_now":
        return `🚨 *अति आवश्यक: तुरंत पशु चिकित्सक से संपर्क करें! (URGENT VET)*`;
      case "vet_soon":
        return `⚠️ *पशु चिकित्सक से परामर्श लें (Consult Vet Soon)*`;
      case "home_care":
        return `🟢 *घरेलू प्राथमिक देखभाल (Home Care)*`;
      case "info":
        return `ℹ️ *पशु स्वास्थ्य जानकारी (Informational)*`;
      default:
        return "";
    }
  }

  private getNumberEmoji(num: number): string {
    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
    return emojis[num - 1] || `${num}.`;
  }
}

export const whatsAppFormatter = new WhatsAppFormatter();
