"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bot, 
  X, 
  Minimize2, 
  Maximize2, 
  Send, 
  Sparkles, 
  Loader2, 
  ExternalLink,
  MessageSquare,
  Settings,
  HelpCircle
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export function AlexFloatingWidget() {
  const pathname = usePathname();
  
  // Do not render floating widget if user is already on the dedicated Alex page
  if (pathname === "/dashboard/alex") {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm Alex, your AutoLearn AI tutor & agent. How can I help you with your courses, assignments, or n8n workflows today?",
      createdAt: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (userTextOverride?: string) => {
    const textToSend = (userTextOverride || input).trim();
    if (!textToSend || isLoading) return;

    if (!userTextOverride) setInput("");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      },
    ]);

    // Read personal provider if configured
    let personalConfig: any = {};
    try {
      const saved = localStorage.getItem("alex_personal_provider");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.provider && parsed.apiKey) {
          personalConfig = {
            personalProvider: parsed.provider,
            personalApiKey: parsed.apiKey,
            personalModel: parsed.model || undefined,
          };
        }
      }
    } catch (e) {
      // Ignore
    }

    try {
      const response = await fetch("/api/alex/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textToSend,
          mode: "tutor",
          ...personalConfig,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || "Unable to reach Alex.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream response from Alex.");
      }

      const decoder = new TextDecoder();
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const event = JSON.parse(dataStr);
              if (event.type === "delta" && event.content) {
                streamedContent += event.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: streamedContent }
                      : m
                  )
                );
              } else if (event.type === "error") {
                const errMsg = event.error || event.data?.error || "AI provider error.";
                if (!streamedContent) {
                  streamedContent = `⚠️ ${errMsg}\n\nTip: You can configure your AI key in the Settings of the full Alex Tutor page.`;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: streamedContent }
                        : m
                    )
                  );
                }
              }
            } catch (err) {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      if (!streamedContent.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    "I am ready to help! If you haven't yet, you can link your API key in the full Alex page Settings.",
                }
              : m
          )
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `⚠️ ${err.message || "Connection issue"}. Please verify your provider or visit the full Alex AI Tutor page.`,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
          aria-label="Open Alex AI Tutor"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-300"></span>
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold leading-tight flex items-center gap-1">
              Alex AI Tutor
              <Sparkles className="w-3 h-3 text-cyan-300" />
            </div>
            <div className="text-[10px] text-cyan-100 font-medium">Smart AI Assistant</div>
          </div>
        </button>
      )}

      {/* Floating Window */}
      {isOpen && (
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col transition-all duration-300 ${
            isMinimized ? "w-80 h-14" : "w-[90vw] sm:w-[420px] h-[560px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 px-4 py-3 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold flex items-center gap-1.5 truncate">
                  Alex AI Tutor
                  <span className="text-[10px] bg-cyan-400/30 text-white border border-white/30 px-1.5 py-0.2 rounded-full font-semibold">
                    Smart
                  </span>
                </div>
                <div className="text-[10px] text-cyan-100/90 truncate">Autonomous Learning Companion</div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80 shrink-0">
              <Link
                href="/dashboard/alex"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Open Fullscreen Page"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isMinimized && (
            <>
              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/50">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center text-xs shrink-0 shadow-sm mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                          : "bg-white text-neutral-800 border border-neutral-200/80 rounded-tl-none shadow-sm whitespace-pre-wrap"
                      }`}
                    >
                      {m.content || (
                        <span className="inline-flex items-center gap-1.5 text-neutral-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              {messages.length <= 2 && (
                <div className="px-4 py-2 bg-white border-t border-neutral-100 flex gap-1.5 overflow-x-auto text-[11px]">
                  <button
                    onClick={() => handleSend("Explain n8n workflow nodes")}
                    className="shrink-0 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors"
                  >
                    💡 Explain n8n
                  </button>
                  <button
                    onClick={() => handleSend("Help me with my assignment")}
                    className="shrink-0 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors"
                  >
                    📝 Assignment help
                  </button>
                  <button
                    onClick={() => handleSend("Quiz practice test")}
                    className="shrink-0 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors"
                  >
                    🎯 Practice Quiz
                  </button>
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-neutral-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Alex anything..."
                    disabled={isLoading}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-50 focus:bg-white text-neutral-900 placeholder:text-neutral-400 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-neutral-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shrink-0"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-400 px-1">
                  <span>Powered by AutoLearn Spot</span>
                  <Link href="/dashboard/alex" className="hover:text-blue-600 transition-colors flex items-center gap-0.5">
                    Full AI Studio <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
