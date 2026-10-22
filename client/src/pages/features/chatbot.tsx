import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatInputArea } from "@/components/chat/ChatInputArea";
import { ChatMessageItem } from "@/components/chat/ChatMessageItem";
import { Sparkles, Loader2, Menu, ArrowLeft, Bot } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/features/auth";
import {
  askRag,
  createThreadId,
  deleteConversation,
  formatSources,
  RagError,
  renameConversation,
  resolveRagUserId,
  type HistoryMessage,
} from "@/lib/ragClient";
import {
  appendMessages,
  historyKeys,
  prefetchMessages,
  removeConversationFromCache,
  renameConversationInCache,
  touchConversation,
  useConversationMessages,
  useConversations,
} from "@/hooks/use-chat-history";

const SHOW_SOURCES = false;

/** Start loading the previous page when the reader is this close to the top. */
const LOAD_OLDER_THRESHOLD_PX = 120;

function localMessage(
  role: HistoryMessage["role"],
  content: string,
  extra: Partial<HistoryMessage> = {},
): HistoryMessage {
  return {
    id: `local-${createThreadId()}`,
    role,
    content,
    careLevel: null,
    sources: [],
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

/**
 * Conversations are stored by the RAG backend (Postgres) and keyed by the id we
 * send as `thread_id`. The same id gives the assistant its memory, so a
 * follow-up like "and in buffalo?" resolves against the right conversation —
 * today or a week later.
 */
export default function ChatbotPage() {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const userId = useMemo(() => resolveRagUserId(user?.id), [user?.id]);

  // A new chat exists only on this page until its first reply is stored, so it
  // is never fetched from the server (there is nothing there yet).
  const [draftId, setDraftId] = useState<string>(() => createThreadId());
  const [activeChatId, setActiveChatId] = useState<string>(draftId);
  const [pendingChatId, setPendingChatId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isDraft = activeChatId === draftId;
  const isLoading = pendingChatId === activeChatId;

  const conversationsQuery = useConversations(userId, !authLoading);
  const conversations = useMemo(
    () => conversationsQuery.data?.pages.flatMap((page) => page.conversations) ?? [],
    [conversationsQuery.data],
  );

  const messagesQuery = useConversationMessages(userId, activeChatId, !isDraft && !authLoading);
  const messages = messagesQuery.messages;

  // Active conversation metadata
  const activeConversation = conversations.find((c) => c.id === activeChatId);

  // A different account (login / logout) has different history: start fresh.
  const previousUserId = useRef(userId);
  useEffect(() => {
    if (previousUserId.current === userId) return;
    previousUserId.current = userId;
    const fresh = createThreadId();
    setDraftId(fresh);
    setActiveChatId(fresh);
  }, [userId]);

  // ── scrolling ──────────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const restoreFromBottom = useRef<number | null>(null);
  const lastChatId = useRef(activeChatId);
  const lastMessageId = messages[messages.length - 1]?.id;

  // New message or a different chat → bottom. Older page prepended → keep the
  // reader exactly where they were.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (restoreFromBottom.current !== null) {
      el.scrollTop = el.scrollHeight - restoreFromBottom.current;
      restoreFromBottom.current = null;
      return;
    }
    const switched = lastChatId.current !== activeChatId;
    lastChatId.current = activeChatId;
    messagesEndRef.current?.scrollIntoView({ behavior: switched ? "auto" : "smooth" });
  }, [lastMessageId, isLoading, activeChatId, messages.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > LOAD_OLDER_THRESHOLD_PX) return;
    if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
      restoreFromBottom.current = el.scrollHeight - el.scrollTop;
      messagesQuery.fetchNextPage();
    }
  };

  // ── sidebar actions ────────────────────────────────────────────────────────
  const startNewChat = () => {
    const fresh = createThreadId();
    setDraftId(fresh);
    setActiveChatId(fresh);
  };

  const handleNewChat = () => {
    if (isDraft && messages.length === 0) return;
    startNewChat();
  };

  const handleRename = async (id: string, title: string) => {
    const previous = conversations.find((c) => c.id === id)?.title;
    renameConversationInCache(queryClient, userId, id, title);
    try {
      await renameConversation(id, userId, title);
    } catch {
      if (previous) renameConversationInCache(queryClient, userId, id, previous);
    }
  };

  const handleDelete = async (id: string) => {
    removeConversationFromCache(queryClient, userId, id);
    if (id === activeChatId) startNewChat();
    try {
      await deleteConversation(id, userId);
    } catch {
      // Put it back by refetching the list rather than guessing its position.
      queryClient.invalidateQueries({ queryKey: historyKeys.conversations(userId) });
    }
  };

  // ── sending ────────────────────────────────────────────────────────────────
  const handleSendMessage = async (content: string) => {
    if (pendingChatId) return;
    const chatId = activeChatId;
    const wasDraft = chatId === draftId;

    // Optimistic: the message and the sidebar entry appear before the reply.
    appendMessages(queryClient, userId, chatId, [localMessage("user", content)]);
    touchConversation(queryClient, userId, {
      id: chatId,
      title: wasDraft ? content.slice(0, 60) : undefined,
    });
    setPendingChatId(chatId);

    try {
      const result = await askRag(content, chatId, { userId });

      const body =
        SHOW_SOURCES && !result.blocked
          ? result.answer + formatSources(result.sources)
          : result.answer;

      appendMessages(queryClient, userId, chatId, [
        localMessage("assistant", body, { careLevel: result.careLevel, sources: result.sources }),
      ]);
      touchConversation(queryClient, userId, {
        id: chatId,
        title: result.title ?? undefined,
        messageCount: 2,
      });

      // Stored on the server now: from here on it is an ordinary conversation,
      // served from the cache we just wrote (no refetch).
      if (wasDraft && result.persisted) setDraftId(createThreadId());
    } catch (error) {
      const text =
        error instanceof RagError
          ? error.userMessage()
          : "Something went wrong while answering. Please try again.";
      appendMessages(queryClient, userId, chatId, [localMessage("assistant", text)]);
    } finally {
      setPendingChatId(null);
    }
  };

  const showSkeleton = !isDraft && messagesQuery.isPending && messages.length === 0;

  return (
    <div className="h-screen w-full flex bg-background dark:bg-black text-foreground font-sans overflow-hidden">
      {/* Sidebar with history and mobile responsiveness */}
      <ChatSidebar
        chats={conversations}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        onHoverChat={(id) => prefetchMessages(queryClient, userId, id)}
        onRenameChat={handleRename}
        onDeleteChat={handleDelete}
        isLoading={conversationsQuery.isPending && conversations.length === 0}
        isError={conversationsQuery.isError && conversations.length === 0}
        hasMore={Boolean(conversationsQuery.hasNextPage)}
        isLoadingMore={conversationsQuery.isFetchingNextPage}
        onLoadMore={() => conversationsQuery.fetchNextPage()}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-background dark:bg-black overflow-hidden relative">
        {/* Top Navbar Header */}
        <div className="h-14 flex-shrink-0 flex items-center justify-between px-3 md:px-6 bg-background dark:bg-black border-b border-border/40">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile History Toggle Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 sm:p-2 text-slate-700 dark:text-zinc-300 hover:text-foreground rounded-xl hover:bg-muted dark:hover:bg-zinc-800 transition -ml-1 shrink-0 flex items-center gap-1 font-bold text-xs bg-muted/60 cursor-pointer"
              title="Open chat history"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden xs:inline">History</span>
            </button>

            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1 font-bold px-2 py-1.5 rounded-xl hover:bg-muted bg-muted/30 shrink-0"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>

            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Bot className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground leading-tight truncate max-w-[130px] sm:max-w-xs">
                {activeConversation?.title || (isDraft ? "New chat" : "Conversation")}
              </h2>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                Cattle GPT AI Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {(user?.username?.[0] ?? "U").toUpperCase()}
            </div>
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto w-full p-4 md:p-6 pb-36">
          {showSkeleton ? (
            <div className="pt-6 space-y-8 max-w-3xl mx-auto px-4" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-3 animate-pulse">
                  <div className="ml-auto h-9 w-2/5 rounded-[20px] bg-muted" />
                  <div className="h-4 w-11/12 rounded bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-md">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl md:text-3xl font-sans font-bold tracking-tight text-foreground mb-2">
                What can I help you with today?
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground max-w-md leading-relaxed">
                Ask about cattle health, symptom diagnosis, feed nutrition, or livestock care advice.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messagesQuery.isFetchingNextPage && (
                <div className="flex justify-center py-3 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {messages.map((message) => (
                <ChatMessageItem
                  key={message.id}
                  role={message.role}
                  content={
                    SHOW_SOURCES && message.role === "assistant" && !message.id.startsWith("local-")
                      ? message.content + formatSources(message.sources)
                      : message.content
                  }
                />
              ))}
              {isLoading && (
                <div className="w-full text-foreground px-4 py-3">
                  <div className="max-w-3xl flex gap-4 mx-auto">
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex items-center h-8">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce mr-1"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s] mr-1"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Floating Input Area Wrapper */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4 px-3 md:px-6">
          <div className="max-w-3xl mx-auto">
            <ChatInputArea onSendMessage={handleSendMessage} isLoading={Boolean(pendingChatId)} />
          </div>
        </div>
      </main>
    </div>
  );
}
