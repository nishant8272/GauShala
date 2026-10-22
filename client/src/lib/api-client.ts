export interface ApiErrorResponse {
  error: string;
  details?: any;
}

export class ApiError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const envApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");
const API_BASE = envApiUrl ? (envApiUrl.endsWith("/api") ? envApiUrl : `${envApiUrl}/api`) : "/api";

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Automatically attach auth user context headers & Bearer token from localStorage
  try {
    const savedUserJson = typeof window !== "undefined" ? localStorage.getItem("medsevasetu_auth_user") : null;
    if (savedUserJson) {
      const parsed = JSON.parse(savedUserJson);
      if (parsed?.id && !headers.has("X-User-Id")) {
        headers.set("X-User-Id", parsed.id);
      }
      if (parsed?.role && !headers.has("X-User-Role")) {
        headers.set("X-User-Role", parsed.role);
      }
    }
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("medsevasetu_auth_token") : null;
    if (savedToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${savedToken}`);
    }
  } catch {
    // Ignore localStorage parse errors
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_BASE}${normalizedPath}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `HTTP ${response.status}: Request failed`;
    throw new ApiError(errorMsg, response.status, data?.details);
  }

  return data as T;
}
