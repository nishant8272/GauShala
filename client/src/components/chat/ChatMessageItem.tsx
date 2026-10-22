import { Bot, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ChatMessageItemProps {
  role: "user" | "assistant" | "system";
  content: string;
}

export function ChatMessageItem({ role, content }: ChatMessageItemProps) {
  if (role === "system") return null;

  return (
    <div className="w-full text-foreground px-4 py-3 md:py-6">
      <div className={cn(
        "max-w-3xl flex gap-4 mx-auto",
        role === "user" ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Assistant Avatar */}
        {role === "assistant" && (
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm mt-0.5 border border-emerald-400/30">
            <Sparkles className="w-4 h-4" />
          </div>
        )}

        <div className={cn(
          "relative flex flex-col gap-1 md:gap-3 max-w-[85%] md:max-w-[75%]",
          role === "user" ? "items-end" : "items-start w-full max-w-full pt-1"
        )}>
          {role === "user" ? (
            <div className="px-5 py-3 rounded-[22px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 border border-emerald-500/30 font-medium inline-block shadow-xs">
              <div className="whitespace-pre-wrap">{content}</div>
            </div>
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none break-words w-full text-foreground leading-relaxed text-sm md:text-base">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
