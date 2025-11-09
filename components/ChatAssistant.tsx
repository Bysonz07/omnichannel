"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm Sakura, your Aomori Vision assistant. Ask me anything about your stock or sales."
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  const sendMessage = useCallback(async () => {
    if (!canSend) {
      return;
    }

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: question,
          history: messages.slice(-6)
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? "Unable to reach Sakura right now.");
      }

      const data = (await response.json()) as { message: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch (error) {
      const friendlyMessage =
        error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: friendlyMessage
        }
      ]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [canSend, input, messages]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-40 rounded-full bg-primary px-4 py-6 text-primary-foreground shadow-lg hover:bg-primary/90"
        onClick={() => setOpen(true)}
        aria-label="Open Sakura assistant"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-border/70 bg-card/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Aomori Vision</p>
                <h3 className="text-2xl font-semibold text-foreground">Sakura assistant</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close chat">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <ScrollArea className="h-80 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="flex flex-col gap-4">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      message.role === "user"
                        ? "ml-auto max-w-[85%] bg-primary text-primary-foreground"
                        : "mr-auto max-w-[90%] bg-card text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex flex-col gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about stock levels, sales trends, or low inventory..."
                className="min-h-[80px] resize-none rounded-2xl border border-border/80 bg-background/70 p-3 text-sm outline-none focus:border-primary"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Powered by Google Gemini</span>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => void sendMessage()}
                  disabled={!canSend}
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
