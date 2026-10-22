import type { WhatsAppConfig } from "./whatsapp.types";

const PLACEHOLDER_TOKENS = [
  "your_meta_access_token_here",
  "your_phone_number_id_here",
  "your_waba_id_here",
  "placeholder",
  "test_token",
];

function isPlaceholderOrEmpty(val?: string): boolean {
  if (!val || !val.trim()) return true;
  const clean = val.trim().toLowerCase();
  return PLACEHOLDER_TOKENS.some((p) => clean.includes(p));
}

let cachedConfig: WhatsAppConfig | null = null;

export function getWhatsAppConfig(): WhatsAppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const metaAccessToken = process.env.META_ACCESS_TOKEN || "";
  const metaVerifyToken = process.env.META_VERIFY_TOKEN || "my_verify_token";
  const metaPhoneNumberId = process.env.META_PHONE_NUMBER_ID || "";
  const metaWabaId = process.env.META_WABA_ID || "";
  const graphApiVersion = process.env.GRAPH_API_VERSION || "v23.0";
  const businessPhoneNumber = process.env.BUSINESS_PHONE_NUMBER || "15551980995";

  // Check whether real credentials are provided or if fallback simulation mode is required
  const hasValidToken = !isPlaceholderOrEmpty(metaAccessToken);
  const hasValidPhoneId = !isPlaceholderOrEmpty(metaPhoneNumberId);
  const forceSimulation = process.env.WHATSAPP_SIMULATION_MODE === "true";

  const isSimulation = forceSimulation || !hasValidToken || !hasValidPhoneId;

  cachedConfig = {
    metaAccessToken,
    metaVerifyToken,
    metaPhoneNumberId,
    metaWabaId,
    graphApiVersion,
    businessPhoneNumber,
    isSimulationMode: isSimulation,
  };

  return cachedConfig;
}

export function validateWhatsAppConfig(): WhatsAppConfig {
  // Clear cache to re-read process.env if needed
  cachedConfig = null;
  const config = getWhatsAppConfig();

  if (config.isSimulationMode) {
    console.warn(
      "[WhatsApp] ⚠️ Running in SIMULATION MODE: Live Meta Cloud API credentials not fully configured or placeholder detected. Messages will be simulated locally."
    );
  } else {
    console.log(
      `[WhatsApp] ✅ Configured with Phone Number ID: ${config.metaPhoneNumberId}, Graph API Version: ${config.graphApiVersion}`
    );
  }

  return config;
}

export function isSimulationMode(): boolean {
  return getWhatsAppConfig().isSimulationMode;
}
