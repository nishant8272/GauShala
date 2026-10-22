import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  PenSquare,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Chat {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  /** Called on hover so the conversation's messages are cached before the click. */
  onHoverChat?: (id: string) => void;
  onRenameChat?: (id: string, title: string) => void;
  onDeleteChat?: (id: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

/** Load the next page when the list is scrolled this close to its end. */
const LOAD_MORE_THRESHOLD_PX = 200;

const DAY_MS = 24 * 60 * 60 * 1000;

function groupLabel(iso: string, now: Date): string {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = new Date(iso).getTime();
  if (t >= startOfToday) return "Today";
  if (t >= startOfToday - DAY_MS) return "Yesterday";
  if (t >= startOfToday - 7 * DAY_MS) return "Previous 7 days";
  if (t >= startOfToday - 30 * DAY_MS) return "Previous 30 days";
  return "Older";
}

export function ChatSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onHoverChat,
  onRenameChat,
  onDeleteChat,
  isLoading,
  isError,
  hasMore,
  isLoadingMore,
  onLoadMore,
  isOpenMobile = false,
  onCloseMobile,
}: ChatSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Chat | null>(null);
  const { theme, setTheme } = useTheme();

  // Chats arrive newest first, so consecutive runs share a label.
  const groups = useMemo(() => {
    const now = new Date();
    const result: { label: string; chats: Chat[] }[] = [];
    for (const chat of chats) {
      const label = groupLabel(chat.updatedAt, now);
      const last = result[result.length - 1];
      if (last?.label === label) last.chats.push(chat);
      else result.push({ label, chats: [chat] });
    }
    return result;
  }, [chats]);

  const handleListScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (!hasMore || isLoadingMore) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < LOAD_MORE_THRESHOLD_PX) onLoadMore?.();
  };

  const commitRename = (id: string) => {
    const title = draftTitle.trim();
    const current = chats.find((c) => c.id === id)?.title;
    if (title && title !== current) onRenameChat?.(id, title);
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "flex flex-col h-full bg-[#f8f9fa] dark:bg-[#09090b] text-slate-900 dark:text-white transition-all duration-300 border-r border-border/50 dark:border-white/5 font-sans",
          // Mobile slide-over drawer
          "fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] shadow-2xl md:relative md:shadow-none md:z-auto md:max-w-none touch-pan-y",
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "md:w-[60px]" : "md:w-[260px] md:flex-shrink-0"
        )}
      >
        {/* Header Controls */}
        <div className="flex items-center justify-between p-3 h-14 border-b border-border/40 gap-2">
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onNewChat();
                onCloseMobile?.();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs cursor-pointer h-8"
              title="New chat"
            >
              <PenSquare className="h-3.5 w-3.5" />
              <span>New</span>
            </Button>
          )}

          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex mx-auto text-foreground hover:bg-black/5 dark:hover:bg-white/5"
              onClick={() => setIsCollapsed(false)}
              title="Open Sidebar"
            >
              <PanelLeft className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          )}

          <div className="flex items-center gap-1">
            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-white/10 transition cursor-pointer"
              title="Close Sidebar"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Desktop Collapse / Expand Toggle */}
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden md:flex p-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 rounded-xl transition cursor-pointer"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="h-5 w-5" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Chat History List */}
        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden p-3 pt-2 overscroll-contain touch-pan-y",
            isCollapsed && "hidden md:block"
          )}
          onScroll={handleListScroll}
        >
          {!isCollapsed && isLoading && (
            <div className="space-y-2 px-2 mt-4" aria-busy="true">
              {[70, 90, 60, 80, 75].map((width, i) => (
                <div
                  key={i}
                  className="h-4 rounded bg-black/5 dark:bg-white/10 animate-pulse"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
          )}

          {!isCollapsed && isError && (
            <div className="px-2 mt-4 text-xs text-foreground/50">
              Chat history is unavailable right now. New chats still work.
            </div>
          )}

          {!isCollapsed &&
            groups.map((group) => (
              <div key={group.label} className="mb-3">
                <div className="mb-1 text-xs font-semibold text-foreground/50 px-2 mt-2">
                  {group.label}
                </div>
                <div className="space-y-[2px]">
                  {group.chats.map((chat) => (
                    <div
                      key={chat.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (editingId !== chat.id) {
                          onSelectChat(chat.id);
                          onCloseMobile?.();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editingId !== chat.id) {
                          onSelectChat(chat.id);
                          onCloseMobile?.();
                        }
                      }}
                      onMouseEnter={() => onHoverChat?.(chat.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-colors text-left group cursor-pointer font-medium",
                        activeChatId === chat.id
                          ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-semibold"
                          : "text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-white/5",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      {editingId === chat.id ? (
                        <input
                          autoFocus
                          value={draftTitle}
                          maxLength={200}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          onBlur={() => commitRename(chat.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(chat.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 bg-background border border-border rounded px-1.5 py-0.5 text-xs outline-none"
                        />
                      ) : (
                        <span className="truncate flex-1">{chat.title}</span>
                      )}

                      {(onRenameChat || onDeleteChat) && editingId !== chat.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "shrink-0 rounded p-1 text-slate-400 dark:text-zinc-500 hover:text-foreground transition-opacity",
                                activeChatId === chat.id
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-100 focus:opacity-100"
                              )}
                              aria-label="Chat options"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                            {onRenameChat && (
                              <DropdownMenuItem
                                onSelect={() => {
                                  setDraftTitle(chat.title);
                                  setEditingId(chat.id);
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" /> Rename
                              </DropdownMenuItem>
                            )}
                            {onDeleteChat && (
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onSelect={() => setPendingDelete(chat)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {!isCollapsed && isLoadingMore && (
            <div className="flex justify-center py-2 text-foreground/50">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Footer with Return to Home & Theme Toggle */}
        <div
          className={cn(
            "p-3 flex flex-col gap-2 border-t border-border/40",
            isCollapsed && "hidden md:flex items-center px-2"
          )}
        >
          <Link
            href="/"
            onClick={onCloseMobile}
            title="Return to Home"
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-white/5 transition border border-slate-200 dark:border-zinc-800",
              isCollapsed ? "justify-center px-0" : "justify-center"
            )}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Return to Home</span>}
          </Link>

          <button
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition-colors font-semibold cursor-pointer",
              isCollapsed && "justify-center px-0"
            )}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 shrink-0 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 shrink-0 text-indigo-500" />
            )}
            {!isCollapsed && (
              <span className="truncate">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </button>
        </div>

        {/* Floating open button when collapsed on mobile */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute -right-12 top-4 h-10 w-10 flex md:hidden items-center justify-center text-foreground z-10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
          >
            <PanelLeft className="h-6 w-6" strokeWidth={1.5} />
          </button>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => !open && setPendingDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete chat?</AlertDialogTitle>
              <AlertDialogDescription>
                "{pendingDelete?.title}" will be deleted permanently, and the assistant will forget it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (pendingDelete) onDeleteChat?.(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </aside>
    </>
  );
}
