"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatInterfaceProps = {
  projectId: string;
};

export function ChatInterface({ projectId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          messages: nextMessages,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Chat mislukt.");
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      setMessages([...nextMessages, { role: "assistant", content: "" }]);
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistant += decoder.decode(value, { stream: true });
          setMessages([
            ...nextMessages,
            { role: "assistant", content: assistant },
          ]);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
      setMessages(messages);
    } finally {
      setLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <Card className="flex h-[min(640px,70vh)] flex-col overflow-hidden border-[var(--gray-light)]">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3 pr-3">
          {messages.length === 0 && (
            <p className="text-sm text-[var(--gray)]">
              Stel een vraag over dit project. Alle voltooide analyses worden
              meegenomen in de context.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-lg bg-[var(--blue)] px-3 py-2 text-sm text-white"
                  : "mr-auto max-w-[90%] rounded-lg bg-[var(--gray-light)] px-3 py-2 text-sm text-[var(--gray-dark)] whitespace-pre-wrap"
              }
            >
              {m.content || (loading && i === messages.length - 1 ? "…" : "")}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      {error && (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-2 border-t border-[var(--gray-light)] p-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Typ je vraag…"
          rows={2}
          className="resize-none"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button
          type="button"
          className="shrink-0 self-end bg-[var(--navy)] hover:bg-[var(--navy)]/90"
          disabled={loading || !input.trim()}
          onClick={() => void send()}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
}
