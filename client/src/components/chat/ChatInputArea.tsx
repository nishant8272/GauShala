import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputAreaProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInputArea({ onSendMessage, isLoading }: ChatInputAreaProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-2 md:pb-6 relative">
      <div className="relative flex flex-col w-full bg-muted/70 dark:bg-zinc-900/95 rounded-[26px] border border-border/60 dark:border-zinc-800 focus-within:ring-1 focus-within:ring-emerald-500/50 shadow-xl transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Cattle GPT..."
          className="w-full max-h-[200px] min-h-[52px] bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none outline-none shadow-none resize-none py-3.5 px-4 text-foreground placeholder:text-muted-foreground/70 leading-6"
          rows={1}
          disabled={isLoading}
        />
        <div className="flex justify-between items-center p-2 pt-0">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-all flex items-center justify-center shadow-sm",
              input.trim() 
                ? "bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600" 
                : "bg-muted text-muted-foreground opacity-50"
            )}
          >
            <ArrowUp className="h-4 w-4" strokeWidth={3} />
          </Button>
        </div>
      </div>
      <div className="text-center mt-3 text-xs text-muted-foreground">
        Cattle GPT can make mistakes. Verify critical cattle health guidance.
      </div>
    </div>
  );
}
