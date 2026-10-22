/**
 * Client for the Bovine Disease RAG backend.
 *
 * The backend is a FastAPI service that answers questions from a corpus of
 * peer-reviewed cattle/buffalo disease papers. It only ever answers from those
 * papers and cites the source document and page for every claim.
 *
 * Backend repo: Final_Year_Rag_Project  ·  endpoint: POST /query
 *
 * ── Configuration ──────────────────────────────────────────────────────────
 * Set VITE_RAG_API_URL in .env (local) and in the Vercel dashboard (deployed).
 *
 * Vite inlines env vars at BUILD time, not runtime. Changing VITE_RAG_API_URL
 * on Vercel therefore requires a redeploy — editing the variable alone does
 * nothing to an already-built bundle.
 */

const RAW_BASE_URL =
  (import.meta.env.VITE_RAG_API_URL as string | undefined) ?? "http://localhost:8000";

/** Trailing slashes would produce "//query", which some hosts 404. */
export const RAG_API_URL = RAW_BASE_URL.trim().replace(/\/+$/, "");

/**
 * Generous by design. A Render free instance sleeps after ~15 minutes idle;
 * waking it plus the one-time reranker model download can push the very first
 * request past a minute. A short timeout would make a cold backend look broken.
 */
const REQUEST_TIMEOUT_MS = 120_000;

export interface RagSource {
  content: string;
  source: string;
  page_label: string;
  score: number;
  citation: string;
  chunk_index: number;
}

/** How urgent the situation is. Drives an optional badge; the prose says it too. */
export type CareLevel = "home_care" | "vet_soon" | "vet_now" | "info";

export interface RagAnswer {
  answer: string;
  sources: RagSource[];
  thoughtProcess: string[];
  /** True when a guardrail refused the question (off-topic, jailbreak, greeting). */
  blocked: boolean;
  blockReason: string | null;
  threadId: string;
  elapsedMs: number;
  model?: string;
  /** True when the primary model was rate-limited and a fallback answered. */
  fallbackUsed: boolean;

  /** Language the user wrote in ("en" | "hi" | "hi-latn"). The answer matches it. */
  language: string;
  careLevel: CareLevel | null;
  /**
   * Set when the assistant needs more detail before advising. The questions are
   * already inside `answer`, so a plain chat UI needs no special handling —
   * these are here for clients that want to render them as tappable chips.
   */
  followUpQuestions: string[];
  /** True when the next user message will be read as answers to those questions. */
  awaitingAnswer: boolean;
  /** Set on the first turn of a conversation — the title the sidebar shows. */
  title: string | null;
  /** False when the backend could not store the turn (history will not show it). */
  persisted: boolean;
}

export type RagErrorKind = "offline" | "timeout" | "server" | "bad_response";

export class RagError extends Error {
  kind: RagErrorKind;
  status?: number;

  constructor(kind: RagErrorKind, message: string, status?: number) {
    super(message);
    this.name = "RagError";
    this.kind = kind;
    this.status = status;
  }

  /** Message safe to render in the chat thread. */
  userMessage(): string {
    switch (this.kind) {
      case "offline":
        return [
          "I could not reach the knowledge service.",
          "",
          "This usually means the backend is not running, or the browser blocked the request.",
          `Configured endpoint: \`${RAG_API_URL}\``,
        ].join("\n");
      case "timeout":
        return [
          "The knowledge service took too long to respond.",
          "",
          "If the backend is on a free hosting tier it may have been asleep — the first request after idle can take up to a minute. Please try again.",
        ].join("\n");
      case "server":
        return [
          `The knowledge service returned an error (${this.status ?? "unknown"}).`,
          "",
          "Please try again in a moment.",
        ].join("\n");
      default:
        return "I received an unexpected response from the knowledge service. Please try again.";
    }
  }
}

/** Stable per-conversation id. The backend keys its chat memory on this. */
export function createThreadId(): string {
  const globalCrypto = globalThis.crypto as Crypto | undefined;
  if (globalCrypto?.randomUUID) {
    return `web-${globalCrypto.randomUUID().slice(0, 12)}`;
  }
  return `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Ask the RAG backend a question.
 *
 * @param question  the user's message
 * @param threadId  conversation id — the same value across a conversation is
 *                  what lets follow-ups like "and in buffalo?" resolve against
 *                  earlier turns. A new id starts a fresh context.
 */
export async function askRag(
  question: string,
  threadId: string,
  options: { signal?: AbortSignal; userId?: string } = {},
): Promise<RagAnswer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Let a caller-supplied signal (component unmount) also cancel the request.
  options.signal?.addEventListener("abort", () => controller.abort(), { once: true });

  let response: Response;
  try {
    response = await fetch(`${RAG_API_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: question, thread_id: threadId, user_id: options.userId }),
      signal: controller.signal,
    });
  } catch (error) {
    // fetch() rejects with the same TypeError for "server down", "DNS failed"
    // and "CORS blocked", so they cannot be told apart here.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new RagError("timeout", "Request timed out");
    }
    throw new RagError("offline", "Could not reach the RAG backend");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new RagError("server", `Backend responded ${response.status}`, response.status);
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new RagError("bad_response", "Backend returned invalid JSON");
  }

  if (typeof data?.answer !== "string") {
    throw new RagError("bad_response", "Backend response had no answer field");
  }

  return {
    answer: data.answer,
    sources: Array.isArray(data.sources) ? data.sources : [],
    thoughtProcess: Array.isArray(data.thought_process) ? data.thought_process : [],
    blocked: Boolean(data.blocked),
    blockReason: data.block_reason ?? null,
    threadId: data.thread_id ?? threadId,
    elapsedMs: typeof data.elapsed_ms === "number" ? data.elapsed_ms : 0,
    model: data.llm?.model,
    fallbackUsed: Boolean(data.llm?.fallback_used),
    language: typeof data.language === "string" ? data.language : "en",
    careLevel: (data.care_level as CareLevel) ?? null,
    followUpQuestions: Array.isArray(data.follow_up_questions) ? data.follow_up_questions : [],
    awaitingAnswer: Boolean(data.awaiting_answer),
    title: typeof data.title === "string" ? data.title : null,
    persisted: Boolean(data.memory?.persisted),
  };
}

// ── Chat history ──────────────────────────────────────────────────────────────
//
// The backend stores every conversation (Postgres) and serves it in two light,
// paginated calls: the sidebar list carries no messages, and a conversation's
// messages are fetched only when it is opened, newest page first.

/** History reads are small; fail fast rather than hold the sidebar hostage. */
const HISTORY_TIMEOUT_MS = 20_000;

const ANON_ID_KEY = "cattlegpt_anon_user_id";

/**
 * Who owns the conversations: the logged-in user's id, or a random id kept in
 * this browser so logged-out visitors still get history (on this device only).
 */
export function resolveRagUserId(loggedInUserId?: string | null): string {
  if (loggedInUserId) return loggedInUserId;
  try {
    const saved = localStorage.getItem(ANON_ID_KEY);
    if (saved) return saved;
    const fresh = `anon-${createThreadId().slice(4)}`;
    localStorage.setItem(ANON_ID_KEY, fresh);
    return fresh;
  } catch {
    // Storage blocked (private mode): history lasts for this tab only.
    return "anon-session";
  }
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface ConversationPage {
  conversations: ConversationSummary[];
  nextCursor: string | null;
}

export interface HistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  careLevel: CareLevel | null;
  sources: RagSource[];
  createdAt: string;
}

export interface MessagePage {
  /** Oldest first within the page. */
  messages: HistoryMessage[];
  /** Pass as `before` to fetch the next older page; null when there is none. */
  nextBefore: number | null;
}

async function historyRequest(path: string, init: RequestInit = {}): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${RAG_API_URL}${path}`, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(HISTORY_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && (error.name === "AbortError" || error.name === "TimeoutError")) {
      throw new RagError("timeout", "History request timed out");
    }
    throw new RagError("offline", "Could not reach the RAG backend");
  }
  if (!response.ok) {
    throw new RagError("server", `Backend responded ${response.status}`, response.status);
  }
  try {
    return await response.json();
  } catch {
    throw new RagError("bad_response", "Backend returned invalid JSON");
  }
}

export async function listConversations(
  userId: string,
  cursor: string | null = null,
  options: { signal?: AbortSignal; limit?: number } = {},
): Promise<ConversationPage> {
  const params = new URLSearchParams({ user_id: userId, limit: String(options.limit ?? 30) });
  if (cursor) params.set("cursor", cursor);
  const data = await historyRequest(`/conversations?${params}`, { signal: options.signal });
  return {
    conversations: (data.conversations ?? []).map((c: any) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updated_at,
      messageCount: c.message_count ?? 0,
    })),
    nextCursor: data.next_cursor ?? null,
  };
}

export async function getConversationMessages(
  conversationId: string,
  userId: string,
  before: number | null = null,
  options: { signal?: AbortSignal; limit?: number } = {},
): Promise<MessagePage> {
  const params = new URLSearchParams({ user_id: userId, limit: String(options.limit ?? 30) });
  if (before) params.set("before", String(before));
  const data = await historyRequest(
    `/conversations/${encodeURIComponent(conversationId)}/messages?${params}`,
    { signal: options.signal },
  );
  return {
    messages: (data.messages ?? []).map((m: any) => ({
      id: String(m.id),
      role: m.role === "user" ? "user" : "assistant",
      content: m.content ?? "",
      careLevel: (m.care_level as CareLevel) ?? null,
      sources: Array.isArray(m.sources) ? m.sources : [],
      createdAt: m.created_at,
    })),
    nextBefore: data.next_before ?? null,
  };
}

export async function renameConversation(conversationId: string, userId: string, title: string) {
  return historyRequest(`/conversations/${encodeURIComponent(conversationId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, title }),
  });
}

export async function deleteConversation(conversationId: string, userId: string) {
  const params = new URLSearchParams({ user_id: userId });
  return historyRequest(`/conversations/${encodeURIComponent(conversationId)}?${params}`, {
    method: "DELETE",
  });
}

/**
 * Render citations as a markdown footer.
 *
 * Returned as markdown on purpose: the chat already renders assistant messages
 * through ReactMarkdown, so citations appear without touching the UI layer.
 *
 * De-duplicated by document + page, because several retrieved passages often
 * come from the same page and listing it three times reads like noise.
 */
export function formatSources(sources: RagSource[]): string {
  if (!sources.length) return "";

  const seen = new Set<string>();
  const lines: string[] = [];

  for (const source of sources) {
    const label =
      source.page_label && source.page_label !== "n/a"
        ? `${source.source} — p. ${source.page_label}`
        : source.source;
    if (seen.has(label)) continue;
    seen.add(label);
    lines.push(`${lines.length + 1}. ${label}`);
  }

  return `\n\n---\n\n**Sources**\n\n${lines.join("\n")}`;
}

/** Lightweight readiness probe. Resolves false instead of throwing. */
export async function checkRagHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${RAG_API_URL}/health`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data?.status === "healthy";
  } catch {
    return false;
  }
}
