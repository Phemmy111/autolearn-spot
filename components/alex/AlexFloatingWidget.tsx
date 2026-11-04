"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Bot, 
  X, 
  Minimize2, 
  Maximize2, 
  Send, 
  Sparkles, 
  Loader2, 
  ExternalLink,
  MessageSquare
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export function AlexFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Alex, your AutoLearn AI tutor & assistant. How can I help you with your courses, assignments, or n8n workflows today?",
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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/alex/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: userText,
          mode: "tutor",
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to reach Alex. Please try again.");
      }

      const data = await response.json();
      const reply = data.response || data.message || data.content || "I'm here to help! Could you please rephrase that?";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
          createdAt: new Date(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I ran into a connection issue. Please ensure your provider is active or visit the full Alex page.",
          createdAt: new Date(),
        },
      ]);
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
          <span className="font-semibold text-sm tracking-wide flex items-center gap-1.5">
            Ask Alex <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          </span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`w-[92vw] sm:w-[420px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized ? "h-14" : "h-[540px] max-h-[82vh]"
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Alex AI Tutor
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono font-normal">
                    Smart AI
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <Link
                href="/dashboard/alex"
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Open Dedicated Page"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area (only if not minimized) */}
          {!isMinimized && (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/60 text-sm">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-none shadow-md"
                          : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span className="text-xs">Alex is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-3 py-2 bg-slate-900 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
                <button
                  onClick={() => setInput("Explain this module step-by-step")}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  💡 Explain module
                </button>
                <button
                  onClick={() => setInput("How do I fix errors in my n8n workflow?")}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  ⚡ Debug n8n
                </button>
                <button
                  onClick={() => setInput("Give me a practice quiz question")}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  📝 Quiz prep
                </button>
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSend}
                className="p-3 bg-slate-800/90 border-t border-slate-700/80 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Alex anything..."
                  className="flex-1 bg-slate-900 text-white placeholder-slate-400 text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
