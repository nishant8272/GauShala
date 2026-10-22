/**
 * Chat history, cached with TanStack Query.
 *
 * Why it is fast:
 *  - The sidebar list and the messages are separate queries. The list carries no
 *    messages, and a conversation's messages are fetched only when it is opened
 *    (or hovered — `prefetchMessages`), newest 30 first; older pages load on
 *    scroll-up.
 *  - Sending a message never refetches anything: the user's message and the
 *    reply are written straight into the cache (`appendMessages`,
 *    `touchConversation`).
 *  - The first page of the sidebar is snapshotted in localStorage, so a reload
 *    paints the list instantly and refreshes it in the background — useful when
 *    the backend is a sleeping free-tier instance.
 */

import {
  useInfiniteQuery,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import {
  getConversationMessages,
  listConversations,
  type ConversationPage,
  type ConversationSummary,
  type HistoryMessage,
  type MessagePage,
} from "@/lib/ragClient";

/** Opened conversations stay fresh for 5 minutes; switching back is instant. */
const MESSAGES_STALE_MS = 5 * 60_000;
const LIST_STALE_MS = 30_000;
/** Keep up to this many closed conversations' messages in memory. */
const MESSAGES_GC_MS = 30 * 60_000;

export const historyKeys = {
  conversations: (userId: string) => ["rag", "conversations", userId] as const,
  messages: (userId: string, conversationId: string) => ["rag", "messages", userId, conversationId] as const,
};

type ConversationsData = InfiniteData<ConversationPage, string | null>;
type MessagesData = InfiniteData<MessagePage, number | null>;

// ── localStorage snapshot of the first sidebar page ──────────────────────────

const snapshotKey = (userId: string) => `cattlegpt_history_${userId}`;

function readSnapshot(userId: string): ConversationsData | undefined {
  try {
    const raw = localStorage.getItem(snapshotKey(userId));
    if (!raw) return undefined;
    const page = JSON.parse(raw) as ConversationPage;
    return { pages: [page], pageParams: [null] };
  } catch {
    return undefined;
  }
}

function writeSnapshot(userId: string, data: ConversationsData | undefined) {
  if (!data?.pages[0]) return;
  try {
    localStorage.setItem(snapshotKey(userId), JSON.stringify(data.pages[0]));
  } catch {
    // Storage full or blocked — the snapshot is only a speed-up.
  }
}

// ── queries ──────────────────────────────────────────────────────────────────

export function useConversations(userId: string, enabled = true) {
  return useInfiniteQuery({
    enabled,
    queryKey: historyKeys.conversations(userId),
    queryFn: async ({ pageParam, signal }) => {
      const page = await listConversations(userId, pageParam, { signal });
      if (pageParam === null) writeSnapshot(userId, { pages: [page], pageParams: [null] });
      return page;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    // Snapshot paints immediately; updatedAt 0 marks it stale so it refreshes at once.
    initialData: () => readSnapshot(userId),
    initialDataUpdatedAt: 0,
    staleTime: LIST_STALE_MS,
    retry: 1,
  });
}

function messagesQueryOptions(userId: string, conversationId: string) {
  return {
    queryKey: historyKeys.messages(userId, conversationId),
    queryFn: ({ pageParam, signal }: { pageParam: number | null; signal: AbortSignal }) =>
      getConversationMessages(conversationId, userId, pageParam, { signal }),
    initialPageParam: null as number | null,
    getNextPageParam: (last: MessagePage) => last.nextBefore,
    staleTime: MESSAGES_STALE_MS,
    gcTime: MESSAGES_GC_MS,
    retry: 1,
  };
}

/**
 * Messages of one conversation. `enabled` is false for a brand-new chat that the
 * server has not seen yet — its messages live only in the cache until the first
 * reply arrives.
 */
export function useConversationMessages(userId: string, conversationId: string | null, enabled: boolean) {
  const query = useInfiniteQuery({
    ...messagesQueryOptions(userId, conversationId ?? "none"),
    enabled: enabled && Boolean(conversationId),
  });
  // Pages are newest-first; within a page messages are oldest-first.
  const messages: HistoryMessage[] = query.data
    ? [...query.data.pages].reverse().flatMap((page) => page.messages)
    : [];
  return { ...query, messages };
}

/** Warm the cache on hover so opening a conversation feels instant. */
export function prefetchMessages(queryClient: QueryClient, userId: string, conversationId: string) {
  return queryClient.prefetchInfiniteQuery(messagesQueryOptions(userId, conversationId));
}

// ── cache writes (no refetch after sending) ──────────────────────────────────

/** Append messages to the newest page of a conversation, creating it if needed. */
export function appendMessages(
  queryClient: QueryClient,
  userId: string,
  conversationId: string,
  messages: HistoryMessage[],
) {
  queryClient.setQueryData<MessagesData>(historyKeys.messages(userId, conversationId), (old) => {
    if (!old || old.pages.length === 0) {
      return { pages: [{ messages, nextBefore: null }], pageParams: [null] };
    }
    const [newest, ...older] = old.pages;
    return { ...old, pages: [{ ...newest, messages: [...newest.messages, ...messages] }, ...older] };
  });
}

/** Move a conversation to the top of the sidebar (inserting it if new). */
export function touchConversation(
  queryClient: QueryClient,
  userId: string,
  conversation: Pick<ConversationSummary, "id"> & Partial<ConversationSummary>,
) {
  const key = historyKeys.conversations(userId);
  queryClient.setQueryData<ConversationsData>(key, (old) => {
    const existing = old?.pages.flatMap((p) => p.conversations).find((c) => c.id === conversation.id);
    const updated: ConversationSummary = {
      id: conversation.id,
      title: conversation.title ?? existing?.title ?? "New chat",
      updatedAt: new Date().toISOString(),
      messageCount: (existing?.messageCount ?? 0) + (conversation.messageCount ?? 0),
    };
    if (!old) return { pages: [{ conversations: [updated], nextCursor: null }], pageParams: [null] };
    const pages = old.pages.map((p) => ({
      ...p,
      conversations: p.conversations.filter((c) => c.id !== conversation.id),
    }));
    pages[0] = { ...pages[0], conversations: [updated, ...pages[0].conversations] };
    return { ...old, pages };
  });
  writeSnapshot(userId, queryClient.getQueryData<ConversationsData>(key));
}

export function renameConversationInCache(
  queryClient: QueryClient,
  userId: string,
  conversationId: string,
  title: string,
) {
  const key = historyKeys.conversations(userId);
  queryClient.setQueryData<ConversationsData>(key, (old) =>
    old && {
      ...old,
      pages: old.pages.map((p) => ({
        ...p,
        conversations: p.conversations.map((c) => (c.id === conversationId ? { ...c, title } : c)),
      })),
    },
  );
  writeSnapshot(userId, queryClient.getQueryData<ConversationsData>(key));
}

export function removeConversationFromCache(queryClient: QueryClient, userId: string, conversationId: string) {
  const key = historyKeys.conversations(userId);
  queryClient.setQueryData<ConversationsData>(key, (old) =>
    old && {
      ...old,
      pages: old.pages.map((p) => ({
        ...p,
        conversations: p.conversations.filter((c) => c.id !== conversationId),
      })),
    },
  );
  queryClient.removeQueries({ queryKey: historyKeys.messages(userId, conversationId) });
  writeSnapshot(userId, queryClient.getQueryData<ConversationsData>(key));
}
